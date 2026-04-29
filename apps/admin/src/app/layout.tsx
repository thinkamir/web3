import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Admin - AlphaQuest',
  description: 'Platform administration dashboard',
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-background text-white min-h-screen">{children}</body>
    </html>
  );
}
