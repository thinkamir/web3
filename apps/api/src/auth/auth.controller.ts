import { Controller, Post, Body, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthService } from './auth.service';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('nonce')
  @ApiOperation({ summary: 'Generate nonce for wallet login' })
  @ApiResponse({ status: 200, description: 'Nonce generated successfully' })
  async generateNonce(@Body() body: { wallet: string }) {
    const { nonce, expiresAt } = await this.authService.generateNonce(body.wallet);
    return { nonce, expiresAt };
  }

  @Post('wallet-login')
  @ApiOperation({ summary: 'Login with wallet signature' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  async walletLogin(@Body() body: {
    wallet: string;
    signature: string;
    nonce: string;
    timestamp: number;
  }) {
    return this.authService.walletLogin(
      body.wallet,
      body.signature,
      body.nonce,
      body.timestamp,
    );
  }

  @Post('refresh')
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiResponse({ status: 200, description: 'Token refreshed successfully' })
  async refreshToken(@Body() body: { refreshToken: string }) {
    return this.authService.refreshToken(body.refreshToken);
  }
}
