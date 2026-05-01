import Link from 'next/link';
import { Button } from '@alphaquest/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@alphaquest/ui/card';
import type { Campaign } from '@/lib/mock-data';
import { ProgressBar } from './ProgressBar';

export function CampaignCard({ campaign }: { campaign: Campaign }) {
  return (
    <Card>
      <CardHeader><CardTitle>{campaign.title}</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-gray-400">{campaign.description}</p>
        <ProgressBar value={campaign.progress} />
        <p className="text-xs text-gray-500">{campaign.participants.toLocaleString()} participants · {campaign.progress}% progress</p>
        <Button size="sm"><Link href={`/campaigns/${campaign.id}`}>View campaign</Link></Button>
      </CardContent>
    </Card>
  );
}
