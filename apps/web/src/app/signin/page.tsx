'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useWallet } from '@/contexts/WalletContext';
import { Button } from '@/components/Button';

export default function SignInPage() {
  const router = useRouter();
  const { address, isConnected, isConnecting, connect, signMessage } = useWallet();
  const [isLoading, setIsLoading] = useState(false);

  const handleWalletConnect = async () => {
    if (isConnected && address) {
      try {
        setIsLoading(true);
        const nonceResponse = await fetch('/api/auth/nonce', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ wallet: address }),
        });

        if (!nonceResponse.ok) {
          throw new Error('Failed to get nonce');
        }

        const { nonce } = await nonceResponse.json();

        const message = `Sign this message to login to AlphaQuest.\n\nWallet: ${address}\nNonce: ${nonce}`;
        const signature = await signMessage(message);

        const loginResponse = await fetch('/api/auth/wallet-login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            wallet: address,
            signature,
            nonce,
          }),
        });

        if (loginResponse.ok) {
          router.push('/');
        } else {
          throw new Error('Login failed');
        }
      } catch (error) {
        console.error('Sign in failed:', error);
        alert('Sign in failed. Please try again.');
      } finally {
        setIsLoading(false);
      }
    } else {
      await connect();
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">
      <header className="border-b border-gray-800">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-cyan-600 rounded-lg flex items-center justify-center">
              <span className="font-bold">A</span>
            </div>
            <span className="text-xl font-bold">AlphaQuest</span>
          </Link>
        </div>
      </header>

      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2">Welcome to AlphaQuest</h1>
            <p className="text-gray-400">
              {isConnected ? 'Sign to login with your wallet' : 'Connect your wallet to continue'}
            </p>
          </div>

          <div className="space-y-4">
            {isConnected && address && (
              <div className="p-4 bg-gray-800 rounded-lg">
                <p className="text-sm text-gray-400 mb-1">Connected Wallet</p>
                <p className="font-mono text-sm">
                  {address.slice(0, 6)}...{address.slice(-4)}
                </p>
              </div>
            )}

            <Button
              onClick={handleWalletConnect}
              disabled={isConnecting || isLoading}
              className="w-full"
              size="lg"
            >
              {isConnecting
                ? 'Connecting...'
                : isLoading
                ? 'Signing...'
                : isConnected
                ? 'Sign In'
                : 'Connect Wallet'}
            </Button>
          </div>

          <p className="text-center text-gray-500 text-sm mt-6">
            By signing in, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </div>
    </div>
  );
}
