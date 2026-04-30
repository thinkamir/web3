import { NextResponse } from 'next/server';

const campaigns: Map<string, any> = new Map();

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get('projectId');

  const campaignsList = [
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

  return NextResponse.json(campaignsList);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, description, startDate, endDate, tasks } = body;

    if (!title || !description) {
      return NextResponse.json(
        { error: 'Title and description are required' },
        { status: 400 }
      );
    }

    const newCampaign = {
      id: `campaign_${Date.now()}`,
      title,
      description,
      startDate,
      endDate,
      tasks: tasks || [],
      status: 'draft',
      createdAt: new Date().toISOString(),
      totalParticipants: 0,
      pointsBudget: tasks?.reduce((sum: number, t: any) => sum + t.points * t.maxCompletions, 0) || 0,
      pointsDistributed: 0,
    };

    campaigns.set(newCampaign.id, newCampaign);

    return NextResponse.json({
      success: true,
      campaign: newCampaign,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create campaign' },
      { status: 500 }
    );
  }
}
