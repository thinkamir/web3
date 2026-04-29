import { Controller, Get, Post, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { WebhookService } from './webhook.service';

@ApiTags('Webhooks')
@Controller('webhooks')
export class WebhookController {
  constructor(private webhookService: WebhookService) {}

  @Post()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create webhook subscription' })
  async createSubscription(@Body() body: {
    project_id: string;
    url: string;
    events: string[];
  }) {
    return this.webhookService.createSubscription(body.project_id, body.url, body.events);
  }

  @Get()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get webhook subscriptions' })
  async getSubscriptions(@Query('project_id') projectId: string) {
    return this.webhookService.getSubscriptions(projectId);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete webhook subscription' })
  async deleteSubscription(@Param('id') id: string) {
    return this.webhookService.deleteSubscription(id);
  }

  @Post('send')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Send test webhook' })
  async sendWebhook(@Body() body: {
    subscription_id: string;
    event_type: string;
    data: any;
  }) {
    const event = {
      type: body.event_type,
      data: body.data,
      timestamp: Date.now(),
      nonce: Math.random().toString(36).substring(2, 15),
    };

    const result = await this.webhookService.sendWebhook(body.subscription_id, event);
    await this.webhookService.recordWebhookLog(body.subscription_id, event, result);

    return result;
  }
}
