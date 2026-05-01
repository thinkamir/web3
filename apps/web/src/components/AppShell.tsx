import Link from 'next/link';
import { WalletConnectButton } from './WalletConnectButton';

const navItems = [
  { href: '/', label: 'Home' },
  { href: '/tasks', label: 'Tasks' },
  { href: '/points', label: 'Points' },
  { href: '/referrals', label: 'Referrals' },
  { href: '/me', label: 'Me' },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background pb-24 text-white">
      <header className="sticky top-0 z-20 border-b border-border bg-background/90 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <Link href="/" className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-600 font-black">A</span>
            <span className="text-lg font-bold">AlphaQuest</span>
          </Link>
          <WalletConnectButton />
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-6">{children}</main>
      <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-card/95 backdrop-blur md:hidden">
        <div className="grid grid-cols-5 text-center text-xs text-gray-400">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} className="px-2 py-3 hover:text-primary-400">
              {item.label}
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}
