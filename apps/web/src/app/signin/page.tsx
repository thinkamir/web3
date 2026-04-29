'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function SignInPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [wallet, setWallet] = useState<string | null>(null);

  const connectWallet = async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        setIsLoading(true);
        const accounts = await window.ethereum.request({
          method: 'eth_requestAccounts',
        });
        setWallet(accounts[0]);
        setIsLoading(false);
      } catch (error) {
        console.error('Failed to connect wallet:', error);
        setIsLoading(false);
      }
    }
  };

  const handleSignIn = async () => {
    if (!wallet) return;

    try {
      setIsLoading(true);
      const nonceResponse = await fetch('/api/auth/nonce', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wallet }),
      });

      const { nonce } = await nonceResponse.json();

      const signature = await window.ethereum.request({
        method: 'personal_sign',
        params: [
          JSON.stringify({
            message: `Sign this message to login to AlphaQuest.\n\nWallet: ${wallet}\nNonce: ${nonce}\nTimestamp: ${Date.now()}\nDomain: alphaquest.io`,
          }),
          wallet,
        ],
      });

      const loginResponse = await fetch('/api/auth/wallet-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wallet,
          signature,
          nonce,
          timestamp: Date.now(),
        }),
      });

      if (loginResponse.ok) {
        router.push('/');
      }
    } catch (error) {
      console.error('Sign in failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
      <div className="w-full max-w-md p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-cyan-600 rounded-2xl mx-auto mb-4 flex items-center justify-center">
            <span className="text-2xl font-bold">A</span>
          </div>
          <h1 className="text-2xl font-bold">Welcome to AlphaQuest</h1>
          <p className="text-gray-400 mt-2">Connect your wallet to continue</p>
        </div>

        <div className="space-y-4">
          <button
            onClick={connectWallet}
            disabled={isLoading}
            className="w-full p-4 bg-gray-800 hover:bg-gray-700 rounded-lg flex items-center justify-center gap-3 transition disabled:opacity-50"
          >
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
              <path d="M21.5 13.5L14 20.5H10L2.5 13.5L10 6.5H14L21.5 13.5Z" />
            </svg>
            MetaMask
          </button>

          {wallet && (
            <div className="space-y-3">
              <div className="p-4 bg-gray-800 rounded-lg">
                <p className="text-sm text-gray-400 mb-1">Connected Wallet</p>
                <p className="font-mono">{wallet.slice(0, 6)}...{wallet.slice(-4)}</p>
              </div>
              <button
                onClick={handleSignIn}
                disabled={isLoading}
                className="w-full p-4 bg-cyan-600 hover:bg-cyan-700 rounded-lg font-semibold transition disabled:opacity-50"
              >
                {isLoading ? 'Signing in...' : 'Sign In'}
              </button>
            </div>
          )}
        </div>

        <p className="text-center text-gray-500 text-sm mt-6">
          By signing in, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  );
}
