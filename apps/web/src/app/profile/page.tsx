'use client';

import { useState } from 'react';
import { Button } from '@/components/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/Card';
import { Input } from '@/components/Input';

const mockUser = {
  wallet: '0x1234...5678',
  username: 'CryptoHunter',
  avatar: null,
  level: 5,
  totalPoints: 12500,
  availablePoints: 8500,
  pendingPoints: 2000,
  lockedPoints: 2000,
  tasksCompleted: 45,
  drawsJoined: 12,
  drawsWon: 2,
  referrals: 8,
};

const mockPointHistory = [
  { id: '1', type: 'earned', amount: 100, source: 'Daily Sign-in', date: '2024-01-15' },
  { id: '2', type: 'spent', amount: -500, source: 'Draw Participation', date: '2024-01-14' },
  { id: '3', type: 'earned', amount: 200, source: 'Complete Task', date: '2024-01-13' },
  { id: '4', type: 'earned', amount: 50, source: 'Referral Bonus', date: '2024-01-12' },
  { id: '5', type: 'pending', amount: 100, source: 'Pending Verification', date: '2024-01-11' },
];

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState('overview');

  const copyReferralLink = () => {
    navigator.clipboard.writeText(`https://alphaquest.io/invite/${mockUser.referrals}`);
  };

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
            <a href="/draws" className="text-gray-400 hover:text-white">Draws</a>
            <a href="/profile" className="text-white font-medium">Profile</a>
          </nav>
          <Button>Connected</Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <Card>
              <CardContent className="text-center py-8">
                <div className="w-20 h-20 bg-cyan-600 rounded-full mx-auto mb-4 flex items-center justify-center text-2xl font-bold">
                  {mockUser.wallet.slice(0, 2).toUpperCase()}
                </div>
                <h2 className="text-xl font-semibold mb-1">{mockUser.username || 'Anonymous'}</h2>
                <p className="text-gray-400 text-sm mb-4">{mockUser.wallet}</p>
                <div className="inline-block px-3 py-1 bg-cyan-600/20 text-cyan-400 rounded-full text-sm">
                  Level {mockUser.level}
                </div>
              </CardContent>
            </Card>

            <Card className="mt-4">
              <CardHeader>
                <CardTitle>Quick Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-400">Tasks Completed</span>
                  <span className="font-semibold">{mockUser.tasksCompleted}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Draws Joined</span>
                  <span className="font-semibold">{mockUser.drawsJoined}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Draws Won</span>
                  <span className="font-semibold text-green-400">{mockUser.drawsWon}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Referrals</span>
                  <span className="font-semibold">{mockUser.referrals}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Points</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="text-center p-4 bg-gray-900 rounded-lg">
                    <p className="text-2xl font-bold text-cyan-400">{mockUser.availablePoints.toLocaleString()}</p>
                    <p className="text-sm text-gray-400">Available</p>
                  </div>
                  <div className="text-center p-4 bg-gray-900 rounded-lg">
                    <p className="text-2xl font-bold text-yellow-400">{mockUser.pendingPoints.toLocaleString()}</p>
                    <p className="text-sm text-gray-400">Pending</p>
                  </div>
                  <div className="text-center p-4 bg-gray-900 rounded-lg">
                    <p className="text-2xl font-bold text-gray-400">{mockUser.lockedPoints.toLocaleString()}</p>
                    <p className="text-sm text-gray-400">Locked</p>
                  </div>
                </div>

                <div className="flex gap-2 mb-6">
                  <Button variant="outline" className="flex-1">Withdraw</Button>
                  <Button variant="outline" className="flex-1">History</Button>
                </div>

                <h3 className="font-semibold mb-3">Referral Program</h3>
                <div className="flex gap-2">
                  <Input
                    value={`https://alphaquest.io/invite/CODE${mockUser.referrals}`}
                    readOnly
                    className="flex-1"
                  />
                  <Button onClick={copyReferralLink}>Copy</Button>
                </div>
                <p className="text-sm text-gray-400 mt-2">
                  Earn 5% of your referrals points when they win draws
                </p>
              </CardContent>
            </Card>

            <Card className="mt-6">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Recent Activity</CardTitle>
                  <Button variant="ghost" size="sm">View All</Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {mockPointHistory.map((item) => (
                    <div key={item.id} className="flex items-center justify-between py-2 border-b border-gray-800 last:border-0">
                      <div>
                        <p className="font-medium">{item.source}</p>
                        <p className="text-sm text-gray-400">{item.date}</p>
                      </div>
                      <span className={`font-semibold ${
                        item.type === 'spent' ? 'text-red-400' : 'text-green-400'
                      }`}>
                        {item.type === 'spent' ? '' : '+'}{item.amount}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
