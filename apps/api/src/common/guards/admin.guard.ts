import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const user = context.switchToHttp().getRequest().user;
    const adminWallets = (this.configService.get<string>('ADMIN_WALLETS') || '')
      .split(',')
      .map((wallet) => wallet.trim().toLowerCase())
      .filter(Boolean);

    if (user?.wallet && adminWallets.includes(user.wallet.toLowerCase())) return true;
    throw new ForbiddenException('Admin permission required');
  }
}
