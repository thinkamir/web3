import { NextResponse } from 'next/server';

export async function GET() {
  const stats = {
    totalUsers: 1247,
    activeUsers: 892,
    totalPoints: 4582000,
    totalDraws: 23,
    totalProjects: 8,
    pendingReviews: 12,
    flaggedUsers: 3,
  };

  return NextResponse.json(stats);
}
