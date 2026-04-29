import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { ethers } from 'ethers';
import * as crypto from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async generateNonce(wallet: string): Promise<{ nonce: string; expiresAt: Date }> {
    const nonce = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    await this.prisma.user.upsert({
      where: { wallet: wallet.toLowerCase() },
      create: {
        wallet: wallet.toLowerCase(),
        referral_code: this.generateReferralCode(),
      },
      update: {},
    });

    await this.prisma.pointTransaction.create({
      data: {
        user: { connect: { wallet: wallet.toLowerCase() } },
        amount: 0,
        direction: 'credit',
        source_type: 'nonce',
        balance_after: 0,
      },
    });

    return { nonce, expiresAt };
  }

  async walletLogin(
    wallet: string,
    signature: string,
    nonce: string,
    timestamp: number,
  ): Promise<{ accessToken: string; refreshToken: string; user: any }> {
    const domain = this.configService.get('APP_DOMAIN') || 'localhost';
    const message = `Sign this message to login to AlphaQuest.\n\nWallet: ${wallet}\nNonce: ${nonce}\nTimestamp: ${timestamp}\nDomain: ${domain}`;

    try {
      const recoveredAddress = ethers.verifyMessage(message, signature);

      if (recoveredAddress.toLowerCase() !== wallet.toLowerCase()) {
        throw new UnauthorizedException('Invalid signature');
      }
    } catch (error) {
      throw new UnauthorizedException('Signature verification failed');
    }

    if (Date.now() - timestamp > 5 * 60 * 1000) {
      throw new UnauthorizedException('Signature expired');
    }

    let user = await this.prisma.user.findUnique({
      where: { wallet: wallet.toLowerCase() },
    });

    if (!user) {
      const referralCode = this.generateReferralCode();
      user = await this.prisma.user.create({
        data: {
          wallet: wallet.toLowerCase(),
          referral_code: referralCode,
        },
      });
    }

    const payload = { sub: user.id, wallet: user.wallet };

    const accessToken = this.jwtService.sign(payload, { expiresIn: '1h' });
    const refreshToken = this.jwtService.sign(payload, { expiresIn: '7d' });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        wallet: user.wallet,
        username: user.username,
        avatar: user.avatar,
        referral_code: user.referral_code,
        user_level: user.user_level,
        risk_score: user.risk_score,
        status: user.status,
      },
    };
  }

  async refreshToken(token: string): Promise<{ accessToken: string }> {
    try {
      const payload = this.jwtService.verify(token);
      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
      });

      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      const newPayload = { sub: user.id, wallet: user.wallet };
      const accessToken = this.jwtService.sign(newPayload, { expiresIn: '1h' });

      return { accessToken };
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  private generateReferralCode(): string {
    return crypto.randomBytes(4).toString('hex').toUpperCase();
  }
}
