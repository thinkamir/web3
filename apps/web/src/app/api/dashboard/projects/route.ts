import { NextResponse } from 'next/server';

export async function GET() {
  const projects = [
    {
      id: '1',
      name: 'DeFi Protocol X',
      description: 'Next generation DeFi protocol',
      status: 'active',
      totalCampaigns: 5,
      totalTasks: 23,
      totalParticipants: 1250,
      totalPointsDistributed: 500000,
    },
    {
      id: '2',
      name: 'NFT Collection Y',
      description: 'Exclusive digital art collection',
      status: 'active',
      totalCampaigns: 3,
      totalTasks: 15,
      totalParticipants: 890,
      totalPointsDistributed: 250000,
    },
    {
      id: '3',
      name: 'GameFi Z',
      description: 'Play to earn gaming platform',
      status: 'pending',
      totalCampaigns: 0,
      totalTasks: 0,
      totalParticipants: 0,
      totalPointsDistributed: 0,
    },
  ];

  return NextResponse.json(projects);
}
