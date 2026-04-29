import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { wallet, signature, nonce } = await request.json();

    if (!wallet || !signature || !nonce) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const mockToken = Buffer.from(JSON.stringify({
      wallet,
      exp: Date.now() + 7 * 24 * 60 * 60 * 1000,
    })).toString('base64');

    return NextResponse.json({
      accessToken: mockToken,
      refreshToken: mockToken,
      user: {
        id: '1',
        wallet,
        username: null,
        referral_code: 'TEST123',
        user_level: 1,
        risk_score: 0,
        status: 'active',
      },
    });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
