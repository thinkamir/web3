'use client';

import { useState } from 'react';
import { Button } from '@/components/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/Card';

const mockDraws = [
  { id: '1', title: 'NFT Giveaway', description: 'Win exclusive NFT', prize: '500 USDC', progress: 65, tickets: 1234, target: 2000, status: 'open' },
  { id: '2', title: 'Whitelist Spots', description: 'Get WL for upcoming mint', prize: '100 WL', progress: 80, tickets: 800, target: 1000, status: 'open' },
  { id: '3', title: 'Token Airdrop', description: 'Free token airdrop', prize: '10,000 TOKEN', progress: 45, tickets: 450, target: 1000, status: 'open' },
  { id: '4', title: 'Genesis NFT', description: 'Limited genesis collection', prize: '10 Genesis NFT', progress: 100, tickets: 500, target: 500, status: 'finalized' },
];

export default function DrawsPage() {
  const [filter, setFilter] = useState('open');

  const filteredDraws = mockDraws.filter(draw => {
    if (filter === 'all') return true;
    return draw.status === filter;
  });

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <header className="border-b border-gray-800">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-cyan-600 rounded-lg flex items-center justify-center">
              <span className="font-bold">A</span>
            </div>
            <span className="text-xl font-bold">AlphaQuest</span>
          </div>
          <nav className="flex items-center gap-6">
            <a href="/" className="text-gray-400 hover:text-white">Home</a>
            <a href="/tasks" className="text-gray-400 hover:text-white">Tasks</a>
            <a href="/draws" className="text-white font-medium">Draws</a>
            <a href="/profile" className="text-gray-400 hover:text-white">Profile</a>
          </nav>
          <Button>Connect Wallet</Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-8">
          <h1 className="text-2xl font-bold">Active Draws</h1>
          <div className="flex gap-2 ml-auto">
            {['open', 'finalized', 'all'].map((status) => (
              <Button
                key={status}
                variant={filter === status ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setFilter(status)}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </Button>
            ))}
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {filteredDraws.map((draw) => (
            <Card key={draw.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{draw.title}</CardTitle>
                  <span className={`text-xs px-2 py-1 rounded ${
                    draw.status === 'open' ? 'bg-green-600/20 text-green-400' : 'bg-gray-600/20 text-gray-400'
                  }`}>
                    {draw.status}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-400 text-sm mb-4">{draw.description}</p>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Prize Pool</span>
                    <span className="font-semibold text-cyan-400">{draw.prize}</span>
                  </div>
                  <div className="w-full bg-gray-800 rounded-full h-2">
                    <div
                      className="bg-cyan-600 h-2 rounded-full transition-all"
                      style={{ width: `${draw.progress}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-sm text-gray-400">
                    <span>{draw.tickets.toLocaleString()} tickets</span>
                    <span>{draw.target.toLocaleString()} target</span>
                  </div>
                </div>
                <Button className="w-full mt-4" disabled={draw.status !== 'open'}>
                  {draw.status === 'open' ? 'Join Draw' : 'View Result'}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredDraws.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-400">No draws found</p>
          </div>
        )}
      </main>
    </div>
  );
}
