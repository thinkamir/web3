import { Controller, Get, Post, Delete, Body, Param, Query, UseGuards, Headers, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ApiService } from './api.service';
import { HmacGuard } from './hmac.guard';

@ApiTags('API Platform')
@Controller('api')
export class ApiController {
  constructor(private apiService: ApiService) {}

  @Post('keys')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create API key' })
  async createKey(@Body() body: {
    project_id: string;
    permissions: string[];
  }) {
    return this.apiService.createApiKey(body.project_id, body.project_id, body.permissions);
  }

  @Get('keys')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List API keys' })
  async listKeys(@Query('project_id') projectId: string) {
    return { keys: [] };
  }

  @Delete('keys/:keyId')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Revoke API key' })
  async revokeKey(@Param('keyId') keyId: string) {
    return this.apiService.revokeApiKey(keyId);
  }

  @Post('webhooks')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create webhook subscription' })
  async createWebhook(@Body() body: {
    project_id: string;
    url: string;
    events: string[];
    secret: string;
  }) {
    return this.apiService.createWebhookSubscription(
      body.project_id,
      body.url,
      body.events,
      body.secret,
    );
  }

  @Get('webhooks')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List webhook subscriptions' })
  async listWebhooks(@Query('project_id') projectId: string) {
    return this.apiService.getWebhookSubscriptions(projectId);
  }

  @Delete('webhooks/:id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete webhook subscription' })
  async deleteWebhook(@Param('id') id: string) {
    return this.apiService.deleteWebhookSubscription(id);
  }
}
