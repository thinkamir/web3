import { Button } from '@alphaquest/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@alphaquest/ui/card';
import { userProfile } from '@/lib/mock-data';

export function ReferralInviteCard() {
  const link = `https://alphaquest.example/invite/${userProfile.referralCode}`;
  return (
    <Card>
      <CardHeader><CardTitle>Invite friends</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-gray-400">Rewards stay pending until referred users complete eligible tasks and pass risk checks.</p>
        <div className="rounded-lg border border-border bg-background p-3 font-mono text-sm text-primary-300">{link}</div>
        <Button size="sm">Copy invite link</Button>
      </CardContent>
    </Card>
  );
}
