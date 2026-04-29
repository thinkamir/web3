'use client';

import Link from 'next/link';
import { useWallet } from '@/contexts/WalletContext';
import { Button } from '@/components/Button';

export function Header() {
  const { address, isConnected, connect, disconnect } = useWallet();

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  return (
    <header className="border-b border-gray-800">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-cyan-600 rounded-lg flex items-center justify-center">
              <span className="font-bold">A</span>
            </div>
            <span className="text-xl font-bold">AlphaQuest</span>
          </Link>
        </div>
        <nav className="flex items-center gap-6">
          <Link href="/" className="text-gray-400 hover:text-white transition">
            Home
          </Link>
          <Link href="/tasks" className="text-gray-400 hover:text-white transition">
            Tasks
          </Link>
          <Link href="/draws" className="text-gray-400 hover:text-white transition">
            Draws
          </Link>
          <Link href="/projects" className="text-gray-400 hover:text-white transition">
            Projects
          </Link>
          <Link href="/profile" className="text-gray-400 hover:text-white transition">
            Profile
          </Link>
        </nav>
        <div>
          {isConnected && address ? (
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-400">{formatAddress(address)}</span>
              <Button variant="outline" size="sm" onClick={disconnect}>
                Disconnect
              </Button>
            </div>
          ) : (
            <Button onClick={connect} disabled={false}>
              Connect Wallet
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
