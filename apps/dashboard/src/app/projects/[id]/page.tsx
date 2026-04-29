'use client';

import { useState } from 'react';
import Link from 'next/link';

const mockCampaigns = [
  {
    id: '1',
    title: 'Token Launch Campaign',
    status: 'open',
    tasks: 5,
    participants: 2345,
    completionRate: 78,
    pointsDistributed: 45000,
  },
  {
    id: '2',
    title: 'Community Growth',
    status: 'open',
    tasks: 4,
    participants: 1890,
    completionRate: 65,
    pointsDistributed: 32000,
  },
  {
    id: '3',
    title: 'Beta Testing',
    status: 'paused',
    tasks: 6,
    participants: 567,
    completionRate: 45,
    pointsDistributed: 12000,
  },
];

export default function ProjectDetailPage({ params }: { params: { id: string } }) {
  const [campaigns] = useState(mockCampaigns);

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <header className="border-b border-gray-800 bg-gray-900">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="text-gray-400 hover:text-white">
              ← Back
            </Link>
            <div className="w-10 h-10 bg-cyan-600 rounded-lg flex items-center justify-center font-bold">
              D
            </div>
            <div>
              <h1 className="font-semibold">DeFi Swap</h1>
              <span className="text-xs text-green-400">Verified</span>
            </div>
          </div>
          <button className="px-4 py-2 bg-cyan-600 rounded-lg text-sm hover:bg-cyan-700">
            Create Campaign
          </button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-4 gap-4 mb-8">
          <div className="p-4 bg-gray-900 rounded-xl border border-gray-800">
            <p className="text-sm text-gray-400">Total Participants</p>
            <p className="text-2xl font-bold text-cyan-400">5,432</p>
          </div>
          <div className="p-4 bg-gray-900 rounded-xl border border-gray-800">
            <p className="text-sm text-gray-400">Active Campaigns</p>
            <p className="text-2xl font-bold text-cyan-400">2</p>
          </div>
          <div className="p-4 bg-gray-900 rounded-xl border border-gray-800">
            <p className="text-sm text-gray-400">Tasks Completed</p>
            <p className="text-2xl font-bold text-cyan-400">12,345</p>
          </div>
          <div className="p-4 bg-gray-900 rounded-xl border border-gray-800">
            <p className="text-sm text-gray-400">Points Distributed</p>
            <p className="text-2xl font-bold text-cyan-400">89,000</p>
          </div>
        </div>

        <div className="mb-6">
          <h2 className="text-xl font-semibold">Campaigns</h2>
        </div>

        <div className="space-y-4">
          {campaigns.map((campaign) => (
            <div
              key={campaign.id}
              className="p-6 bg-gray-900 rounded-xl border border-gray-800"
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-lg">{campaign.title}</h3>
                  <div className="flex items-center gap-3 mt-1">
                    <span className={`px-2 py-1 text-xs rounded ${
                      campaign.status === 'open'
                        ? 'bg-green-600/20 text-green-400'
                        : campaign.status === 'paused'
                        ? 'bg-yellow-600/20 text-yellow-400'
                        : 'bg-gray-600/20 text-gray-400'
                    }`}>
                      {campaign.status}
                    </span>
                    <span className="text-sm text-gray-400">{campaign.tasks} tasks</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button className="px-3 py-1 bg-gray-800 rounded text-sm hover:bg-gray-700">
                    Edit
                  </button>
                  <button className="px-3 py-1 bg-cyan-600/20 text-cyan-400 rounded text-sm hover:bg-cyan-600/30">
                    View Analytics
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-gray-400">Participants</p>
                  <p className="font-semibold">{campaign.participants.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Completion Rate</p>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-gray-800 rounded-full h-2">
                      <div
                        className="bg-cyan-600 h-2 rounded-full"
                        style={{ width: `${campaign.completionRate}%` }}
                      />
                    </div>
                    <span className="text-sm">{campaign.completionRate}%</span>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Points Distributed</p>
                  <p className="font-semibold">{campaign.pointsDistributed.toLocaleString()}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
