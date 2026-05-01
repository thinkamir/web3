import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PointsService } from '../points/points.service';

@Injectable()
export class TaskService {
  constructor(
    private prisma: PrismaService,
    private pointsService: PointsService,
  ) {}

  async findAll(filters: {
    campaign_id?: string;
    type?: string;
    status?: string;
    limit?: number;
    offset?: number;
  }) {
    return this.prisma.task.findMany({
      where: {
        ...(filters.campaign_id && { campaign_id: filters.campaign_id }),
        ...(filters.type && { type: filters.type }),
        ...(filters.status && { status: filters.status }),
      },
      include: {
        campaign: {
          select: {
            id: true,
            title: true,
            project: {
              select: {
                id: true,
                name: true,
                logo: true,
              },
            },
          },
        },
      },
      take: filters.limit || 50,
      skip: filters.offset || 0,
      orderBy: { created_at: 'desc' },
    });
  }

  async findById(taskId: string) {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
      include: {
        campaign: {
          select: {
            id: true,
            title: true,
            project: {
              select: {
                id: true,
                name: true,
                logo: true,
                twitter: true,
                telegram: true,
              },
            },
          },
        },
      },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    return task;
  }

  async submitTask(taskId: string, userId: string, proof: any) {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    if (task.status !== 'available') {
      throw new BadRequestException('Task is not available');
    }

    const existingSubmission = await this.prisma.taskSubmission.findUnique({
      where: {
        task_id_user_id: { task_id: taskId, user_id: userId },
      },
    });

    if (existingSubmission) {
      throw new BadRequestException('Task already submitted');
    }

    const submission = await this.prisma.taskSubmission.create({
      data: {
        task_id: taskId,
        user_id: userId,
        status: task.verification_type === 'automatic' ? 'completed' : 'pending_review',
        proof,
      },
    });

    if (task.verification_type === 'automatic') {
      await this.pointsService.grantPoints({
        user_id: userId,
        amount: task.reward_points,
        source_type: 'task_reward',
        source_id: taskId,
      });
    }

    return submission;
  }

  async reviewSubmission(submissionId: string, approved: boolean, note?: string) {
    const submission = await this.prisma.taskSubmission.findUnique({
      where: { id: submissionId },
      include: { task: true },
    });

    if (!submission) {
      throw new NotFoundException('Submission not found');
    }

    const updated = await this.prisma.taskSubmission.update({
      where: { id: submissionId },
      data: {
        status: approved ? 'completed' : 'failed',
        review_note: note,
        reviewed_at: new Date(),
      },
    });

    if (approved) {
      await this.pointsService.grantPoints({
        user_id: submission.user_id,
        amount: submission.task.reward_points,
        source_type: 'task_reward',
        source_id: submission.task_id,
      });
    }

    return updated;
  }

  async processSignin(userId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const lastSignin = await this.prisma.taskSubmission.findFirst({
      where: {
        user_id: userId,
        status: 'completed',
        created_at: { gte: today },
        task: { type: 'signin' },
      },
    });

    if (lastSignin) {
      throw new BadRequestException('Already signed in today');
    }

    const yesterdaySignin = await this.prisma.taskSubmission.findFirst({
      where: {
        user_id: userId,
        status: 'completed',
        created_at: { gte: yesterday, lt: today },
        task: { type: 'signin' },
      },
    });

    const consecutiveDays: number = yesterdaySignin ? 2 : 1;

    let rewardPoints = consecutiveDays;
    if (consecutiveDays >= 7) {
      rewardPoints = 10;
    }

    const signinTask = await this.prisma.task.findFirst({
      where: { type: 'signin', status: 'available' },
    });

    if (!signinTask) {
      throw new NotFoundException('Signin task not found');
    }

    const submission = await this.prisma.taskSubmission.create({
      data: {
        task_id: signinTask.id,
        user_id: userId,
        status: 'completed',
        proof: { consecutive_days: consecutiveDays },
      },
    });

    await this.pointsService.grantPoints({
      user_id: userId,
      amount: rewardPoints,
      source_type: 'signin',
      source_id: signinTask.id,
    });

    return {
      submission,
      reward_points: rewardPoints,
      consecutive_days: consecutiveDays,
    };
  }

  async verifyQuizAnswer(taskId: string, userId: string, answers: number[]) {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
    });

    if (!task || task.type !== 'quiz') {
      throw new NotFoundException('Quiz task not found');
    }

    const requirements = task.requirements as { questions: any[] };
    const questions = requirements.questions || [];

    let correctCount = 0;
    for (let i = 0; i < Math.min(answers.length, questions.length); i++) {
      if (answers[i] === questions[i].correct_index) {
        correctCount++;
      }
    }

    const totalQuestions = questions.length;
    const passed = correctCount >= Math.ceil(totalQuestions * 0.6);

    const submission = await this.prisma.taskSubmission.create({
      data: {
        task_id: taskId,
        user_id: userId,
        status: passed ? 'completed' : 'failed',
        proof: { answers, correct_count: correctCount, total: totalQuestions },
      },
    });

    if (passed) {
      const rewardPoints = Math.floor((correctCount / totalQuestions) * task.reward_points);
      await this.pointsService.grantPoints({
        user_id: userId,
        amount: rewardPoints || task.reward_points,
        source_type: 'task_reward',
        source_id: taskId,
      });
    }

    return {
      submission,
      correct_count: correctCount,
      total: totalQuestions,
      passed,
    };
  }
}
