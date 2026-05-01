import Link from 'next/link';
import { Button } from '@alphaquest/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@alphaquest/ui/card';
import type { DrawPool } from '@/lib/mock-data';
import { TicketRangeDisplay } from './TicketRangeDisplay';

export function DrawPoolCard({ draw }: { draw: DrawPool }) {
  return (
    <Card>
      <CardHeader><CardTitle>{draw.title}</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <p className="text-gray-300">Prize: {draw.prize}</p>
        <TicketRangeDisplay start={draw.userTicketStart} end={draw.userTicketEnd} />
        <div className="grid grid-cols-2 gap-3 text-sm text-gray-400">
          <span>Status <b className="block text-white">{draw.status}</b></span>
          <span>Cost <b className="block text-white">{draw.requiredPoints} AP</b></span>
        </div>
        <Button size="sm"><Link href={`/draws/${draw.id}`}>Open pool</Link></Button>
      </CardContent>
    </Card>
  );
}
