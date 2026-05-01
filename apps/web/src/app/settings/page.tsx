import { Input } from '@alphaquest/ui/input';
import { Button } from '@alphaquest/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@alphaquest/ui/card';
import { AppShell } from '@/components/AppShell';
import { userProfile } from '@/lib/mock-data';

export default function SettingsPage() {
  return <AppShell><Card><CardHeader><CardTitle>Profile settings</CardTitle></CardHeader><CardContent className="space-y-4"><Input label="Nickname" defaultValue={userProfile.nickname} /><Input label="Wallet" defaultValue={userProfile.wallet} disabled /><Input label="X / Telegram / Discord binding" placeholder="OAuth placeholders for P1 integrations" /><Button>Save mock settings</Button></CardContent></Card></AppShell>;
}
