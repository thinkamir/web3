import { NextResponse } from 'next/server';

interface Draw {
  id: string;
  status: 'open' | 'finalized' | 'claimed';
  ticketsSold: number;
  winnerCount: number;
  merkleRoot: string;
  randomSeed: string;
  winners: string[];
  participants: { wallet: string; tickets: number; startTicket: number; endTicket: number }[];
}

const draws: Map<string, Draw> = new Map();

function hashLeaves(leaves: string[]): string {
  const sorted = leaves.sort();
  let combined = sorted.join(',');

  let hash = 0;
  for (let i = 0; i < combined.length; i++) {
    const char = combined.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }

  return '0x' + Math.abs(hash).toString(16).padStart(64, '0');
}

function generateMerkleProof(leaves: string[], targetIndex: number): string[] {
  const proof: string[] = [];
  let currentLevel = [...leaves];

  while (currentLevel.length > 1) {
    const nextLevel: string[] = [];

    for (let i = 0; i < currentLevel.length; i += 2) {
      const left = currentLevel[i];
      const right = i + 1 < currentLevel.length ? currentLevel[i + 1] : left;
      nextLevel.push(hashLeaves([left, right]));

      if (i === targetIndex || i + 1 === targetIndex) {
        proof.push(i === targetIndex ? right : left);
      }
    }

    currentLevel = nextLevel;
  }

  return proof;
}

function VRF_randomSelection(seed: string, totalTickets: number, winnerCount: number): number[] {
  const winners: number[] = [];
  let seedHash = seed;

  while (winners.length < winnerCount) {
    seedHash = hashLeaves([seedHash]);
    const seedNum = parseInt(seedHash.slice(2, 18), 16);
    const winningTicket = seedNum % totalTickets;

    if (!winners.includes(winningTicket)) {
      winners.push(winningTicket);
    }
  }

  return winners.sort((a, b) => a - b);
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const draw = draws.get(params.id);

    if (!draw) {
      return NextResponse.json(
        { error: 'Draw not found' },
        { status: 404 }
      );
    }

    if (draw.status !== 'open') {
      return NextResponse.json(
        { error: 'Draw is already finalized' },
        { status: 400 }
      );
    }

    if (draw.participants.length === 0) {
      return NextResponse.json(
        { error: 'No participants in draw' },
        { status: 400 }
      );
    }

    const leaves = draw.participants.map(p =>
      hashLeaves([p.wallet, p.tickets.toString(), p.startTicket.toString()])
    );

    draw.merkleRoot = hashLeaves(leaves);
    draw.randomSeed = hashLeaves([draw.randomSeed, Date.now().toString(), draw.merkleRoot]);

    const winningTickets = VRF_randomSelection(
      draw.randomSeed,
      draw.ticketsSold,
      draw.winnerCount
    );

    draw.winners = winningTickets.map(ticket => {
      const participant = draw.participants.find(
        p => ticket >= p.startTicket && ticket <= p.endTicket
      );
      return participant?.wallet || '0x0000000000000000000000000000000000000000';
    }).filter(w => w !== '0x0000000000000000000000000000000000000000');

    draw.status = 'finalized';

    const merkleProofs: Record<string, { proof: string[]; leaf: string }> = {};

    draw.winners.forEach((winner, idx) => {
      const participant = draw.participants.find(p => p.wallet === winner);
      if (participant) {
        const leafIndex = draw.participants.indexOf(participant);
        merkleProofs[winner] = {
          proof: generateMerkleProof(leaves, leafIndex),
          leaf: leaves[leafIndex],
        };
      }
    });

    return NextResponse.json({
      success: true,
      draw: {
        id: draw.id,
        status: draw.status,
        winner_count: draw.winners.length,
        winners: draw.winners,
        merkle_root: draw.merkleRoot,
        random_seed: draw.randomSeed,
        merkle_proofs: merkleProofs,
      },
      message: `Draw finalized with ${draw.winners.length} winner(s)`,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to finalize draw' },
      { status: 500 }
    );
  }
}
