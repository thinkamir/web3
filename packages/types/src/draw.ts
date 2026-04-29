import { z } from 'zod';

export const DrawStatusSchema = z.enum([
  'draft',
  'pending_review',
  'scheduled',
  'open',
  'filled',
  'sealed',
  'random_requested',
  'finalized',
  'claiming',
  'completed',
  'cancelled',
  'disputed',
]);

export const DrawTypeSchema = z.enum([
  'points_lottery',
  'whitelist',
  'nft',
  'usdt',
  'fixed_exchange',
  'free',
]);

export const DrawSchema = z.object({
  id: z.string().uuid(),
  campaign_id: z.string().uuid(),
  title: z.string().min(1).max(200),
  description: z.string(),
  type: DrawTypeSchema.default('points_lottery'),
  status: DrawStatusSchema.default('draft'),
  prize_description: z.string(),
  prize_amount: z.number().int(),
  prize_contract: z.string().optional(),
  prize_token_id: z.string().optional(),
  target_points: z.number().int(),
  max_per_user: z.number().int().default(1),
  points_per_ticket: z.number().int().default(1),
  free_entry_enabled: z.boolean().default(false),
  start_time: z.date(),
  end_time: z.date(),
  merkle_root: z.string().optional(),
  total_tickets: z.number().int().default(0),
  randomness: z.string().optional(),
  winning_ticket: z.number().int().optional(),
  created_at: z.date(),
  updated_at: z.date(),
});

export const DrawEntrySchema = z.object({
  id: z.string().uuid(),
  draw_id: z.string().uuid(),
  user_id: z.string().uuid(),
  tickets: z.number().int().min(1),
  start_ticket: z.number().int(),
  end_ticket: z.number().int(),
  points_spent: z.number().int(),
  status: z.enum(['active', 'won', 'lost', 'refunded']).default('active'),
  claimed: z.boolean().default(false),
  created_at: z.date(),
});

export const DrawClaimSchema = z.object({
  id: z.string().uuid(),
  draw_id: z.string().uuid(),
  entry_id: z.string().uuid(),
  user_id: z.string().uuid(),
  proof: z.array(z.string()),
  tx_hash: z.string().optional(),
  claimed_at: z.date().optional(),
});

export type DrawStatus = z.infer<typeof DrawStatusSchema>;
export type DrawType = z.infer<typeof DrawTypeSchema>;
export type Draw = z.infer<typeof DrawSchema>;
export type DrawEntry = z.infer<typeof DrawEntrySchema>;
export type DrawClaim = z.infer<typeof DrawClaimSchema>;
