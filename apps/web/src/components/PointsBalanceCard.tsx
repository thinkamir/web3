import { Card, CardContent, CardHeader, CardTitle } from '@alphaquest/ui/card';
import { userProfile } from '@/lib/mock-data';

export function PointsBalanceCard() {
  const { available, pending, locked, totalEarned } = userProfile.points;
  return (
    <Card className="bg-gradient-to-br from-primary-900/40 to-card">
      <CardHeader><CardTitle>Points balance</CardTitle></CardHeader>
      <CardContent>
        <div className="text-4xl font-black text-primary-300">{available.toLocaleString()}</div>
        <p className="mt-1 text-sm text-gray-400">Available points for eligible reward pools</p>
        <div className="mt-5 grid grid-cols-3 gap-3 text-sm">
          <span><b className="block text-white">{pending}</b><span className="text-gray-500">Pending</span></span>
          <span><b className="block text-white">{locked}</b><span className="text-gray-500">Locked</span></span>
          <span><b className="block text-white">{totalEarned}</b><span className="text-gray-500">Earned</span></span>
        </div>
      </CardContent>
    </Card>
  );
}
