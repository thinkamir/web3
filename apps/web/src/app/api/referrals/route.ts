import { NextResponse } from 'next/server';

interface Referral {
  id: string;
  referrer_wallet: string;
  referee_wallet: string;
  referral_code: string;
  bonus_amount: number;
  status: 'pending' | 'completed' | 'cancelled';
  created_at: string;
  completed_at?: string;
}

interface ReferralStats {
  total_referrals: number;
  completed_referrals: number;
  pending_referrals: number;
  total_bonus_earned: number;
}

const referrals: Map<string, Referral> = new Map();
const referralCodes: Map<string, string> = new Map();

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const wallet = searchParams.get('wallet');
  const code = searchParams.get('code');

  if (code) {
    const referrerWallet = referralCodes.get(code);
    if (!referrerWallet) {
      return NextResponse.json(
        { error: 'Invalid referral code' },
        { status: 404 }
      );
    }
    return NextResponse.json({ referrer_wallet: referrerWallet });
  }

  if (!wallet) {
    return NextResponse.json(
      { error: 'Wallet address is required' },
      { status: 400 }
    );
  }

  const userReferrals = Array.from(referrals.values()).filter(
    (r) => r.referrer_wallet.toLowerCase() === wallet.toLowerCase()
  );

  const stats: ReferralStats = {
    total_referrals: userReferrals.length,
    completed_referrals: userReferrals.filter((r) => r.status === 'completed').length,
    pending_referrals: userReferrals.filter((r) => r.status === 'pending').length,
    total_bonus_earned: userReferrals
      .filter((r) => r.status === 'completed')
      .reduce((sum, r) => sum + r.bonus_amount, 0),
  };

  return NextResponse.json({
    referrals: userReferrals,
    stats,
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { referrer_wallet, referee_wallet, referral_code } = body;

    if (!referrer_wallet || !referee_wallet) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (referrer_wallet.toLowerCase() === referee_wallet.toLowerCase()) {
      return NextResponse.json(
        { error: 'Cannot refer yourself' },
        { status: 400 }
      );
    }

    const existingReferral = Array.from(referrals.values()).find(
      (r) => r.referee_wallet.toLowerCase() === referee_wallet.toLowerCase()
    );

    if (existingReferral) {
      return NextResponse.json(
        { error: 'User already referred' },
        { status: 400 }
      );
    }

    const referral: Referral = {
      id: `ref_${Date.now()}`,
      referrer_wallet,
      referee_wallet,
      referral_code: referral_code || `REF${Date.now()}`,
      bonus_amount: 50,
      status: 'pending',
      created_at: new Date().toISOString(),
    };

    referrals.set(referral.id, referral);
    referralCodes.set(referral.referral_code, referrer_wallet);

    return NextResponse.json({
      success: true,
      referral,
      message: `Referral created. ${referral.bonus_amount} bonus points will be awarded when referee completes first task.`,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create referral' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { referral_id, status } = body;

    if (!referral_id || !status) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const referral = referrals.get(referral_id);
    if (!referral) {
      return NextResponse.json(
        { error: 'Referral not found' },
        { status: 404 }
      );
    }

    if (!['pending', 'completed', 'cancelled'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status' },
        { status: 400 }
      );
    }

    referral.status = status;
    if (status === 'completed') {
      referral.completed_at = new Date().toISOString();
    }

    return NextResponse.json({
      success: true,
      referral,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update referral' },
      { status: 500 }
    );
  }
}
