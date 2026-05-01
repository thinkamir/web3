import { Card, CardContent, CardHeader, CardTitle } from '@alphaquest/ui/card';
import { AppShell } from '@/components/AppShell';
import { PointsBalanceCard } from '@/components/PointsBalanceCard';
import { pointTransactions } from '@/lib/mock-data';

export default function PointsPage() {
  return <AppShell><PointsBalanceCard /><Card className="mt-6"><CardHeader><CardTitle>Auditable point ledger</CardTitle></CardHeader><CardContent className="space-y-3">{pointTransactions.map((tx) => <div key={tx.id} className="flex items-center justify-between rounded-lg bg-background p-3 text-sm"><span><b className="block">{tx.label}</b><span className="text-gray-500">{tx.time} · {tx.status}</span></span><span className={tx.amount > 0 ? 'text-emerald-300' : 'text-amber-300'}>{tx.amount > 0 ? '+' : ''}{tx.amount} AP</span></div>)}</CardContent></Card></AppShell>;
}
