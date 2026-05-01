import Link from 'next/link';
import { Button } from '@alphaquest/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@alphaquest/ui/card';
import { AppShell } from '@/components/AppShell';
import { PointsBalanceCard } from '@/components/PointsBalanceCard';
import { userProfile } from '@/lib/mock-data';

export default function MePage() {
  return <AppShell><div className="grid gap-6 md:grid-cols-[1fr_360px]"><Card><CardHeader><CardTitle>{userProfile.nickname}</CardTitle></CardHeader><CardContent className="space-y-3 text-gray-400"><p>Wallet: <span className="text-white">{userProfile.wallet}</span></p><p>Level: <span className="text-white">{userProfile.level}</span></p><p>Referral code: <span className="text-white">{userProfile.referralCode}</span></p><Button variant="outline"><Link href="/settings">Edit settings</Link></Button></CardContent></Card><PointsBalanceCard /></div></AppShell>;
}
