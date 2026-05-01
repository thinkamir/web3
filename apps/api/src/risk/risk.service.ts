import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class RiskService {
  constructor(private prisma: PrismaService) {}

  async evaluateUser(userId: string): Promise<{ risk_score: number; factors: any }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        referrals_sent: true,
        task_submissions: {
          where: { status: 'completed' },
        },
        draw_entries: true,
      },
    });

    if (!user) {
      return { risk_score: 0, factors: {} };
    }

    let score = 0;
    const factors: any = {};

    if (user.referrals_sent.length > 10) {
      score += 20;
      factors.too_many_referrals_sent = true;
    }

    const suspiciousReferrals = user.referrals_sent.filter(r => r.status === 'flagged');
    if (suspiciousReferrals.length > 0) {
      score += suspiciousReferrals.length * 10;
      factors.suspicious_referrals_sent = suspiciousReferrals.length;
    }

    const submissionsPerTask = new Map<string, number>();
    for (const sub of user.task_submissions) {
      const count = submissionsPerTask.get(sub.task_id) || 0;
      submissionsPerTask.set(sub.task_id, count + 1);
    }

    const rapidCompletions = Array.from(submissionsPerTask.values()).filter(c => c > 5);
    if (rapidCompletions.length > 0) {
      score += rapidCompletions.length * 5;
      factors.rapid_completions = rapidCompletions.length;
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { risk_score: score },
    });

    return {
      risk_score: Math.min(score, 100),
      factors,
    };
  }

  async evaluateTaskSubmission(submissionId: string): Promise<{ risk_score: number; flags: string[] }> {
    const submission = await this.prisma.taskSubmission.findUnique({
      where: { id: submissionId },
      include: { user: true },
    });

    if (!submission) {
      return { risk_score: 0, flags: [] };
    }

    let score = 0;
    const flags: string[] = [];

    if (submission.user.risk_score > 60) {
      score += 30;
      flags.push('high_risk_user');
    }

    const recentSubmissions = await this.prisma.taskSubmission.count({
      where: {
        user_id: submission.user_id,
        created_at: { gte: new Date(Date.now() - 60 * 1000) },
      },
    });

    if (recentSubmissions > 10) {
      score += 20;
      flags.push('rapid_submissions');
    }

    await this.prisma.riskEvent.create({
      data: {
        user_id: submission.user_id,
        event_type: 'task_submission',
        event_data: { submission_id: submissionId, flags },
        risk_score: score,
      },
    });

    return { risk_score: score, flags };
  }

  async evaluateReferral(referrerId: string, inviteeId: string): Promise<{ risk_score: number; action: string }> {
    const referrer = await this.prisma.user.findUnique({
      where: { id: referrerId },
      include: { referrals_sent: true },
    });

    if (!referrer) {
      return { risk_score: 0, action: 'allow' };
    }

    let score = 0;

    const sameDeviceInvites = referrer.referrals_sent.filter(r =>
      r.invitee_id !== inviteeId &&
      r.status === 'flagged'
    ).length;

    if (sameDeviceInvites > 0) {
      score += sameDeviceInvites * 15;
    }

    if (referrer.referrals_sent.length > 50) {
      score += 25;
    }

    if (score > 60) {
      await this.prisma.referral.updateMany({
        where: { referrer_id: referrerId, invitee_id: inviteeId },
        data: { status: 'flagged' },
      });

      await this.prisma.riskEvent.create({
        data: {
          user_id: referrerId,
          event_type: 'suspicious_referral',
          event_data: { invitee_id: inviteeId, score },
          risk_score: score,
          action_taken: 'flagged',
        },
      });

      return { risk_score: score, action: 'flag' };
    }

    return { risk_score: score, action: 'allow' };
  }

  async freezeUser(userId: string, reason: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { status: 'frozen' },
    });

    await this.prisma.riskEvent.create({
      data: {
        user_id: userId,
        event_type: 'user_frozen',
        event_data: { reason },
        action_taken: 'frozen',
      },
    });

    return { status: 'frozen' };
  }

  async unfreezeUser(userId: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { status: 'active' },
    });

    return { status: 'active' };
  }

  async getHighRiskUsers(limit = 50) {
    return this.prisma.user.findMany({
      where: { risk_score: { gte: 60 } },
      orderBy: { risk_score: 'desc' },
      take: limit,
    });
  }

  async getRiskEvents(userId?: string, limit = 50) {
    return this.prisma.riskEvent.findMany({
      where: userId ? { user_id: userId } : {},
      orderBy: { created_at: 'desc' },
      take: limit,
    });
  }
}
