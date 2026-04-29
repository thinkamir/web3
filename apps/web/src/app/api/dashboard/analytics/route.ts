import { NextResponse } from 'next/server';

export async function GET() {
  const analytics = {
    overview: {
      totalParticipants: 2340,
      activeParticipants: 1850,
      totalTasksCompleted: 45600,
      averageCompletionRate: 78,
    },
    pointsFlow: [
      { date: '2024-02-01', distributed: 12000, redeemed: 8000 },
      { date: '2024-02-15', distributed: 15000, redeemed: 10000 },
      { date: '2024-03-01', distributed: 18000, redeemed: 12000 },
    ],
    topTasks: [
      { name: 'Follow on X', completions: 1250 },
      { name: 'Join Discord', completions: 980 },
      { name: 'Daily Sign-in', completions: 2100 },
      { name: 'Invite Friends', completions: 450 },
    ],
    participantGrowth: [
      { date: '2024-01-01', count: 500 },
      { date: '2024-02-01', count: 1200 },
      { date: '2024-03-01', count: 2340 },
    ],
  };

  return NextResponse.json(analytics);
}
