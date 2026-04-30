'use client';

import React, { createContext, useContext } from 'react';
import { useAccount, useConnect, useDisconnect, useSignMessage, useBalance, useChainId } from 'wagmi';

interface WalletState {
  address: string | null;
  isConnected: boolean;
  isConnecting: boolean;
  balance: string | null;
  chainId: number | null;
  connect: () => void;
  disconnect: () => void;
  signMessage: (message: string) => Promise<string>;
}

const WalletContext = createContext<WalletState | null>(null);

export function useWallet() {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
}

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const { address, isConnected } = useAccount();
  const { connect, connectors, isPending: isConnecting } = useConnect();
  const { disconnect } = useDisconnect();
  const { signMessageAsync } = useSignMessage();
  const { data: balanceData } = useBalance({ address: address });
  const chainId = useChainId();

  const balance = balanceData ? balanceData.formatted : null;

  const handleConnect = () => {
    const connector = connectors[0];
    if (connector) {
      connect({ connector });
    }
  };

  const handleSignMessage = async (message: string): Promise<string> => {
    if (!address) {
      throw new Error('Wallet not connected');
    }
    return signMessageAsync({ message });
  };

  const value: WalletState = {
    address: address || null,
    isConnected: isConnected,
    isConnecting: isConnecting,
    balance,
    chainId: chainId || null,
    connect: handleConnect,
    disconnect,
    signMessage: handleSignMessage,
  };

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
}
