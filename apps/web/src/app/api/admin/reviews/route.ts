import { NextResponse } from 'next/server';

interface Review {
  id: string;
  projectId: string;
  projectName: string;
  campaignId?: string;
  campaignName: string;
  type: 'campaign_create' | 'campaign_update' | 'campaign_delete' | 'draw_create' | 'draw_update';
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: string;
  reviewedAt?: string;
  reviewer?: string;
  comment?: string;
}

interface ReviewAction {
  review_id: string;
  action: 'approve' | 'reject';
  comment?: string;
}

const reviews: Map<string, Review> = new Map([
  ['1', {
    id: '1',
    projectId: 'proj_1',
    projectName: 'DeFi Protocol X',
    campaignName: 'Yield Farming Campaign',
    type: 'campaign_create',
    status: 'pending',
    submittedAt: '2024-03-01T10:00:00Z',
  }],
  ['2', {
    id: '2',
    projectId: 'proj_2',
    projectName: 'NFT Collection Y',
    campaignName: 'Minting Event',
    type: 'campaign_update',
    status: 'pending',
    submittedAt: '2024-03-02T14:30:00Z',
  }],
  ['3', {
    id: '3',
    projectId: 'proj_3',
    projectName: 'GameFi Z',
    campaignName: 'Season 2 Rewards',
    type: 'draw_create',
    status: 'approved',
    submittedAt: '2024-02-28T09:15:00Z',
    reviewedAt: '2024-02-28T11:00:00Z',
    reviewer: 'admin@alphaquest.io',
  }],
]);

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');
  const type = searchParams.get('type');

  let filteredReviews = Array.from(reviews.values());

  if (status && status !== 'all') {
    filteredReviews = filteredReviews.filter(r => r.status === status);
  }

  if (type) {
    filteredReviews = filteredReviews.filter(r => r.type === type);
  }

  filteredReviews.sort((a, b) =>
    new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
  );

  return NextResponse.json({
    reviews: filteredReviews,
    stats: {
      total: filteredReviews.length,
      pending: filteredReviews.filter(r => r.status === 'pending').length,
      approved: filteredReviews.filter(r => r.status === 'approved').length,
      rejected: filteredReviews.filter(r => r.status === 'rejected').length,
    },
  });
}

export async function POST(request: Request) {
  try {
    const body: ReviewAction = await request.json();
    const { review_id, action, comment } = body;

    if (!review_id || !action) {
      return NextResponse.json(
        { error: 'Missing required fields: review_id, action' },
        { status: 400 }
      );
    }

    if (!['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Must be "approve" or "reject"' },
        { status: 400 }
      );
    }

    const review = reviews.get(review_id);

    if (!review) {
      return NextResponse.json(
        { error: 'Review not found' },
        { status: 404 }
      );
    }

    if (review.status !== 'pending') {
      return NextResponse.json(
        { error: 'Review has already been processed' },
        { status: 400 }
      );
    }

    review.status = action === 'approve' ? 'approved' : 'rejected';
    review.reviewedAt = new Date().toISOString();
    review.reviewer = 'admin@alphaquest.io';
    review.comment = comment;

    return NextResponse.json({
      success: true,
      review,
      message: `Review ${action === 'approve' ? 'approved' : 'rejected'} successfully`,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to process review' },
      { status: 500 }
    );
  }
}
