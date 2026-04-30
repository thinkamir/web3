import { NextResponse } from 'next/server';

interface RiskAssessment {
  wallet: string;
  risk_score: number;
  risk_level: 'low' | 'medium' | 'high';
  factors: {
    factor: string;
    score: number;
    weight: number;
    description: string;
  }[];
  flags: string[];
  created_at: string;
}

interface RiskFactors {
  account_age_days: number;
  total_transactions: number;
  unique_contracts_interacted: number;
  social_connections: number;
  has_verified_email: boolean;
  has_verified_social: boolean;
  suspicious_patterns: string[];
}

const riskProfiles: Map<string, RiskAssessment> = new Map();

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const wallet = searchParams.get('wallet');

  if (!wallet) {
    return NextResponse.json(
      { error: 'Wallet address is required' },
      { status: 400 }
    );
  }

  let assessment = riskProfiles.get(wallet.toLowerCase());

  if (!assessment) {
    assessment = calculateDefaultRisk(wallet);
  }

  return NextResponse.json({ risk_assessment: assessment });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { wallet, factors } = body;

    if (!wallet) {
      return NextResponse.json(
        { error: 'Wallet address is required' },
        { status: 400 }
      );
    }

    const assessment = calculateRiskScore(wallet, factors);
    riskProfiles.set(wallet.toLowerCase(), assessment);

    return NextResponse.json({
      success: true,
      risk_assessment: assessment,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to calculate risk score' },
      { status: 500 }
    );
  }
}

function calculateDefaultRisk(wallet: string): RiskAssessment {
  const walletLower = wallet.toLowerCase();
  const existing = riskProfiles.get(walletLower);

  if (existing) {
    return existing;
  }

  const factors = [
    {
      factor: 'New Account',
      score: 30,
      weight: 0.3,
      description: 'Account is newly created with no history',
    },
    {
      factor: 'Limited Activity',
      score: 20,
      weight: 0.2,
      description: 'Low number of on-chain transactions',
    },
    {
      factor: 'No Social Verification',
      score: 25,
      weight: 0.25,
      description: 'No verified social accounts linked',
    },
    {
      factor: 'No Referrals',
      score: 15,
      weight: 0.15,
      description: 'Not referred by any existing user',
    },
    {
      factor: 'Single Wallet',
      score: 10,
      weight: 0.1,
      description: 'Only one wallet address detected',
    },
  ];

  const totalScore = factors.reduce((sum, f) => sum + f.score * f.weight, 0);
  const flags: string[] = [];

  if (totalScore > 70) {
    flags.push('HIGH_RISK_ACCOUNT');
  } else if (totalScore > 40) {
    flags.push('MEDIUM_RISK_ACCOUNT');
  }

  const assessment: RiskAssessment = {
    wallet,
    risk_score: Math.round(totalScore),
    risk_level: totalScore > 70 ? 'high' : totalScore > 40 ? 'medium' : 'low',
    factors,
    flags,
    created_at: new Date().toISOString(),
  };

  riskProfiles.set(walletLower, assessment);
  return assessment;
}

function calculateRiskScore(wallet: string, factors: RiskFactors): RiskAssessment {
  const assessmentFactors: RiskAssessment['factors'] = [];
  const flags: string[] = [];

  if (factors.account_age_days < 7) {
    assessmentFactors.push({
      factor: 'New Account',
      score: 40,
      weight: 0.25,
      description: `Account is ${factors.account_age_days} days old`,
    });
    flags.push('NEW_ACCOUNT');
  } else if (factors.account_age_days < 30) {
    assessmentFactors.push({
      factor: 'Young Account',
      score: 20,
      weight: 0.25,
      description: `Account is ${factors.account_age_days} days old`,
    });
  } else {
    assessmentFactors.push({
      factor: 'Established Account',
      score: 0,
      weight: 0.25,
      description: `Account is ${factors.account_age_days} days old`,
    });
  }

  if (factors.total_transactions < 5) {
    assessmentFactors.push({
      factor: 'Low Transaction Count',
      score: 30,
      weight: 0.2,
      description: `Only ${factors.total_transactions} transactions`,
    });
    flags.push('LOW_ACTIVITY');
  } else if (factors.total_transactions < 50) {
    assessmentFactors.push({
      factor: 'Moderate Activity',
      score: 15,
      weight: 0.2,
      description: `${factors.total_transactions} transactions`,
    });
  } else {
    assessmentFactors.push({
      factor: 'High Activity',
      score: 0,
      weight: 0.2,
      description: `${factors.total_transactions} transactions`,
    });
  }

  if (factors.unique_contracts_interacted < 3) {
    assessmentFactors.push({
      factor: 'Limited Contract Interactions',
      score: 20,
      weight: 0.15,
      description: `Interacted with ${factors.unique_contracts_interacted} contracts`,
    });
  } else {
    assessmentFactors.push({
      factor: 'Diverse Interactions',
      score: 0,
      weight: 0.15,
      description: `Interacted with ${factors.unique_contracts_interacted} contracts`,
    });
  }

  let socialScore = 0;
  let socialWeight = 0.2;
  if (factors.has_verified_email) {
    socialScore -= 15;
  }
  if (factors.has_verified_social) {
    socialScore -= 15;
  }
  socialScore = Math.max(0, socialScore);

  assessmentFactors.push({
    factor: 'Social Verification',
    score: socialScore,
    weight: socialWeight,
    description: factors.has_verified_email || factors.has_verified_social
      ? 'Has verified social connections'
      : 'No verified social connections',
  });

  if (factors.social_connections < 3) {
    assessmentFactors.push({
      factor: 'Limited Social Graph',
      score: 15,
      weight: 0.1,
      description: `Only ${factors.social_connections} social connections`,
    });
  } else {
    assessmentFactors.push({
      factor: 'Strong Social Graph',
      score: 0,
      weight: 0.1,
      description: `${factors.social_connections} social connections`,
    });
  }

  if (factors.suspicious_patterns.length > 0) {
    assessmentFactors.push({
      factor: 'Suspicious Patterns',
      score: 50,
      weight: 0.1,
      description: `Detected: ${factors.suspicious_patterns.join(', ')}`,
    });
    flags.push('SUSPICIOUS_ACTIVITY');
  }

  const totalScore = assessmentFactors.reduce((sum, f) => sum + f.score * f.weight, 0);

  const risk_level: RiskAssessment['risk_level'] =
    totalScore > 70 ? 'high' : totalScore > 40 ? 'medium' : 'low';

  if (totalScore > 70) {
    flags.push('HIGH_RISK_ACCOUNT');
  } else if (totalScore > 40) {
    flags.push('MEDIUM_RISK_ACCOUNT');
  } else {
    flags.push('LOW_RISK_ACCOUNT');
  }

  return {
    wallet,
    risk_score: Math.round(totalScore),
    risk_level,
    factors: assessmentFactors,
    flags,
    created_at: new Date().toISOString(),
  };
}
