import { Controller, Get, Post, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ApiService } from './api.service';
import { CurrentUser, JwtUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@ApiTags('API Platform')
@Controller('api')
export class ApiController {
  constructor(private apiService: ApiService) {}

  @Post('keys')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create API key' })
  async createKey(
    @CurrentUser() user: JwtUser,
    @Body() body: {
    project_id: string;
    permissions: string[];
  }) {
    return this.apiService.createApiKey(body.project_id, user.userId, body.permissions);
  }

  @Get('keys')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List API keys' })
  async listKeys(@CurrentUser() user: JwtUser, @Query('project_id') projectId: string) {
    return this.apiService.listApiKeys(projectId, user.userId);
  }

  @Delete('keys/:keyId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Revoke API key' })
  async revokeKey(@CurrentUser() user: JwtUser, @Param('keyId') keyId: string) {
    return this.apiService.revokeApiKey(keyId, user.userId);
  }

  @Post('webhooks')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create webhook subscription' })
  async createWebhook(
    @CurrentUser() user: JwtUser,
    @Body() body: {
    project_id: string;
    url: string;
    events: string[];
    secret: string;
  }) {
    return this.apiService.createWebhookSubscription(
      body.project_id,
      user.userId,
      body.url,
      body.events,
      body.secret,
    );
  }

  @Get('webhooks')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List webhook subscriptions' })
  async listWebhooks(@CurrentUser() user: JwtUser, @Query('project_id') projectId: string) {
    return this.apiService.getWebhookSubscriptions(projectId, user.userId);
  }

  @Delete('webhooks/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete webhook subscription' })
  async deleteWebhook(@CurrentUser() user: JwtUser, @Param('id') id: string) {
    return this.apiService.deleteWebhookSubscription(id, user.userId);
  }
}
