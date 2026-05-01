import { BadRequestException } from '@nestjs/common';
import { TaskService } from './task.service';

describe('TaskService core task loop', () => {
  let prisma: any;
  let pointsService: { grantPoints: jest.Mock };
  let service: TaskService;

  beforeEach(() => {
    prisma = {
      task: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
      },
      taskSubmission: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(async ({ data }) => ({
          id: data.task_id ? `${data.task_id}-${data.user_id}` : 'submission-1',
          created_at: new Date(),
          ...data,
        })),
        update: jest.fn(async ({ where, data }) => ({
          id: where.id,
          ...data,
        })),
      },
    };

    pointsService = {
      grantPoints: jest.fn(async (payload) => payload),
    };

    service = new TaskService(prisma, pointsService as any);
  });

  it('rejects duplicate task submission', async () => {
    prisma.task.findUnique.mockResolvedValueOnce({
      id: 'task-1',
      status: 'available',
      verification_type: 'manual',
      reward_points: 10,
    });
    prisma.taskSubmission.findUnique.mockResolvedValueOnce({
      id: 'existing-submission',
      task_id: 'task-1',
      user_id: 'user-1',
    });

    await expect(service.submitTask('task-1', 'user-1', { url: 'https://proof' })).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.taskSubmission.create).not.toHaveBeenCalled();
    expect(pointsService.grantPoints).not.toHaveBeenCalled();
  });

  it('creates completed submission and grants points for automatic task verification', async () => {
    prisma.task.findUnique.mockResolvedValueOnce({
      id: 'task-1',
      status: 'available',
      verification_type: 'automatic',
      reward_points: 25,
    });
    prisma.taskSubmission.findUnique.mockResolvedValueOnce(null);

    const submission = await service.submitTask('task-1', 'user-1', { txHash: '0xabc' });

    expect(prisma.taskSubmission.create).toHaveBeenCalledWith({
      data: {
        task_id: 'task-1',
        user_id: 'user-1',
        status: 'completed',
        proof: { txHash: '0xabc' },
      },
    });
    expect(submission).toMatchObject({
      task_id: 'task-1',
      user_id: 'user-1',
      status: 'completed',
    });
    expect(pointsService.grantPoints).toHaveBeenCalledWith({
      user_id: 'user-1',
      amount: 25,
      source_type: 'task_reward',
      source_id: 'task-1',
    });
  });

  it('creates a pending review submission and does not grant points for manual verification tasks', async () => {
    prisma.task.findUnique.mockResolvedValueOnce({
      id: 'task-2',
      status: 'available',
      verification_type: 'manual',
      reward_points: 30,
    });
    prisma.taskSubmission.findUnique.mockResolvedValueOnce(null);

    const submission = await service.submitTask('task-2', 'user-1', { screenshot: 'proof.png' });

    expect(prisma.taskSubmission.create).toHaveBeenCalledWith({
      data: {
        task_id: 'task-2',
        user_id: 'user-1',
        status: 'pending_review',
        proof: { screenshot: 'proof.png' },
      },
    });
    expect(submission).toMatchObject({
      task_id: 'task-2',
      user_id: 'user-1',
      status: 'pending_review',
    });
    expect(pointsService.grantPoints).not.toHaveBeenCalled();
  });

  it('grants points when a manual review is approved', async () => {
    prisma.taskSubmission.findUnique.mockResolvedValueOnce({
      id: 'submission-1',
      task_id: 'task-1',
      user_id: 'user-1',
      task: {
        reward_points: 40,
      },
    });

    const reviewed = await service.reviewSubmission('submission-1', true, 'looks good');

    expect(prisma.taskSubmission.update).toHaveBeenCalledWith({
      where: { id: 'submission-1' },
      data: expect.objectContaining({
        status: 'completed',
        review_note: 'looks good',
        reviewed_at: expect.any(Date),
      }),
    });
    expect(reviewed).toMatchObject({ id: 'submission-1', status: 'completed', review_note: 'looks good' });
    expect(pointsService.grantPoints).toHaveBeenCalledWith({
      user_id: 'user-1',
      amount: 40,
      source_type: 'task_reward',
      source_id: 'task-1',
    });
  });

  it('prevents signing in twice on the same day', async () => {
    prisma.taskSubmission.findFirst.mockResolvedValueOnce({
      id: 'signin-1',
      user_id: 'user-1',
      status: 'completed',
    });

    await expect(service.processSignin('user-1')).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.task.findFirst).not.toHaveBeenCalled();
    expect(prisma.taskSubmission.create).not.toHaveBeenCalled();
    expect(pointsService.grantPoints).not.toHaveBeenCalled();
  });

  it('creates a completed quiz submission and grants points when the user passes', async () => {
    prisma.task.findUnique.mockResolvedValueOnce({
      id: 'quiz-1',
      type: 'quiz',
      reward_points: 50,
      requirements: {
        questions: [
          { correct_index: 1 },
          { correct_index: 2 },
          { correct_index: 0 },
        ],
      },
    });

    const result = await service.verifyQuizAnswer('quiz-1', 'user-1', [1, 2, 0]);

    expect(prisma.taskSubmission.create).toHaveBeenCalledWith({
      data: {
        task_id: 'quiz-1',
        user_id: 'user-1',
        status: 'completed',
        proof: {
          answers: [1, 2, 0],
          correct_count: 3,
          total: 3,
        },
      },
    });
    expect(result).toMatchObject({
      passed: true,
      correct_count: 3,
      total: 3,
    });
    expect(result.submission).toMatchObject({
      task_id: 'quiz-1',
      user_id: 'user-1',
      status: 'completed',
    });
    expect(pointsService.grantPoints).toHaveBeenCalledWith({
      user_id: 'user-1',
      amount: 50,
      source_type: 'task_reward',
      source_id: 'quiz-1',
    });
  });
});
