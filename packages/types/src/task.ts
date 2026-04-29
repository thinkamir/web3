import { z } from 'zod';

export const TaskTypeSchema = z.enum([
  'signin',
  'social',
  'onchain',
  'quiz',
  'content',
  'manual_review',
  'invite',
]);

export const TaskStatusSchema = z.enum([
  'available',
  'locked',
  'in_progress',
  'pending_review',
  'completed',
  'failed',
  'expired',
  'rewarded',
]);

export const VerificationTypeSchema = z.enum([
  'automatic',
  'social',
  'onchain',
  'quiz',
  'content',
  'manual',
  'invite',
]);

export const TaskSchema = z.object({
  id: z.string().uuid(),
  campaign_id: z.string().uuid(),
  type: TaskTypeSchema,
  title: z.string().min(1).max(200),
  description: z.string(),
  reward_points: z.number().int().min(0),
  verification_type: VerificationTypeSchema,
  requirements: z.record(z.unknown()).optional(),
  max_completions: z.number().int().optional(),
  per_user_limit: z.number().int().default(1),
  start_time: z.date().optional(),
  end_time: z.date().optional(),
  status: TaskStatusSchema.default('available'),
  created_at: z.date(),
  updated_at: z.date(),
});

export const TaskSubmissionSchema = z.object({
  id: z.string().uuid(),
  task_id: z.string().uuid(),
  user_id: z.string().uuid(),
  status: TaskStatusSchema,
  proof: z.record(z.unknown()).optional(),
  review_note: z.string().optional(),
  reviewed_by: z.string().uuid().optional(),
  reviewed_at: z.date().optional(),
  created_at: z.date(),
  updated_at: z.date(),
});

export const QuizQuestionSchema = z.object({
  question: z.string(),
  options: z.array(z.string()),
  correct_index: z.number().int().min(0),
  points: z.number().int().default(1),
});

export type TaskType = z.infer<typeof TaskTypeSchema>;
export type TaskStatus = z.infer<typeof TaskStatusSchema>;
export type VerificationType = z.infer<typeof VerificationTypeSchema>;
export type Task = z.infer<typeof TaskSchema>;
export type TaskSubmission = z.infer<typeof TaskSubmissionSchema>;
export type QuizQuestion = z.infer<typeof QuizQuestionSchema>;
