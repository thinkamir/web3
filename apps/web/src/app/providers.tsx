'use client';

import { WagmiConfig, createConfig } from 'wagmi';
import { mainnet, sepolia } from 'wagmi/chains';
import { connectors } from 'wagmi';

const config = createConfig({
  chains: [mainnet, sepolia],
  connectors: connectors.injected(),
});

export function Providers({ children }: { children: React.ReactNode }) {
  return <WagmiConfig config={config}>{children}</WagmiConfig>;
}
