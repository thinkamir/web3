import Link from 'next/link';
import { Button } from '@alphaquest/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@alphaquest/ui/card';
import { AppShell } from '@/components/AppShell';
import { RiskWarning } from '@/components/RiskWarning';
import { TicketRangeDisplay } from '@/components/TicketRangeDisplay';
import { TransactionStatus } from '@/components/TransactionStatus';
import { getDrawPool } from '@/lib/mock-data';

export default function DrawPage({ params }: { params: { id: string } }) {
  const draw = getDrawPool(params.id);
  return <AppShell><div className="grid gap-6 md:grid-cols-[1fr_340px]"><Card><CardHeader><CardTitle>{draw.title}</CardTitle></CardHeader><CardContent className="space-y-4"><p className="text-gray-300">Prize: {draw.prize}</p><TicketRangeDisplay start={draw.userTicketStart} end={draw.userTicketEnd} /><TransactionStatus label="Merkle root transaction" hash={draw.txHash} status={draw.status} /><Button><Link href={`/draws/${draw.id}/result`}>View result</Link></Button></CardContent></Card><div className="space-y-4"><RiskWarning level="medium" /><Card><CardContent className="space-y-2 text-sm text-gray-400"><p>Contract: <span className="text-white">{draw.contractAddress}</span></p><p>Root: <span className="text-white">{draw.merkleRoot}</span></p><p>Total tickets: <span className="text-white">{draw.totalTickets}</span></p></CardContent></Card></div></div></AppShell>;
}
