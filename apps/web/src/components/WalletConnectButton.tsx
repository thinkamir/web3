import { Button } from '@alphaquest/ui/button';
import { userProfile } from '@/lib/mock-data';

export function WalletConnectButton() {
  return <Button variant="outline" size="sm">{userProfile.wallet}</Button>;
}
