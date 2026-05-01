import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

type PrismaLike = PrismaService | any;

@Injectable()
export class PointsService {
  constructor(private prisma: PrismaService) {}

  private async availableBalance(db: PrismaLike, userId: string): Promise<number> {
    const transactions = await db.pointTransaction.findMany({ where: { user_id: userId } });
    return transactions.reduce((sum: number, tx: any) => {
      if (tx.status === 'reversed') return sum;
      if (tx.direction === 'credit' && tx.status === 'available') return sum + tx.amount;
      if (tx.direction === 'debit' && ['spent', 'locked'].includes(tx.status)) return sum - tx.amount;
      return sum;
    }, 0);
  }

  async getBalance(userId: string) {
    const transactions = await this.prisma.pointTransaction.findMany({
      where: { user_id: userId },
      orderBy: { created_at: 'desc' },
    });

    let available = 0;
    let pending = 0;
    let locked = 0;
    let totalEarned = 0;

    for (const tx of transactions) {
      if (tx.status === 'reversed') continue;
      if (tx.direction === 'credit') {
        if (tx.status === 'available') available += tx.amount;
        if (tx.status === 'pending') pending += tx.amount;
        if (['available', 'pending'].includes(tx.status)) totalEarned += tx.amount;
      } else if (tx.direction === 'debit') {
        if (tx.status === 'locked') locked += tx.amount;
        if (['spent', 'locked'].includes(tx.status)) available -= tx.amount;
      }
    }

    return { user_id: userId, available, pending, locked, total_earned: totalEarned };
  }

  async getTransactions(userId: string, limit = 50, offset = 0) {
    return this.prisma.pointTransaction.findMany({
      where: { user_id: userId },
      orderBy: { created_at: 'desc' },
      take: Number(limit) || 50,
      skip: Number(offset) || 0,
    });
  }

  async grantPoints(data: {
    user_id: string;
    amount: number;
    source_type: string;
    source_id?: string;
    status?: 'available' | 'pending';
  }) {
    if (data.amount <= 0) throw new BadRequestException('Amount must be positive');
    if (!data.source_type) throw new BadRequestException('source_type is required');

    return this.prisma.$transaction(async (db: PrismaLike) => {
      if (data.source_id) {
        const existing = await db.pointTransaction.findFirst({
          where: { user_id: data.user_id, source_type: data.source_type, source_id: data.source_id },
        });
        if (existing) return existing;
      }

      const status = data.status || 'available';
      const balanceAfter = status === 'available'
        ? (await this.availableBalance(db, data.user_id)) + data.amount
        : await this.availableBalance(db, data.user_id);

      return db.pointTransaction.create({
        data: {
          user_id: data.user_id,
          amount: data.amount,
          direction: 'credit',
          point_type: 'earned',
          status,
          source_type: data.source_type,
          source_id: data.source_id,
          balance_after: balanceAfter,
          confirmed_at: status === 'available' ? new Date() : null,
        },
      });
    });
  }

  async lockPoints(userId: string, amount: number, sourceId: string) {
    if (amount <= 0) throw new BadRequestException('Amount must be positive');
    return this.prisma.$transaction(async (db: PrismaLike) => {
      const existing = await db.pointTransaction.findFirst({
        where: { user_id: userId, source_type: 'draw_participation', source_id: sourceId },
      });
      if (existing) return existing;
      const available = await this.availableBalance(db, userId);
      if (available < amount) throw new BadRequestException('Insufficient points');
      return db.pointTransaction.create({
        data: {
          user_id: userId,
          amount,
          direction: 'debit',
          status: 'locked',
          source_type: 'draw_participation',
          source_id: sourceId,
          balance_after: available - amount,
        },
      });
    });
  }

  async spendPoints(userId: string, amount: number, sourceType: string, sourceId: string) {
    if (amount <= 0) throw new BadRequestException('Amount must be positive');
    return this.prisma.$transaction(async (db: PrismaLike) => {
      const existing = await db.pointTransaction.findFirst({
        where: { user_id: userId, source_type: sourceType, source_id: sourceId },
      });
      if (existing) return existing;
      const available = await this.availableBalance(db, userId);
      if (available < amount) throw new BadRequestException('Insufficient points');
      return db.pointTransaction.create({
        data: {
          user_id: userId,
          amount,
          direction: 'debit',
          status: 'spent',
          source_type: sourceType,
          source_id: sourceId,
          balance_after: available - amount,
        },
      });
    });
  }

  async reverseTransaction(transactionId: string, reason: string) {
    return this.prisma.$transaction(async (db: PrismaLike) => {
      const originalTx = await db.pointTransaction.findUnique({ where: { id: transactionId } });
      if (!originalTx) throw new BadRequestException('Transaction not found');

      const existingReversal = await db.pointTransaction.findFirst({
        where: { source_type: 'admin_reversal', source_id: transactionId },
      });
      if (existingReversal) return existingReversal;
      if (originalTx.status === 'reversed') throw new BadRequestException('Transaction already reversed');

      await db.pointTransaction.update({ where: { id: transactionId }, data: { status: 'reversed' } });
      const currentAvailable = await this.availableBalance(db, originalTx.user_id);
      const balanceAfter = originalTx.direction === 'credit'
        ? currentAvailable - originalTx.amount
        : currentAvailable + originalTx.amount;

      return db.pointTransaction.create({
        data: {
          user_id: originalTx.user_id,
          amount: originalTx.amount,
          direction: originalTx.direction === 'credit' ? 'debit' : 'credit',
          point_type: 'adjustment',
          status: 'available',
          source_type: 'admin_reversal',
          source_id: transactionId,
          balance_after: balanceAfter,
          confirmed_at: new Date(),
        },
      });
    });
  }
}
