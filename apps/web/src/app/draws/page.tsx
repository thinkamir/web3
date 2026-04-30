'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/Card';
import { Header } from '@/components/Header';
import { useWallet } from '@/contexts/WalletContext';

interface Draw {
  id: string;
  title: string;
  description: string;
  type: string;
  prize: string;
  prize_amount: number;
  status: string;
  progress: number;
  tickets: number;
  target: number;
  points_per_ticket: number;
  end_time: string;
  winner?: string;
}

export default function DrawsPage() {
  const [filter, setFilter] = useState('open');
  const [draws, setDraws] = useState<Draw[]>([]);
  const [loading, setLoading] = useState(true);
  const { address, isConnected } = useWallet();

  useEffect(() => {
    fetchDraws();
  }, [filter]);

  const fetchDraws = async () => {
    try {
      const url = filter === 'all' ? '/api/draws' : `/api/draws?status=${filter}`;
      const response = await fetch(url);
      const data = await response.json();
      setDraws(data.draws || []);
    } catch (error) {
      console.error('Failed to fetch draws:', error);
    } finally {
      setLoading(false);
    }
  };

  const joinDraw = async (drawId: string) => {
    if (!address) {
      alert('Please connect your wallet first');
      return;
    }

    try {
      const response = await fetch('/api/draws', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          draw_id: drawId,
          tickets: 1,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        alert('Successfully joined the draw!');
        fetchDraws();
      } else {
        alert(data.error || 'Failed to join draw');
      }
    } catch (error) {
      console.error('Failed to join draw:', error);
      alert('Failed to join draw');
    }
  };

  return (
    <>
      <Header />
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

        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-400">Loading draws...</p>
          </div>
        ) : draws.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-400">No draws found</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {draws.map((draw) => (
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
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Cost per ticket</span>
                      <span className="font-semibold">{draw.points_per_ticket} AP</span>
                    </div>
                  </div>
                  {draw.status === 'open' ? (
                    <Button
                      className="w-full mt-4"
                      onClick={() => joinDraw(draw.id)}
                      disabled={!isConnected}
                    >
                      {isConnected ? 'Join Draw' : 'Connect Wallet'}
                    </Button>
                  ) : draw.winner ? (
                    <div className="mt-4 p-2 bg-gray-800 rounded text-center">
                      <p className="text-sm text-gray-400">Winner</p>
                      <p className="font-mono text-sm">{draw.winner}</p>
                    </div>
                  ) : (
                    <Button className="w-full mt-4" disabled>
                      Draw Finalized
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </>
  );
}
