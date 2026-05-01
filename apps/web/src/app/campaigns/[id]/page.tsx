import Link from 'next/link';
import { Button } from '@alphaquest/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@alphaquest/ui/card';
import { AppShell } from '@/components/AppShell';
import { ProgressBar } from '@/components/ProgressBar';
import { TaskCard } from '@/components/TaskCard';
import { getCampaign, getDrawPool, tasks } from '@/lib/mock-data';

export default function CampaignPage({ params }: { params: { id: string } }) {
  const campaign = getCampaign(params.id);
  const campaignTasks = tasks.filter((task) => task.campaignId === campaign.id);
  const draw = getDrawPool(campaign.drawId);
  return <AppShell><Card><CardHeader><CardTitle>{campaign.title}</CardTitle></CardHeader><CardContent className="space-y-4"><p className="text-gray-400">{campaign.description}</p><ProgressBar value={campaign.progress} /><p className="text-sm text-gray-500">{campaign.participants.toLocaleString()} participants</p><Button><Link href={`/draws/${draw.id}`}>Open reward pool</Link></Button></CardContent></Card><h2 className="mt-8 text-2xl font-bold">Campaign tasks</h2><div className="mt-4 grid gap-4 md:grid-cols-2">{campaignTasks.map((task) => <TaskCard key={task.id} task={task} />)}</div></AppShell>;
}
