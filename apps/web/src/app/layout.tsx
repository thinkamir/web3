import type { Metadata } from 'next';
import { Providers } from './providers';
import './globals.css';

export const metadata: Metadata = {
  title: 'AlphaQuest - Web3 Growth Platform',
  description: 'Web3 project growth infrastructure and quest platform',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-gray-950 text-white min-h-screen">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
