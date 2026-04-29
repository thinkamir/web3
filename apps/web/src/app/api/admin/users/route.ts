import { NextResponse } from 'next/server';

export async function GET() {
  const users = [
    {
      id: '1',
      address: '0x1234...5678',
      email: 'user1@example.com',
      status: 'active',
      riskScore: 15,
      totalPoints: 5000,
      createdAt: '2024-01-15',
    },
    {
      id: '2',
      address: '0xabcd...efgh',
      email: 'user2@example.com',
      status: 'active',
      riskScore: 72,
      totalPoints: 12000,
      createdAt: '2024-02-20',
    },
    {
      id: '3',
      address: '0x9988...7766',
      email: 'user3@example.com',
      status: 'suspended',
      riskScore: 95,
      totalPoints: 0,
      createdAt: '2024-03-10',
    },
  ];

  return NextResponse.json(users);
}
