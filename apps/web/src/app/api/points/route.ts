import { NextResponse } from 'next/server';

interface PointTransaction {
  id: string;
  wallet: string;
  type: 'earned' | 'spent' | 'locked' | 'unlocked' | 'referral_bonus' | 'task_reward' | 'draw_participation';
  amount: number;
  balance_after: number;
  source: string;
  reference_id?: string;
  status: 'completed' | 'pending' | 'cancelled';
  created_at: string;
}

interface PointLedger {
  wallet: string;
  total_points: number;
  available_points: number;
  locked_points: number;
  pending_points: number;
  transactions: PointTransaction[];
}

const ledgers: Map<string, PointLedger> = new Map();

const initializeLedger = (wallet: string): PointLedger => {
  if (!ledgers.has(wallet)) {
    ledgers.set(wallet, {
      wallet,
      total_points: 0,
      available_points: 0,
      locked_points: 0,
      pending_points: 0,
      transactions: [],
    });
  }
  return ledgers.get(wallet)!;
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const wallet = searchParams.get('wallet');

  if (!wallet) {
    return NextResponse.json(
      { error: 'Wallet address is required' },
      { status: 400 }
    );
  }

  const ledger = initializeLedger(wallet);

  return NextResponse.json({
    wallet: ledger.wallet,
    total_points: ledger.total_points,
    available_points: ledger.available_points,
    locked_points: ledger.locked_points,
    pending_points: ledger.pending_points,
    transactions: ledger.transactions.slice(0, 50),
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { wallet, type, amount, source, reference_id } = body;

    if (!wallet || !type || !amount || !source) {
      return NextResponse.json(
        { error: 'Missing required fields: wallet, type, amount, source' },
        { status: 400 }
      );
    }

    if (amount <= 0) {
      return NextResponse.json(
        { error: 'Amount must be positive' },
        { status: 400 }
      );
    }

    const ledger = initializeLedger(wallet);

    let newTotal = ledger.total_points;
    let newAvailable = ledger.available_points;
    let newLocked = ledger.locked_points;
    let newPending = ledger.pending_points;

    switch (type) {
      case 'earned':
      case 'task_reward':
      case 'referral_bonus':
        newTotal += amount;
        newAvailable += amount;
        break;

      case 'spent':
      case 'draw_participation':
        if (newAvailable < amount) {
          return NextResponse.json(
            { error: 'Insufficient points' },
            { status: 400 }
          );
        }
        newAvailable -= amount;
        break;

      case 'locked':
        if (newAvailable < amount) {
          return NextResponse.json(
            { error: 'Insufficient available points' },
            { status: 400 }
          );
        }
        newAvailable -= amount;
        newLocked += amount;
        break;

      case 'unlocked':
        newLocked -= amount;
        newAvailable += amount;
        break;

      default:
        return NextResponse.json(
          { error: `Invalid transaction type: ${type}` },
          { status: 400 }
        );
    }

    const transaction: PointTransaction = {
      id: `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      wallet,
      type,
      amount,
      balance_after: newTotal,
      source,
      reference_id,
      status: 'completed',
      created_at: new Date().toISOString(),
    };

    ledger.total_points = newTotal;
    ledger.available_points = newAvailable;
    ledger.locked_points = newLocked;
    ledger.pending_points = newPending;
    ledger.transactions.unshift(transaction);

    return NextResponse.json({
      success: true,
      transaction,
      balance: {
        total_points: newTotal,
        available_points: newAvailable,
        locked_points: newLocked,
        pending_points: newPending,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to process transaction' },
      { status: 500 }
    );
  }
}
