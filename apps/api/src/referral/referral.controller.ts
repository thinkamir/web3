import { Controller, Get, Post, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ReferralService } from './referral.service';

@ApiTags('Referrals')
@Controller('referrals')
export class ReferralController {
  constructor(private referralService: ReferralService) {}

  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get my referral statistics' })
  async getMyReferrals(@Request() req: any) {
    return this.referralService.getReferralStats(req.user.userId);
  }

  @Post('me/release')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Release pending referral rewards' })
  async releaseRewards(@Request() req: any) {
    return this.referralService.releaseReferralRewards(req.user.userId);
  }

  @Post('bind')
  @ApiOperation({ summary: 'Bind referral code for new user' })
  async bindReferral(@Body() body: { wallet: string; referral_code: string }) {
    return this.referralService.checkAndBindReferral(body.wallet, body.referral_code);
  }

  @Post(':id/flag')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Flag suspicious referral (admin)' })
  async flagReferral(@Param('id') id: string, @Body() body: { reason: string }) {
    return this.referralService.flagSuspiciousReferral(id, body.reason);
  }
}
