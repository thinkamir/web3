import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PointsService {
  constructor(private prisma: PrismaService) {}

  async getBalance(userId: string) {
    const transactions = await this.prisma.pointTransaction.findMany({
      where: { user_id: userId },
      orderBy: { created_at: 'desc' },
    });

    let available = 0;
    let pending = 0;
    let locked = 0;

    for (const tx of transactions) {
      if (tx.direction === 'credit' && tx.status === 'available') {
        available += tx.amount;
      } else if (tx.status === 'pending') {
        pending += tx.amount;
      } else if (tx.status === 'locked') {
        locked += tx.amount;
      }
    }

    return {
      user_id: userId,
      available,
      pending,
      locked,
      total_earned: available + pending,
    };
  }

  async getTransactions(userId: string, limit = 50, offset = 0) {
    return this.prisma.pointTransaction.findMany({
      where: { user_id: userId },
      orderBy: { created_at: 'desc' },
      take: limit,
      skip: offset,
    });
  }

  async grantPoints(data: {
    user_id: string;
    amount: number;
    source_type: string;
    source_id?: string;
    status?: 'available' | 'pending';
  }) {
    if (data.amount <= 0) {
      throw new BadRequestException('Amount must be positive');
    }

    const currentBalance = await this.getBalance(data.user_id);
    const balanceAfter = currentBalance.available + data.amount;

    const tx = await this.prisma.pointTransaction.create({
      data: {
        user_id: data.user_id,
        amount: data.amount,
        direction: 'credit',
        point_type: 'earned',
        status: data.status || 'available',
        source_type: data.source_type,
        source_id: data.source_id,
        balance_after: balanceAfter,
        confirmed_at: data.status === 'available' ? new Date() : null,
      },
    });

    return tx;
  }

  async lockPoints(userId: string, amount: number, sourceId: string) {
    const balance = await this.getBalance(userId);
    if (balance.available < amount) {
      throw new BadRequestException('Insufficient points');
    }

    const tx = await this.prisma.pointTransaction.create({
      data: {
        user_id: userId,
        amount,
        direction: 'debit',
        status: 'locked',
        source_type: 'draw_participation',
        source_id: sourceId,
        balance_after: balance.available - amount,
      },
    });

    return tx;
  }

  async spendPoints(userId: string, amount: number, sourceType: string, sourceId: string) {
    const balance = await this.getBalance(userId);
    if (balance.available < amount) {
      throw new BadRequestException('Insufficient points');
    }

    const tx = await this.prisma.pointTransaction.create({
      data: {
        user_id: userId,
        amount,
        direction: 'debit',
        status: 'spent',
        source_type: sourceType,
        source_id: sourceId,
        balance_after: balance.available - amount,
      },
    });

    return tx;
  }

  async reverseTransaction(transactionId: string, reason: string) {
    const originalTx = await this.prisma.pointTransaction.findUnique({
      where: { id: transactionId },
    });

    if (!originalTx) {
      throw new BadRequestException('Transaction not found');
    }

    if (originalTx.status === 'reversed') {
      throw new BadRequestException('Transaction already reversed');
    }

    const reversalTx = await this.prisma.pointTransaction.create({
      data: {
        user_id: originalTx.user_id,
        amount: originalTx.amount,
        direction: originalTx.direction === 'credit' ? 'debit' : 'credit',
        status: 'reversed',
        source_type: 'admin_reversal',
        source_id: transactionId,
        balance_after: originalTx.balance_after,
      },
    });

    await this.prisma.pointTransaction.update({
      where: { id: transactionId },
      data: { status: 'reversed' },
    });

    return reversalTx;
  }
}
