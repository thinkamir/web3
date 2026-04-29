import { NextResponse } from 'next/server';

const mockDraws = [
  {
    id: '1',
    title: 'NFT Giveaway',
    description: 'Win exclusive NFT from the latest collection',
    type: 'nft',
    prize: '500 USDC',
    prize_amount: 500,
    status: 'open',
    progress: 65,
    tickets: 1234,
    target: 2000,
    points_per_ticket: 10,
    end_time: '2024-02-01T00:00:00Z',
  },
  {
    id: '2',
    title: 'Whitelist Spots',
    description: 'Get WL for upcoming mint',
    type: 'whitelist',
    prize: '100 WL Spots',
    prize_amount: 100,
    status: 'open',
    progress: 80,
    tickets: 800,
    target: 1000,
    points_per_ticket: 50,
    end_time: '2024-02-15T00:00:00Z',
  },
  {
    id: '3',
    title: 'Token Airdrop',
    description: 'Free token airdrop for active participants',
    type: 'token',
    prize: '10,000 TOKEN',
    prize_amount: 10000,
    status: 'open',
    progress: 45,
    tickets: 450,
    target: 1000,
    points_per_ticket: 5,
    end_time: '2024-02-20T00:00:00Z',
  },
  {
    id: '4',
    title: 'Genesis NFT',
    description: 'Limited genesis collection for early supporters',
    type: 'nft',
    prize: '10 Genesis NFT',
    prize_amount: 10,
    status: 'finalized',
    progress: 100,
    tickets: 500,
    target: 500,
    points_per_ticket: 100,
    end_time: '2024-01-15T00:00:00Z',
    winner: '0xabcd...efgh',
  },
];

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');

  let filteredDraws = mockDraws;

  if (status && status !== 'all') {
    filteredDraws = filteredDraws.filter(draw => draw.status === status);
  }

  return NextResponse.json({ draws: filteredDraws });
}

export async function POST(request: Request) {
  try {
    const { draw_id, tickets } = await request.json();

    if (!draw_id || !tickets) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      entry: {
        draw_id,
        tickets,
        start_ticket: 1001,
        end_ticket: 1001 + tickets - 1,
        points_spent: tickets * 10,
      },
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to join draw' }, { status: 500 });
  }
}
