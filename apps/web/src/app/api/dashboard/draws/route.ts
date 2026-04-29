import { NextResponse } from 'next/server';

export async function GET() {
  const draws = [
    {
      id: '1',
      projectId: '1',
      name: 'NFT Giveaway',
      description: 'Win exclusive NFT from the collection',
      prizePool: '500 USDC',
      ticketPrice: 100,
      maxTickets: 2000,
      soldTickets: 1234,
      status: 'active',
      drawTime: '2024-03-15T18:00:00Z',
      winnerCount: 10,
    },
    {
      id: '2',
      projectId: '1',
      name: 'Whitelist Allocation',
      description: 'Get whitelist spots for upcoming mint',
      prizePool: '100 WL Spots',
      ticketPrice: 200,
      maxTickets: 1000,
      soldTickets: 800,
      status: 'active',
      drawTime: '2024-03-20T12:00:00Z',
      winnerCount: 100,
    },
  ];

  return NextResponse.json(draws);
}
