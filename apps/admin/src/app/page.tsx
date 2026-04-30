'use client';

import { useState, useEffect } from 'react';

interface Review {
  id: string;
  projectId: string;
  projectName: string;
  campaignId?: string;
  campaignName: string;
  type: string;
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: string;
  reviewedAt?: string;
  reviewer?: string;
  comment?: string;
}

interface Stats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
}

interface PlatformStats {
  totalUsers: number;
  activeProjects: number;
  totalCampaigns: number;
  tasksCompleted: number;
  pointsDistributed: number;
  activeDraws: number;
  highRiskUsers: number;
}

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState('overview');
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewStats, setReviewStats] = useState<Stats>({ total: 0, pending: 0, approved: 0, rejected: 0 });
  const [loading, setLoading] = useState(false);
  const [platformStats, setPlatformStats] = useState<PlatformStats>({
    totalUsers: 0,
    activeProjects: 0,
    totalCampaigns: 0,
    tasksCompleted: 0,
    pointsDistributed: 0,
    activeDraws: 0,
    highRiskUsers: 0,
  });

  useEffect(() => {
    if (activeTab === 'reviews') {
      fetchReviews();
    } else if (activeTab === 'overview') {
      fetchStats();
    }
  }, [activeTab]);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/reviews?status=all');
      const data = await response.json();
      setReviews(data.reviews || []);
      setReviewStats(data.stats || { total: 0, pending: 0, approved: 0, rejected: 0 });
    } catch (error) {
      console.error('Failed to fetch reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const [statsRes, usersRes] = await Promise.all([
        fetch('/api/admin/stats'),
        fetch('/api/admin/users?limit=5'),
      ]);
      const statsData = await statsRes.json();
      setPlatformStats({
        totalUsers: statsData.totalUsers || 0,
        activeProjects: statsData.activeProjects || 0,
        totalCampaigns: statsData.totalCampaigns || 0,
        tasksCompleted: statsData.tasksCompleted || 0,
        pointsDistributed: statsData.pointsDistributed || 0,
        activeDraws: statsData.activeDraws || 0,
        highRiskUsers: statsData.highRiskUsers || 0,
      });
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const handleReviewAction = async (reviewId: string, action: 'approve' | 'reject', comment?: string) => {
    try {
      const response = await fetch('/api/admin/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ review_id: reviewId, action, comment }),
      });

      if (response.ok) {
        fetchReviews();
      } else {
        alert('Failed to process review');
      }
    } catch (error) {
      console.error('Failed to process review:', error);
      alert('Failed to process review');
    }
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      campaign_create: 'New Campaign',
      campaign_update: 'Campaign Update',
      campaign_delete: 'Campaign Delete',
      draw_create: 'New Draw',
      draw_update: 'Draw Update',
    };
    return labels[type] || type;
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <header className="border-b border-gray-800 bg-gray-900">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-cyan-600 rounded-lg flex items-center justify-center">
              <span className="font-bold">A</span>
            </div>
            <span className="text-xl font-bold">AlphaQuest</span>
            <span className="text-gray-400 ml-2">Admin</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-400">admin@alphaquest.io</span>
            <button className="px-4 py-2 bg-gray-800 rounded-lg text-sm hover:bg-gray-700">
              Settings
            </button>
          </div>
        </div>
      </header>

      <div className="flex">
        <aside className="w-64 border-r border-gray-800 min-h-screen p-4">
          <nav className="space-y-1">
            {['overview', 'reviews', 'projects', 'campaigns', 'users', 'risk', 'draws'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`w-full text-left px-4 py-2 rounded-lg text-sm flex items-center justify-between ${
                  activeTab === tab
                    ? 'bg-cyan-600/20 text-cyan-400'
                    : 'text-gray-400 hover:bg-gray-800'
                }`}
              >
                <span>{tab.charAt(0).toUpperCase() + tab.slice(1)}</span>
                {tab === 'reviews' && reviewStats.pending > 0 && (
                  <span className="px-2 py-0.5 bg-yellow-600 rounded-full text-xs">
                    {reviewStats.pending}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </aside>

        <main className="flex-1 p-8">
          {activeTab === 'overview' && (
            <>
              <h1 className="text-2xl font-bold mb-8">Platform Overview</h1>

              <div className="grid grid-cols-4 gap-4 mb-8">
                <div className="p-6 bg-gray-900 rounded-xl border border-gray-800">
                  <p className="text-sm text-gray-400">Total Users</p>
                  <p className="text-3xl font-bold mt-2">{platformStats.totalUsers.toLocaleString()}</p>
                </div>
                <div className="p-6 bg-gray-900 rounded-xl border border-gray-800">
                  <p className="text-sm text-gray-400">Active Projects</p>
                  <p className="text-3xl font-bold mt-2">{platformStats.activeProjects}</p>
                </div>
                <div className="p-6 bg-gray-900 rounded-xl border border-gray-800">
                  <p className="text-sm text-gray-400">Total Campaigns</p>
                  <p className="text-3xl font-bold mt-2">{platformStats.totalCampaigns}</p>
                </div>
                <div className="p-6 bg-gray-900 rounded-xl border border-gray-800">
                  <p className="text-sm text-gray-400">Tasks Completed</p>
                  <p className="text-3xl font-bold mt-2">{(platformStats.tasksCompleted / 1000000).toFixed(1)}M</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="p-6 bg-gray-900 rounded-xl border border-gray-800">
                  <h3 className="font-semibold mb-4">Review Queue</h3>
                  <div className="space-y-3">
                    {reviews.filter(r => r.status === 'pending').slice(0, 5).map((item) => (
                      <div key={item.id} className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                        <div>
                          <p className="font-medium">{item.campaignName}</p>
                          <p className="text-sm text-gray-400">
                            {item.projectName} • {formatDate(item.submittedAt)}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleReviewAction(item.id, 'approve')}
                            className="px-3 py-1 bg-green-600/20 text-green-400 rounded text-sm hover:bg-green-600/30"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleReviewAction(item.id, 'reject')}
                            className="px-3 py-1 bg-red-600/20 text-red-400 rounded text-sm hover:bg-red-600/30"
                          >
                            Reject
                          </button>
                        </div>
                      </div>
                    ))}
                    {reviews.filter(r => r.status === 'pending').length === 0 && (
                      <p className="text-gray-400 text-sm">No pending reviews</p>
                    )}
                  </div>
                </div>

                <div className="p-6 bg-gray-900 rounded-xl border border-gray-800">
                  <h3 className="font-semibold mb-4">High Risk Users</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                      <div>
                        <p className="font-mono text-sm">0x1234...5678</p>
                        <p className="text-sm text-gray-400">Multiple accounts detected</p>
                      </div>
                      <span className="px-2 py-1 bg-red-600/20 text-red-400 rounded text-xs">
                        85
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                      <div>
                        <p className="font-mono text-sm">0xabcd...efgh</p>
                        <p className="text-sm text-gray-400">Suspicious referral pattern</p>
                      </div>
                      <span className="px-2 py-1 bg-yellow-600/20 text-yellow-400 rounded text-xs">
                        72
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {activeTab === 'reviews' && (
            <>
              <div className="flex items-center justify-between mb-8">
                <h1 className="text-2xl font-bold">Review Queue</h1>
                <div className="flex gap-4 text-sm">
                  <span className="text-gray-400">Pending: <span className="text-yellow-400 font-semibold">{reviewStats.pending}</span></span>
                  <span className="text-gray-400">Approved: <span className="text-green-400 font-semibold">{reviewStats.approved}</span></span>
                  <span className="text-gray-400">Rejected: <span className="text-red-400 font-semibold">{reviewStats.rejected}</span></span>
                </div>
              </div>

              {loading ? (
                <div className="text-center py-12">
                  <p className="text-gray-400">Loading reviews...</p>
                </div>
              ) : reviews.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-400">No reviews found</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {reviews.map((review) => (
                    <div
                      key={review.id}
                      className="p-6 bg-gray-900 rounded-xl border border-gray-800"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-semibold text-lg">{review.campaignName}</h3>
                            <span className={`px-2 py-1 rounded text-xs ${
                              review.status === 'pending'
                                ? 'bg-yellow-600/20 text-yellow-400'
                                : review.status === 'approved'
                                ? 'bg-green-600/20 text-green-400'
                                : 'bg-red-600/20 text-red-400'
                            }`}>
                              {review.status}
                            </span>
                            <span className="px-2 py-1 bg-gray-800 rounded text-xs text-gray-400">
                              {getTypeLabel(review.type)}
                            </span>
                          </div>
                          <p className="text-gray-400 text-sm">
                            Project: {review.projectName} • Submitted: {formatDate(review.submittedAt)}
                          </p>
                        </div>
                        {review.status === 'pending' && (
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleReviewAction(review.id, 'approve')}
                              className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleReviewAction(review.id, 'reject')}
                              className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700"
                            >
                              Reject
                            </button>
                          </div>
                        )}
                      </div>
                      {review.reviewedAt && (
                        <div className="text-sm text-gray-500">
                          Reviewed by {review.reviewer} on {formatDate(review.reviewedAt)}
                          {review.comment && <span> • "{review.comment}"</span>}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {activeTab !== 'overview' && activeTab !== 'reviews' && (
            <div className="text-center py-20">
              <p className="text-gray-400">{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} management coming soon...</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
