'use client';

import { Button } from '@/components/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/Card';
import { useWallet } from '@/contexts/WalletContext';

export default function HomePage() {
  const { isConnected, connect } = useWallet();

  return (
    <>
      <main>
        <section className="py-20">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-5xl font-bold mb-6">
              Web3 Growth <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-cyan-600">Infrastructure</span>
            </h1>
            <p className="text-xl text-gray-400 mb-8 max-w-2xl mx-auto">
              AlphaQuest is the growth platform for Web3 projects. Create quests,
              reward users, and build your community with on-chain fair draws.
            </p>
            <div className="flex gap-4 justify-center">
              <Button size="lg" asChild>
                <a href="/tasks">Start Exploring</a>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <a href="/dashboard">For Projects</a>
              </Button>
            </div>
          </div>
        </section>

        <section className="py-16">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl font-bold mb-8">Hot Tasks</h2>
            <div className="grid md:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Sign in Daily</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-400 mb-4">Complete daily sign-in to earn points</p>
                  <div className="flex items-center justify-between">
                    <span className="text-cyan-400 font-semibold">+10 AP</span>
                    <Button size="sm" asChild>
                      <a href="/tasks">Start</a>
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Follow on X</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-400 mb-4">Follow the project on Twitter</p>
                  <div className="flex items-center justify-between">
                    <span className="text-cyan-400 font-semibold">+50 AP</span>
                    <Button size="sm">Start</Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Join Discord</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-400 mb-4">Join the project Discord server</p>
                  <div className="flex items-center justify-between">
                    <span className="text-cyan-400 font-semibold">+100 AP</span>
                    <Button size="sm">Start</Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        <section className="py-16 border-t border-gray-800">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl font-bold mb-8">Active Draws</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>NFT Giveaway</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-400 mb-4">Win exclusive NFT from the latest collection</p>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Prize Pool</span>
                      <span>500 USDC</span>
                    </div>
                    <div className="w-full bg-gray-800 rounded-full h-2">
                      <div className="bg-cyan-600 h-2 rounded-full" style={{ width: '65%' }} />
                    </div>
                    <div className="flex justify-between text-sm text-gray-400">
                      <span>1,234 tickets</span>
                      <span>2,000 target</span>
                    </div>
                  </div>
                  <Button className="w-full mt-4">Join Draw</Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Whitelist Allocation</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-400 mb-4">Get whitelist spots for upcoming mint</p>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Prize</span>
                      <span>100 WL Spots</span>
                    </div>
                    <div className="w-full bg-gray-800 rounded-full h-2">
                      <div className="bg-green-600 h-2 rounded-full" style={{ width: '80%' }} />
                    </div>
                    <div className="flex justify-between text-sm text-gray-400">
                      <span>800 tickets</span>
                      <span>1,000 target</span>
                    </div>
                  </div>
                  <Button className="w-full mt-4">Join Draw</Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-gray-800 py-8">
        <div className="container mx-auto px-4 text-center text-gray-400">
          <p>AlphaQuest - Web3 Growth Platform</p>
        </div>
      </footer>
    </>
  );
}
