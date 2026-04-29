'use client';

import { useState } from 'react';

const mockStats = {
  totalUsers: 12345,
  activeProjects: 89,
  totalCampaigns: 234,
  tasksCompleted: 1200000,
  pointsDistributed: 50000000,
  activeDraws: 15,
  highRiskUsers: 23,
};

const pendingReviews = [
  { id: '1', type: 'project', name: 'NewDeFi Protocol', submittedAt: '2024-01-15', risk: 'low' },
  { id: '2', type: 'campaign', name: 'Token Launch Campaign', project: 'DeFi Swap', submittedAt: '2024-01-14', risk: 'medium' },
  { id: '3', type: 'project', name: 'GameFi Studio', submittedAt: '2024-01-13', risk: 'high' },
];

const highRiskUsers = [
  { id: '1', wallet: '0x1234...5678', riskScore: 85, reason: 'Multiple accounts detected', date: '2024-01-15' },
  { id: '2', wallet: '0xabcd...efgh', riskScore: 72, reason: 'Suspicious referral pattern', date: '2024-01-14' },
  { id: '3', wallet: '0x9876...5432', riskScore: 68, reason: 'Rapid task completion', date: '2024-01-13' },
];

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState('overview');

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
            {['overview', 'projects', 'campaigns', 'users', 'risk', 'draws', 'reports'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`w-full text-left px-4 py-2 rounded-lg text-sm ${
                  activeTab === tab
                    ? 'bg-cyan-600/20 text-cyan-400'
                    : 'text-gray-400 hover:bg-gray-800'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
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
                  <p className="text-3xl font-bold mt-2">{mockStats.totalUsers.toLocaleString()}</p>
                </div>
                <div className="p-6 bg-gray-900 rounded-xl border border-gray-800">
                  <p className="text-sm text-gray-400">Active Projects</p>
                  <p className="text-3xl font-bold mt-2">{mockStats.activeProjects}</p>
                </div>
                <div className="p-6 bg-gray-900 rounded-xl border border-gray-800">
                  <p className="text-sm text-gray-400">Total Campaigns</p>
                  <p className="text-3xl font-bold mt-2">{mockStats.totalCampaigns}</p>
                </div>
                <div className="p-6 bg-gray-900 rounded-xl border border-gray-800">
                  <p className="text-sm text-gray-400">Tasks Completed</p>
                  <p className="text-3xl font-bold mt-2">{(mockStats.tasksCompleted / 1000000).toFixed(1)}M</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="p-6 bg-gray-900 rounded-xl border border-gray-800">
                  <h3 className="font-semibold mb-4">Pending Reviews</h3>
                  <div className="space-y-3">
                    {pendingReviews.map((item) => (
                      <div key={item.id} className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                        <div>
                          <p className="font-medium">{item.name}</p>
                          <p className="text-sm text-gray-400">{item.type} • {item.submittedAt}</p>
                        </div>
                        <div className="flex gap-2">
                          <button className="px-3 py-1 bg-green-600/20 text-green-400 rounded text-sm">Approve</button>
                          <button className="px-3 py-1 bg-red-600/20 text-red-400 rounded text-sm">Reject</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-6 bg-gray-900 rounded-xl border border-gray-800">
                  <h3 className="font-semibold mb-4">High Risk Users</h3>
                  <div className="space-y-3">
                    {highRiskUsers.map((user) => (
                      <div key={user.id} className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                        <div>
                          <p className="font-mono text-sm">{user.wallet}</p>
                          <p className="text-sm text-gray-400">{user.reason}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 rounded text-xs ${
                            user.riskScore > 80
                              ? 'bg-red-600/20 text-red-400'
                              : 'bg-yellow-600/20 text-yellow-400'
                          }`}>
                            {user.riskScore}
                          </span>
                          <button className="px-3 py-1 bg-gray-700 rounded text-sm">Review</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}

          {activeTab !== 'overview' && (
            <div className="text-center py-20">
              <p className="text-gray-400">{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} management coming soon...</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
