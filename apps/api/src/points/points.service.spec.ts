import { BadRequestException } from '@nestjs/common';
import { PointsService } from './points.service';

describe('PointsService ledger', () => {
  const txs: any[] = [];
  const prisma: any = {
    pointTransaction: {
      findMany: jest.fn(async ({ where }) => txs.filter((t) => !where?.user_id || t.user_id === where.user_id)),
      findFirst: jest.fn(async ({ where }) => txs.find((t) => Object.entries(where).every(([k, v]) => t[k] === v)) || null),
      findUnique: jest.fn(async ({ where }) => txs.find((t) => t.id === where.id) || null),
      update: jest.fn(async ({ where, data }) => Object.assign(txs.find((t) => t.id === where.id), data)),
      create: jest.fn(async ({ data }) => {
        const tx = { id: `tx-${txs.length + 1}`, created_at: new Date(), ...data };
        txs.push(tx);
        return tx;
      }),
    },
    $transaction: jest.fn((fn) => fn(prisma)),
  };
  const service = new PointsService(prisma);

  beforeEach(() => {
    txs.length = 0;
    jest.clearAllMocks();
  });

  it('grants idempotently by source tuple', async () => {
    const first = await service.grantPoints({ user_id: 'u1', amount: 10, source_type: 'task', source_id: 's1' });
    const second = await service.grantPoints({ user_id: 'u1', amount: 10, source_type: 'task', source_id: 's1' });
    expect(second.id).toBe(first.id);
    expect(txs).toHaveLength(1);
    await expect(service.getBalance('u1')).resolves.toMatchObject({ available: 10, total_earned: 10 });
  });

  it('prevents overspending inside transaction', async () => {
    await service.grantPoints({ user_id: 'u1', amount: 5, source_type: 'seed', source_id: 'seed-1' });
    await expect(service.spendPoints('u1', 10, 'shop', 'order-1')).rejects.toBeInstanceOf(BadRequestException);
  });

  it('does not double-create reversal transaction', async () => {
    const grant = await service.grantPoints({ user_id: 'u1', amount: 7, source_type: 'task', source_id: 's1' });
    const rev1 = await service.reverseTransaction(grant.id, 'bad');
    const rev2 = await service.reverseTransaction(grant.id, 'bad');
    expect(rev2.id).toBe(rev1.id);
    expect(txs.filter((t) => t.source_type === 'admin_reversal')).toHaveLength(1);
  });
});
