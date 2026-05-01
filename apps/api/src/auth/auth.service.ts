import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
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

  async generateNonce(wallet: string): Promise<{ nonce: string; expiresAt: Date; message: string }> {
    const normalizedWallet = this.normalizeWallet(wallet);
    const nonce = crypto.randomBytes(32).toString('hex');
    const issuedAt = new Date();
    const expiresAt = new Date(issuedAt.getTime() + 5 * 60 * 1000);
    const domain = this.getAppDomain();

    const user = await this.prisma.user.upsert({
      where: { wallet: normalizedWallet },
      create: {
        wallet: normalizedWallet,
        referral_code: this.generateReferralCode(),
      },
      update: {},
    });

    const message = this.buildLoginMessage(normalizedWallet, nonce, issuedAt.getTime(), domain);

    await this.prisma.authNonce.create({
      data: {
        user_id: user.id,
        wallet: normalizedWallet,
        nonce,
        domain,
        message,
        expires_at: expiresAt,
      },
    });

    return { nonce, expiresAt, message };
  }

  async walletLogin(
    wallet: string,
    signature: string,
    nonce: string,
    timestamp: number,
    message?: string,
  ): Promise<{ accessToken: string; refreshToken: string; user: any }> {
    const normalizedWallet = this.normalizeWallet(wallet);
    const domain = this.getAppDomain();

    const authNonce = await this.prisma.authNonce.findUnique({
      where: { nonce },
      include: { user: true },
    });

    if (!authNonce || authNonce.wallet !== normalizedWallet || authNonce.domain !== domain) {
      throw new UnauthorizedException('Invalid nonce');
    }

    if (authNonce.consumed_at) {
      throw new UnauthorizedException('Nonce already consumed');
    }

    if (authNonce.expires_at.getTime() < Date.now()) {
      throw new UnauthorizedException('Nonce expired');
    }

    if (Math.abs(Date.now() - timestamp) > 5 * 60 * 1000) {
      throw new UnauthorizedException('Signature timestamp expired');
    }

    const expectedMessage = this.buildLoginMessage(normalizedWallet, nonce, timestamp, domain);
    const loginMessage = message ?? expectedMessage;

    if (expectedMessage !== authNonce.message || loginMessage !== authNonce.message) {
      throw new UnauthorizedException('Invalid login message');
    }

    try {
      const recoveredAddress = ethers.verifyMessage(loginMessage, signature);

      if (recoveredAddress.toLowerCase() !== normalizedWallet) {
        throw new UnauthorizedException('Invalid signature');
      }
    } catch (error) {
      throw new UnauthorizedException('Signature verification failed');
    }

    const user = await this.prisma.$transaction(async (tx) => {
      const consumed = await tx.authNonce.updateMany({
        where: {
          id: authNonce.id,
          consumed_at: null,
          expires_at: { gt: new Date() },
        },
        data: { consumed_at: new Date() },
      });

      if (consumed.count !== 1) {
        throw new UnauthorizedException('Nonce already consumed');
      }

      return tx.user.findUniqueOrThrow({
        where: { id: authNonce.user_id },
      });
    });

    if (user.status !== 'active') {
      throw new UnauthorizedException('User is not active');
    }

    const payload = { sub: user.id, wallet: user.wallet };

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: this.configService.get('JWT_ACCESS_EXPIRES_IN') || '1h',
    });
    const refreshToken = this.jwtService.sign(payload, {
      expiresIn: this.configService.get('JWT_REFRESH_EXPIRES_IN') || '7d',
    });

    return {
      accessToken,
      refreshToken,
      user: this.serializeUser(user),
    };
  }

  async refreshToken(token: string): Promise<{ accessToken: string }> {
    try {
      const payload = this.jwtService.verify(token);
      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
      });

      if (!user || user.status !== 'active') {
        throw new UnauthorizedException('User not found');
      }

      const newPayload = { sub: user.id, wallet: user.wallet };
      const accessToken = this.jwtService.sign(newPayload, {
        expiresIn: this.configService.get('JWT_ACCESS_EXPIRES_IN') || '1h',
      });

      return { accessToken };
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  private normalizeWallet(wallet: string): string {
    if (!wallet || !ethers.isAddress(wallet)) {
      throw new BadRequestException('Invalid wallet address');
    }
    return wallet.toLowerCase();
  }

  private buildLoginMessage(wallet: string, nonce: string, timestamp: number, domain: string): string {
    return `${domain} wants you to sign in with your Ethereum account:\n${wallet}\n\nSign in to AlphaQuest.\n\nURI: ${domain}\nVersion: 1\nChain ID: 1\nNonce: ${nonce}\nIssued At: ${new Date(timestamp).toISOString()}`;
  }

  private getAppDomain(): string {
    return this.configService.get('APP_DOMAIN') || 'localhost';
  }

  private serializeUser(user: any) {
    return {
      id: user.id,
      wallet: user.wallet,
      username: user.username,
      avatar: user.avatar,
      referral_code: user.referral_code,
      user_level: user.user_level,
      risk_score: user.risk_score,
      status: user.status,
    };
  }

  private generateReferralCode(): string {
    return crypto.randomBytes(4).toString('hex').toUpperCase();
  }
}
