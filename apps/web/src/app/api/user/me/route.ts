import { NextResponse } from 'next/server';

const mockUser = {
  id: '1',
  wallet: '0x1234567890abcdef1234567890abcdef12345678',
  username: 'CryptoHunter',
  avatar: null,
  email: null,
  twitter: '@cryptohunter',
  telegram: null,
  discord: null,
  referral_code: 'CRYPTO123',
  user_level: 5,
  risk_score: 10,
  status: 'active',
  created_at: '2024-01-01T00:00:00Z',
};

export async function GET() {
  return NextResponse.json({ user: mockUser });
}

export async function PATCH(request: Request) {
  try {
    const updates = await request.json();

    const updatedUser = {
      ...mockUser,
      ...updates,
    };

    return NextResponse.json({ user: updatedUser });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
  }
}
