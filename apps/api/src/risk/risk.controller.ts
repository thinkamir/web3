import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { RiskService } from './risk.service';

@ApiTags('Risk')
@Controller('risk')
export class RiskController {
  constructor(private riskService: RiskService) {}

  @Post('evaluate-user')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Evaluate user risk score' })
  async evaluateUser(@Body() body: { user_id: string }) {
    return this.riskService.evaluateUser(body.user_id);
  }

  @Post('evaluate-task-submission')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Evaluate task submission risk' })
  async evaluateSubmission(@Body() body: { submission_id: string }) {
    return this.riskService.evaluateTaskSubmission(body.submission_id);
  }

  @Post('evaluate-referral')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Evaluate referral risk' })
  async evaluateReferral(@Body() body: { referrer_id: string; invitee_id: string }) {
    return this.riskService.evaluateReferral(body.referrer_id, body.invitee_id);
  }

  @Get('users/high-risk')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get high risk users' })
  async getHighRiskUsers(@Query('limit') limit?: number) {
    return this.riskService.getHighRiskUsers(limit);
  }

  @Get('events')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get risk events' })
  async getEvents(@Query('user_id') userId?: string, @Query('limit') limit?: number) {
    return this.riskService.getRiskEvents(userId, limit);
  }

  @Post('users/:id/freeze')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Freeze user' })
  async freezeUser(@Param('id') id: string, @Body() body: { reason: string }) {
    return this.riskService.freezeUser(id, body.reason);
  }

  @Post('users/:id/unfreeze')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Unfreeze user' })
  async unfreezeUser(@Param('id') id: string) {
    return this.riskService.unfreezeUser(id);
  }
}
