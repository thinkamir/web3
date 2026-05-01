import { Card, CardContent, CardHeader, CardTitle } from '@alphaquest/ui/card';
import { AppShell } from '@/components/AppShell';
import { TicketRangeDisplay } from '@/components/TicketRangeDisplay';
import { getDrawPool } from '@/lib/mock-data';

export default function DrawResultPage({ params }: { params: { id: string } }) {
  const draw = getDrawPool(params.id);
  const won = !!draw.winningTicket && draw.winningTicket >= draw.userTicketStart && draw.winningTicket <= draw.userTicketEnd;
  return <AppShell><Card><CardHeader><CardTitle>{draw.title} result</CardTitle></CardHeader><CardContent className="space-y-5"><TicketRangeDisplay start={draw.userTicketStart} end={draw.userTicketEnd} /><div className="rounded-xl bg-background p-5"><p className="text-sm text-gray-400">Winning ticket</p><p className="text-4xl font-black text-primary-300">{draw.winningTicket ? `#${draw.winningTicket}` : 'Pending'}</p></div><p className={won ? 'text-emerald-300' : 'text-gray-400'}>{won ? 'Eligible to claim with proof.' : 'Result is pending or this mock wallet did not match.'}</p></CardContent></Card></AppShell>;
}
