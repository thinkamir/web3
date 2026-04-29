import type { Metadata } from 'next';
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
      <body className="bg-background text-white min-h-screen">{children}</body>
    </html>
  );
}
