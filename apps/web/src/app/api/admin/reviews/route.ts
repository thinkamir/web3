import { NextResponse } from 'next/server';

export async function GET() {
  const reviews = [
    {
      id: '1',
      projectName: 'DeFi Protocol X',
      campaignName: 'Yield Farming Campaign',
      type: 'campaign_create',
      status: 'pending',
      submittedAt: '2024-03-01T10:00:00Z',
    },
    {
      id: '2',
      projectName: 'NFT Collection Y',
      campaignName: 'Minting Event',
      type: 'campaign_update',
      status: 'pending',
      submittedAt: '2024-03-02T14:30:00Z',
    },
    {
      id: '3',
      projectName: 'GameFi Z',
      campaignName: 'Season 2 Rewards',
      type: 'draw_create',
      status: 'approved',
      submittedAt: '2024-02-28T09:15:00Z',
    },
  ];

  return NextResponse.json(reviews);
}
