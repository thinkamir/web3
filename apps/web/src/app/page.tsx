import Link from 'next/link';
import { Button } from '@alphaquest/ui/button';
import { AppShell } from '@/components/AppShell';
import { CampaignCard } from '@/components/CampaignCard';
import { DrawPoolCard } from '@/components/DrawPoolCard';
import { PointsBalanceCard } from '@/components/PointsBalanceCard';
import { RiskWarning } from '@/components/RiskWarning';
import { TaskCard } from '@/components/TaskCard';
import { campaigns, drawPools, tasks } from '@/lib/mock-data';

export default function HomePage() {
  return (
    <AppShell>
      <section className="grid gap-6 md:grid-cols-[1.3fr_0.7fr]">
        <div className="rounded-3xl border border-border bg-card p-6 md:p-10">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-primary-400">Web3 Growth MVP</p>
          <h1 className="mt-4 text-4xl font-black md:text-6xl">Complete quests, earn auditable points, join fair reward pools.</h1>
          <p className="mt-4 text-gray-400">Mock H5 skeleton for the user-facing AlphaQuest journey: wallet, tasks, referrals, point ledger and on-chain reward pool visibility.</p>
          <div className="mt-6 flex flex-wrap gap-3"><Button><Link href="/tasks">Start tasks</Link></Button><Button variant="outline"><Link href="/points">View ledger</Link></Button></div>
        </div>
        <PointsBalanceCard />
      </section>
      <section className="mt-8"><RiskWarning level="low" /></section>
      <section className="mt-10 space-y-4"><h2 className="text-2xl font-bold">Featured tasks</h2><div className="grid gap-4 md:grid-cols-3">{tasks.slice(0,3).map((task) => <TaskCard key={task.id} task={task} />)}</div></section>
      <section className="mt-10 space-y-4"><h2 className="text-2xl font-bold">Active campaigns</h2><div className="grid gap-4 md:grid-cols-2">{campaigns.map((campaign) => <CampaignCard key={campaign.id} campaign={campaign} />)}</div></section>
      <section className="mt-10 space-y-4"><h2 className="text-2xl font-bold">Reward pools</h2><div className="grid gap-4 md:grid-cols-2">{drawPools.map((draw) => <DrawPoolCard key={draw.id} draw={draw} />)}</div></section>
    </AppShell>
  );
}
