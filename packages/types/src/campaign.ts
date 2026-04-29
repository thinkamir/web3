import { z } from 'zod';

export const CampaignStatusSchema = z.enum([
  'draft',
  'pending_review',
  'scheduled',
  'open',
  'paused',
  'filled',
  'sealed',
  'random_requested',
  'finalized',
  'claiming',
  'completed',
  'cancelled',
  'disputed',
]);

export const CampaignSchema = z.object({
  id: z.string().uuid(),
  project_id: z.string().uuid(),
  title: z.string().min(1).max(200),
  description: z.string(),
  status: CampaignStatusSchema.default('draft'),
  start_time: z.date(),
  end_time: z.date(),
  region_restriction: z.array(z.string()).optional(),
  risk_level: z.enum(['low', 'medium', 'high']).default('low'),
  reward_config: z.record(z.unknown()),
  risk_config: z.record(z.unknown()),
  terms: z.string().optional(),
  created_at: z.date(),
  updated_at: z.date(),
});

export const ProjectSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100),
  website: z.string().url().optional(),
  logo: z.string().url().optional(),
  description: z.string().optional(),
  owner_user_id: z.string().uuid(),
  verification_status: z.enum(['pending', 'verified', 'rejected', 'suspended', 'high_risk']).default('pending'),
  risk_level: z.enum(['low', 'medium', 'high']).default('low'),
  social_links: z.object({
    twitter: z.string().optional(),
    telegram: z.string().optional(),
    discord: z.string().optional(),
  }).optional(),
  created_at: z.date(),
  updated_at: z.date(),
});

export const ProjectMemberRoleSchema = z.enum(['owner', 'admin', 'analyst', 'developer', 'finance']);

export const ProjectMemberSchema = z.object({
  id: z.string().uuid(),
  project_id: z.string().uuid(),
  user_id: z.string().uuid(),
  role: ProjectMemberRoleSchema,
  created_at: z.date(),
});

export type CampaignStatus = z.infer<typeof CampaignStatusSchema>;
export type Campaign = z.infer<typeof CampaignSchema>;
export type Project = z.infer<typeof ProjectSchema>;
export type ProjectMemberRole = z.infer<typeof ProjectMemberRoleSchema>;
export type ProjectMember = z.infer<typeof ProjectMemberSchema>;
