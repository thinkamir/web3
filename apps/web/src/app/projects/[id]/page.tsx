'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Button } from '@/components/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/Card';
import { Header } from '@/components/Header';

const mockProject = {
  id: '1',
  name: 'DeFi Swap',
  logo: 'D',
  description: 'A decentralized exchange protocol built on Ethereum. Trade tokens with low fees and fast confirmation times.',
  website: 'https://defiswap.io',
  twitter: '@DeFiSwap',
  telegram: 't.me/defiswap',
  discord: 'discord.gg/defiswap',
  verified: true,
  tasks: 12,
  participants: 5432,
  campaigns: [
    { id: '1', title: 'Token Launch Campaign', status: 'open', tasks: 5 },
    { id: '2', title: 'Community Growth', status: 'open', tasks: 4 },
  ],
  stats: {
    totalVolume: '$12.5M',
    traders: '8,234',
    apy: '24%',
  },
};

export default function ProjectPage() {
  const params = useParams();
  const [activeTab, setActiveTab] = useState('campaigns');
  const projectId = params.id as string;

  return (
    <>
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="flex items-start gap-6 mb-8">
          <div className="w-20 h-20 bg-cyan-600 rounded-2xl flex items-center justify-center text-3xl font-bold">
            {mockProject.logo}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold">{mockProject.name}</h1>
              {mockProject.verified && (
                <span className="px-2 py-1 bg-green-600/20 text-green-400 text-xs rounded">
                  Verified
                </span>
              )}
            </div>
            <p className="text-gray-400 mb-4">{mockProject.description}</p>
            <div className="flex gap-4">
              <a href={mockProject.website} className="text-cyan-400 hover:underline" target="_blank" rel="noopener noreferrer">
                Website
              </a>
              <a href={`https://twitter.com/${mockProject.twitter}`} className="text-cyan-400 hover:underline" target="_blank" rel="noopener noreferrer">
                {mockProject.twitter}
              </a>
              <a href={mockProject.telegram} className="text-cyan-400 hover:underline" target="_blank" rel="noopener noreferrer">
                Telegram
              </a>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-8">
          <Card>
            <CardContent className="text-center py-4">
              <p className="text-2xl font-bold text-cyan-400">{mockProject.stats.totalVolume}</p>
              <p className="text-sm text-gray-400">Trading Volume</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="text-center py-4">
              <p className="text-2xl font-bold text-cyan-400">{mockProject.stats.traders}</p>
              <p className="text-sm text-gray-400">Active Traders</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="text-center py-4">
              <p className="text-2xl font-bold text-cyan-400">{mockProject.stats.apy}</p>
              <p className="text-sm text-gray-400">Farm APY</p>
            </CardContent>
          </Card>
        </div>

        <div className="flex gap-4 mb-6">
          {['campaigns', 'tasks', 'about'].map((tab) => (
            <Button
              key={tab}
              variant={activeTab === tab ? 'primary' : 'ghost'}
              onClick={() => setActiveTab(tab)}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Button>
          ))}
        </div>

        {activeTab === 'campaigns' && (
          <div className="space-y-4">
            {mockProject.campaigns.map((campaign) => (
              <Card key={campaign.id}>
                <CardContent className="flex items-center justify-between py-4">
                  <div>
                    <h3 className="font-semibold">{campaign.title}</h3>
                    <p className="text-sm text-gray-400">{campaign.tasks} tasks</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={`px-2 py-1 text-xs rounded ${
                      campaign.status === 'open' ? 'bg-green-600/20 text-green-400' : 'bg-gray-600/20 text-gray-400'
                    }`}>
                      {campaign.status}
                    </span>
                    <Button variant="outline" size="sm">View</Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {activeTab === 'tasks' && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { title: 'Complete a Swap', points: 100, type: 'onchain' },
              { title: 'Provide Liquidity', points: 200, type: 'onchain' },
              { title: 'Follow Twitter', points: 50, type: 'social' },
            ].map((task, i) => (
              <Card key={i}>
                <CardHeader>
                  <CardTitle>{task.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <span className="text-cyan-400 font-semibold">+{task.points} AP</span>
                    <Button size="sm">Start</Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {activeTab === 'about' && (
          <Card>
            <CardContent className="py-6">
              <h3 className="font-semibold mb-4">About {mockProject.name}</h3>
              <p className="text-gray-400 mb-4">
                {mockProject.name} is a decentralized exchange that offers secure, fast, and low-cost token swaps.
                Built by a team of experienced developers and backed by top-tier investors in the DeFi space.
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-400">Category</p>
                  <p>DeFi</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Chain</p>
                  <p>Ethereum</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </>
  );
}
