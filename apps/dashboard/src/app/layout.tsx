import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Project Dashboard - AlphaQuest',
  description: 'Manage your Web3 project campaigns and tasks',
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-background text-white min-h-screen">{children}</body>
    </html>
  );
}
