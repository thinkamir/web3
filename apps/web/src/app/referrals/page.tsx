import { Card, CardContent, CardHeader, CardTitle } from '@alphaquest/ui/card';
import { AppShell } from '@/components/AppShell';
import { ReferralInviteCard } from '@/components/ReferralInviteCard';
import { RiskWarning } from '@/components/RiskWarning';
import { referrals } from '@/lib/mock-data';

export default function ReferralsPage() {
  return <AppShell><div className="grid gap-6 md:grid-cols-[1fr_1fr]"><ReferralInviteCard /><RiskWarning level="medium" /></div><Card className="mt-6"><CardHeader><CardTitle>Referral status</CardTitle></CardHeader><CardContent className="space-y-3">{referrals.map((referral) => <div key={referral.wallet} className="flex items-center justify-between rounded-lg bg-background p-3 text-sm"><span>{referral.wallet}<b className="block text-gray-500">{referral.status}</b></span><span className="text-primary-300">{referral.reward} AP</span></div>)}</CardContent></Card></AppShell>;
}
