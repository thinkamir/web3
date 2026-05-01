import { Body, Controller, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { GenerateNonceDto, RefreshTokenDto, WalletLoginDto } from './dto/auth.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('nonce')
  @ApiOperation({ summary: 'Generate nonce for wallet login' })
  @ApiResponse({ status: 200, description: 'Nonce generated successfully' })
  async generateNonce(@Body() body: GenerateNonceDto) {
    return this.authService.generateNonce(body.wallet);
  }

  @Post('wallet-login')
  @ApiOperation({ summary: 'Login with wallet signature' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  async walletLogin(@Body() body: WalletLoginDto) {
    return this.authService.walletLogin(
      body.wallet,
      body.signature,
      body.nonce,
      body.timestamp,
      body.message,
    );
  }

  @Post('refresh')
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiResponse({ status: 200, description: 'Token refreshed successfully' })
  async refreshToken(@Body() body: RefreshTokenDto) {
    return this.authService.refreshToken(body.refreshToken);
  }
}
