import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        wallet: true,
        username: true,
        avatar: true,
        email: true,
        twitter: true,
        telegram: true,
        discord: true,
        referral_code: true,
        user_level: true,
        risk_score: true,
        status: true,
        created_at: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async updateProfile(userId: string, data: {
    username?: string;
    avatar?: string;
    email?: string;
    twitter?: string;
    telegram?: string;
    discord?: string;
  }) {
    return this.prisma.user.update({
      where: { id: userId },
      data,
      select: {
        id: true,
        wallet: true,
        username: true,
        avatar: true,
        email: true,
        twitter: true,
        telegram: true,
        discord: true,
        referral_code: true,
        user_level: true,
        risk_score: true,
        status: true,
      },
    });
  }

  async getStats(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        task_submissions: {
          where: { status: 'completed' },
        },
        draw_entries: true,
        referrals: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const pointsBalance = await this.prisma.pointTransaction.aggregate({
      where: { user_id: userId },
      _sum: { amount: true },
    });

    return {
      tasks_completed: user.task_submissions.length,
      draws_joined: user.draw_entries.length,
      referrals_count: user.referrals.length,
      total_points: pointsBalance._sum.amount || 0,
    };
  }

  async getByWallet(wallet: string) {
    const user = await this.prisma.user.findUnique({
      where: { wallet: wallet.toLowerCase() },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }
}
