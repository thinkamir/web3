import { Button } from '@alphaquest/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@alphaquest/ui/card';
import { AppShell } from '@/components/AppShell';
import { RiskWarning } from '@/components/RiskWarning';
import { TransactionStatus } from '@/components/TransactionStatus';
import { getTask } from '@/lib/mock-data';

export default function TaskDetailPage({ params }: { params: { id: string } }) {
  const task = getTask(params.id);
  return <AppShell><div className="grid gap-6 md:grid-cols-[1fr_320px]"><Card><CardHeader><CardTitle>{task.title}</CardTitle></CardHeader><CardContent className="space-y-5"><p className="text-gray-400">{task.description}</p><ol className="space-y-3">{task.steps.map((step, index) => <li key={step} className="rounded-lg bg-background p-3 text-sm"><b className="text-primary-300">{index + 1}.</b> {step}</li>)}</ol><Button>Submit mock completion</Button></CardContent></Card><div className="space-y-4"><Card><CardContent className="space-y-2"><p className="text-sm text-gray-400">Reward</p><p className="text-3xl font-black text-primary-300">+{task.reward} AP</p><p className="text-sm text-gray-500">Status: {task.status}</p></CardContent></Card><RiskWarning level={task.riskLevel} /><TransactionStatus label="Latest task submission" hash="mock-submission-not-on-chain" status={task.status} /></div></div></AppShell>;
}
