'use client';

import { WagmiProvider, createConfig, http } from 'wagmi';
import { mainnet, sepolia } from 'wagmi/chains';
import { injected } from 'wagmi/connectors';
import { WalletProvider } from '@/contexts/WalletContext';

const config = createConfig({
  chains: [mainnet, sepolia],
  connectors: [
    injected(),
  ],
  transports: {
    [mainnet.id]: http(),
    [sepolia.id]: http(),
  },
});

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <WalletProvider>
        {children}
      </WalletProvider>
    </WagmiProvider>
  );
}
