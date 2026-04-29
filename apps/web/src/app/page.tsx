'use client';

import { useState } from 'react';
import { Providers } from './providers';
import { Button } from '@/components/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/Card';
import { Modal, ModalHeader, ModalTitle, ModalContent, ModalFooter } from '@/components/Modal';

export default function HomePage() {
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [wallet, setWallet] = useState<string | null>(null);

  const handleConnect = async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        const accounts = await window.ethereum.request({
          method: 'eth_requestAccounts',
        });
        setWallet(accounts[0]);
        setIsConnected(true);
        setIsWalletModalOpen(false);
      } catch (error) {
        console.error('Failed to connect wallet:', error);
      }
    }
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <Providers>
      <div className="min-h-screen">
        <header className="border-b border-border">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                <span className="font-bold text-white">A</span>
              </div>
              <span className="text-xl font-bold">AlphaQuest</span>
            </div>
            <nav className="hidden md:flex items-center gap-6">
              <a href="/tasks" className="text-gray-300 hover:text-white transition">
                Tasks
              </a>
              <a href="/draws" className="text-gray-300 hover:text-white transition">
                Draws
              </a>
              <a href="/projects" className="text-gray-300 hover:text-white transition">
                Projects
              </a>
            </nav>
            <div>
              {isConnected && wallet ? (
                <Button variant="outline">{formatAddress(wallet)}</Button>
              ) : (
                <Button onClick={() => setIsWalletModalOpen(true)}>Connect Wallet</Button>
              )}
            </div>
          </div>
        </header>

        <main>
          <section className="py-20">
            <div className="container mx-auto px-4 text-center">
              <h1 className="text-5xl font-bold mb-6">
                Web3 Growth <span className="text-gradient">Infrastructure</span>
              </h1>
              <p className="text-xl text-gray-400 mb-8 max-w-2xl mx-auto">
                AlphaQuest is the growth platform for Web3 projects. Create quests,
                reward users, and build your community with on-chain fair draws.
              </p>
              <div className="flex gap-4 justify-center">
                <Button size="lg">Start Exploring</Button>
                <Button size="lg" variant="outline">
                  For Projects
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
                      <span className="text-primary-500 font-semibold">+10 AP</span>
                      <Button size="sm">Start</Button>
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
                      <span className="text-primary-500 font-semibold">+50 AP</span>
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
                      <span className="text-primary-500 font-semibold">+100 AP</span>
                      <Button size="sm">Start</Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </section>

          <section className="py-16 border-t border-border">
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
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <div className="bg-primary-600 h-2 rounded-full" style={{ width: '65%' }} />
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
                      <div className="w-full bg-gray-700 rounded-full h-2">
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

        <footer className="border-t border-border py-8">
          <div className="container mx-auto px-4 text-center text-gray-400">
            <p>AlphaQuest - Web3 Growth Platform</p>
          </div>
        </footer>

        <Modal isOpen={isWalletModalOpen} onClose={() => setIsWalletModalOpen(false)}>
          <ModalHeader>
            <ModalTitle>Connect Wallet</ModalTitle>
          </ModalHeader>
          <ModalContent>
            <p className="text-gray-400 mb-6">
              Connect your wallet to start earning points and participating in draws.
            </p>
            <div className="space-y-3">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={handleConnect}
              >
                MetaMask
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                disabled
              >
                WalletConnect
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                disabled
              >
                Coinbase Wallet
              </Button>
            </div>
          </ModalContent>
          <ModalFooter>
            <Button variant="ghost" onClick={() => setIsWalletModalOpen(false)}>
              Cancel
            </Button>
          </ModalFooter>
        </Modal>
      </div>
    </Providers>
  );
}
