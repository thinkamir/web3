import { z } from 'zod';

export const PointTypeSchema = z.enum(['earned', 'promo', 'locked']);
export const PointStatusSchema = z.enum(['pending', 'available', 'locked', 'spent', 'reversed', 'expired']);
export const PointSourceTypeSchema = z.enum([
  'task_reward',
  'signin',
  'referral_reward',
  'promo',
  'draw_participation',
  'draw_refund',
  'admin_grant',
  'admin_reversal',
]);

export const PointTransactionSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  amount: z.number().int(),
  direction: z.enum(['credit', 'debit']),
  point_type: PointTypeSchema.default('earned'),
  status: PointStatusSchema.default('available'),
  source_type: PointTypeSchema,
  source_id: z.string().uuid().optional(),
  balance_after: z.number().int(),
  risk_score: z.number().int().min(0).max(100).optional(),
  created_at: z.date(),
  confirmed_at: z.date().optional(),
});

export const PointBalanceSchema = z.object({
  user_id: z.string().uuid(),
  total_earned: z.number().int().default(0),
  available: z.number().int().default(0),
  pending: z.number().int().default(0),
  locked: z.number().int().default(0),
  updated_at: z.date(),
});

export const PointsGrantSchema = z.object({
  user_id: z.string().uuid(),
  amount: z.number().int().min(1),
  point_type: PointTypeSchema.default('earned'),
  source_type: PointSourceTypeSchema,
  source_id: z.string().uuid().optional(),
  reason: z.string().optional(),
});

export type PointType = z.infer<typeof PointTypeSchema>;
export type PointStatus = z.infer<typeof PointStatusSchema>;
export type PointSourceType = z.infer<typeof PointSourceTypeSchema>;
export type PointTransaction = z.infer<typeof PointTransactionSchema>;
export type PointBalance = z.infer<typeof PointBalanceSchema>;
export type PointsGrant = z.infer<typeof PointsGrantSchema>;
