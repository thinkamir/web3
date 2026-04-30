import { NextResponse } from 'next/server';

const mockTasks = [
  { id: '1', title: 'Daily Sign-in', description: 'Sign in to earn points', points: 10, type: 'signin', participants: 1234, status: 'available' },
  { id: '2', title: 'Follow Twitter', description: 'Follow project Twitter', points: 50, type: 'social', participants: 856, status: 'available' },
  { id: '3', title: 'Join Discord', description: 'Join project Discord', points: 100, type: 'social', participants: 543, status: 'available' },
  { id: '4', title: 'Complete Quiz', description: 'Answer quiz questions', points: 30, type: 'quiz', participants: 321, status: 'available' },
  { id: '5', title: 'On-chain Swap', description: 'Complete a swap transaction', points: 200, type: 'onchain', participants: 156, status: 'available' },
  { id: '6', title: 'Submit Feedback', description: 'Submit project feedback', points: 50, type: 'manual', participants: 89, status: 'available' },
];

const completedTasks: Map<string, string[]> = new Map();

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type');
  const status = searchParams.get('status');

  let filteredTasks = mockTasks;

  if (type && type !== 'all') {
    filteredTasks = filteredTasks.filter(task => task.type === type);
  }

  if (status) {
    filteredTasks = filteredTasks.filter(task => task.status === status);
  }

  return NextResponse.json({ tasks: filteredTasks });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { taskId, wallet, txHash, proofUrl } = body;

    if (!taskId || !wallet) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const task = mockTasks.find(t => t.id === taskId);
    if (!task) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      );
    }

    const userCompletedTasks = completedTasks.get(wallet) || [];
    if (userCompletedTasks.includes(taskId)) {
      return NextResponse.json(
        { error: 'Task already completed' },
        { status: 400 }
      );
    }

    if (task.type === 'onchain' && !txHash) {
      return NextResponse.json(
        { error: 'Transaction hash required for on-chain tasks' },
        { status: 400 }
      );
    }

    if (task.type === 'social' && !proofUrl) {
      return NextResponse.json(
        { error: 'Proof URL required for social tasks' },
        { status: 400 }
      );
    }

    userCompletedTasks.push(taskId);
    completedTasks.set(wallet, userCompletedTasks);

    return NextResponse.json({
      success: true,
      task: {
        id: task.id,
        title: task.title,
        points: task.points,
      },
      message: `Task completed! You earned ${task.points} AP.`,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Invalid request body' },
      { status: 400 }
    );
  }
}
