import { z } from 'zod';

export const WalletSchema = z.object({
  address: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
});

export const UserSchema = z.object({
  id: z.string().uuid(),
  wallet: z.string(),
  username: z.string().optional(),
  avatar: z.string().url().optional(),
  email: z.string().email().optional(),
  twitter: z.string().optional(),
  telegram: z.string().optional(),
  discord: z.string().optional(),
  referral_code: z.string(),
  inviter_id: z.string().uuid().optional(),
  user_level: z.number().int().min(1).default(1),
  risk_score: z.number().int().min(0).max(100).default(0),
  status: z.enum(['active', 'frozen', 'banned']).default('active'),
  created_at: z.date(),
  updated_at: z.date(),
});

export const AuthNonceSchema = z.object({
  nonce: z.string(),
  wallet: z.string(),
  expires_at: z.date(),
});

export const LoginSignatureSchema = z.object({
  wallet: z.string(),
  signature: z.string(),
  nonce: z.string(),
  timestamp: z.number(),
  domain: z.string(),
});

export type Wallet = z.infer<typeof WalletSchema>;
export type User = z.infer<typeof UserSchema>;
export type AuthNonce = z.infer<typeof AuthNonceSchema>;
export type LoginSignature = z.infer<typeof LoginSignatureSchema>;
