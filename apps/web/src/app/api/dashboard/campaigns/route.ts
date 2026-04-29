import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get('projectId');

  const campaigns = [
    {
      id: '1',
      projectId: projectId || '1',
      name: 'Yield Farming Campaign',
      description: 'Stake tokens to earn rewards',
      type: 'campaign',
      status: 'active',
      startTime: '2024-03-01T00:00:00Z',
      endTime: '2024-04-01T00:00:00Z',
      totalParticipants: 456,
      totalTasks: 12,
      pointsBudget: 100000,
      pointsDistributed: 45000,
    },
    {
      id: '2',
      projectId: projectId || '1',
      name: 'Referral Program',
      description: 'Invite friends to earn bonus points',
      type: 'referral',
      status: 'active',
      startTime: '2024-02-15T00:00:00Z',
      endTime: '2024-05-15T00:00:00Z',
      totalParticipants: 234,
      totalTasks: 1,
      pointsBudget: 50000,
      pointsDistributed: 28000,
    },
  ];

  return NextResponse.json(campaigns);
}
