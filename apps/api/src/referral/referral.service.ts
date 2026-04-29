import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PointsService } from '../points/points.service';

@Injectable()
export class ReferralService {
  constructor(
    private prisma: PrismaService,
    private pointsService: PointsService,
  ) {}

  async getReferralStats(userId: string) {
    const referrals = await this.prisma.referral.findMany({
      where: { referrer_id: userId },
      include: {
        invitee: {
          select: {
            id: true,
            wallet: true,
            created_at: true,
          },
        },
      },
    });

    const pending = referrals.filter(r => r.status === 'pending');
    const confirmed = referrals.filter(r => r.status === 'confirmed');

    let pendingRewards = 0;
    for (const ref of pending) {
      pendingRewards += ref.reward_amount;
    }

    return {
      total_referrals: referrals.length,
      valid_referrals: confirmed.length,
      pending_referrals: pending.length,
      total_rewards_earned: confirmed.reduce((sum, r) => sum + r.reward_amount, 0),
      pending_rewards: pendingRewards,
      referrals: referrals.map(r => ({
        id: r.id,
        invitee_wallet: r.invitee.wallet,
        invited_at: r.invitee.created_at,
        status: r.status,
        reward_amount: r.reward_amount,
      })),
    };
  }

  async processReferralReward(referrerId: string, inviteeId: string, taskId: string, taskReward: number) {
    const referrer = await this.prisma.user.findUnique({
      where: { id: referrerId },
    });

    if (!referrer) {
      throw new NotFoundException('Referrer not found');
    }

    if (referrer.risk_score > 60) {
      await this.prisma.referral.create({
        data: {
          referrer_id: referrerId,
          invitee_id: inviteeId,
          referral_type: 'task_reward',
          reward_amount: 0,
          status: 'flagged',
        },
      });
      return { status: 'flagged', reason: 'High risk referrer' };
    }

    const rewardAmount = Math.floor(taskReward * 0.05);

    await this.prisma.referral.create({
      data: {
        referrer_id: referrerId,
        invitee_id: inviteeId,
        referral_type: 'task_reward',
        reward_amount: rewardAmount,
        status: 'pending',
      },
    });

    return {
      status: 'pending',
      reward_amount: rewardAmount,
      message: `Referral reward of ${rewardAmount} AP is pending`,
    };
  }

  async releaseReferralRewards(userId: string) {
    const pendingReferrals = await this.prisma.referral.findMany({
      where: {
        referrer_id: userId,
        status: 'pending',
      },
    });

    let totalReleased = 0;

    for (const referral of pendingReferrals) {
      if (referral.reward_amount > 0) {
        await this.pointsService.grantPoints({
          user_id: userId,
          amount: referral.reward_amount,
          source_type: 'referral_reward',
          source_id: referral.id,
        });

        await this.prisma.referral.update({
          where: { id: referral.id },
          data: {
            status: 'confirmed',
            confirmed_at: new Date(),
          },
        });

        totalReleased += referral.reward_amount;
      }
    }

    return {
      released_count: pendingReferrals.length,
      total_released: totalReleased,
    };
  }

  async checkAndBindReferral(inviteeWallet: string, referralCode: string) {
    if (!referralCode) {
      return { bound: false, reason: 'No referral code provided' };
    }

    const inviter = await this.prisma.user.findUnique({
      where: { referral_code: referralCode },
    });

    if (!inviter) {
      return { bound: false, reason: 'Invalid referral code' };
    }

    const existingUser = await this.prisma.user.findUnique({
      where: { wallet: inviteeWallet.toLowerCase() },
    });

    if (!existingUser) {
      return { bound: false, reason: 'User does not exist yet' };
    }

    if (existingUser.inviter_id) {
      return { bound: false, reason: 'User already has an inviter' };
    }

    if (existingUser.id === inviter.id) {
      return { bound: false, reason: 'Cannot refer yourself' };
    }

    await this.prisma.user.update({
      where: { id: existingUser.id },
      data: { inviter_id: inviter.id },
    });

    await this.prisma.referral.create({
      data: {
        referrer_id: inviter.id,
        invitee_id: existingUser.id,
        referral_type: 'registration',
        reward_amount: 1,
        status: 'pending',
      },
    });

    return {
      bound: true,
      inviter_wallet: inviter.wallet,
    };
  }

  async flagSuspiciousReferral(referralId: string, reason: string) {
    const referral = await this.prisma.referral.findUnique({
      where: { id: referralId },
    });

    if (!referral) {
      throw new NotFoundException('Referral not found');
    }

    await this.prisma.referral.update({
      where: { id: referralId },
      data: { status: 'flagged' },
    });

    await this.prisma.riskEvent.create({
      data: {
        user_id: referral.referrer_id,
        event_type: 'suspicious_referral',
        event_data: { referral_id: referralId, reason },
        action_taken: 'flagged',
      },
    });

    return { status: 'flagged' };
  }
}
