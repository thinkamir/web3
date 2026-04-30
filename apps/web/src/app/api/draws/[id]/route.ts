import { NextResponse } from 'next/server';

interface DrawParticipant {
  wallet: string;
  tickets: number;
  startTicket: number;
  endTicket: number;
  claimed: boolean;
}

interface Draw {
  id: string;
  title: string;
  description: string;
  prize: string;
  prizeAmount: number;
  prizeType: 'usdc' | 'nft' | 'token' | 'wl_spot';
  status: 'open' | 'finalized' | 'claimed';
  ticketsSold: number;
  ticketPrice: number;
  targetTickets: number;
  startTime: string;
  endTime: string;
  winnerCount: number;
  merkleRoot: string;
  randomSeed: string;
  winners: string[];
  participants: DrawParticipant[];
  createdAt: string;
}

const draws: Map<string, Draw> = new Map();

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const draw = draws.get(params.id);

  if (!draw) {
    const mockDraw = generateMockDraw(params.id);
    draws.set(params.id, mockDraw);
    return NextResponse.json({ draw: mockDraw });
  }

  return NextResponse.json({ draw });
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { wallet, tickets } = body;

    if (!wallet || !tickets || tickets < 1) {
      return NextResponse.json(
        { error: 'Invalid request: wallet and tickets required' },
        { status: 400 }
      );
    }

    let draw = draws.get(params.id);

    if (!draw) {
      draw = generateMockDraw(params.id);
      draws.set(params.id, draw);
    }

    if (draw.status !== 'open') {
      return NextResponse.json(
        { error: 'Draw is not open for participation' },
        { status: 400 }
      );
    }

    const startTicket = draw.ticketsSold + 1;
    const endTicket = draw.ticketsSold + tickets;
    draw.ticketsSold += tickets;

    const participant: DrawParticipant = {
      wallet,
      tickets,
      startTicket,
      endTicket,
      claimed: false,
    };

    draw.participants.push(participant);

    return NextResponse.json({
      success: true,
      entry: {
        draw_id: draw.id,
        tickets,
        start_ticket: startTicket,
        end_ticket: endTicket,
        total_tickets: draw.ticketsSold,
        points_spent: tickets * draw.ticketPrice,
      },
      draw: {
        id: draw.id,
        title: draw.title,
        tickets_sold: draw.ticketsSold,
        target_tickets: draw.targetTickets,
        progress: Math.round((draw.ticketsSold / draw.targetTickets) * 100),
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to join draw' },
      { status: 500 }
    );
  }
}

function generateMockDraw(id: string): Draw {
  return {
    id,
    title: 'NFT Giveaway',
    description: 'Win an exclusive NFT from the collection',
    prize: '500 USDC',
    prizeAmount: 500,
    prizeType: 'usdc',
    status: 'open',
    ticketsSold: 0,
    ticketPrice: 10,
    targetTickets: 1000,
    startTime: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    endTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    winnerCount: 1,
    merkleRoot: generateMerkleRoot(),
    randomSeed: generateRandomSeed(),
    winners: [],
    participants: [],
    createdAt: new Date().toISOString(),
  };
}

function generateMerkleRoot(): string {
  const chars = '0123456789abcdef';
  let root = '0x';
  for (let i = 0; i < 64; i++) {
    root += chars[Math.floor(Math.random() * chars.length)];
  }
  return root;
}

function generateRandomSeed(): string {
  const timestamp = Date.now().toString();
  const random = Math.random().toString(36);
  const chars = '0123456789abcdef';
  let seed = '0x';
  for (let i = 0; i < 64; i++) {
    const idx = (timestamp.charCodeAt(i % timestamp.length) + random.charCodeAt(i % random.length)) % chars.length;
    seed += chars[idx];
  }
  return seed;
}
