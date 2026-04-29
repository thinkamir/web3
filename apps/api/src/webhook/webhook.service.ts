import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as crypto from 'crypto';

export interface WebhookEvent {
  type: string;
  data: any;
  timestamp: number;
  nonce: string;
}

@Injectable()
export class WebhookService {
  constructor(private prisma: PrismaService) {}

  async createSubscription(projectId: string, url: string, events: string[]) {
    const secret = crypto.randomBytes(32).toString('hex');

    return this.prisma.webhookSubscription.create({
      data: {
        project_id: projectId,
        url,
        events: JSON.stringify(events),
        secret,
        status: 'active',
      },
    });
  }

  async getSubscriptions(projectId: string) {
    const subscriptions = await this.prisma.webhookSubscription.findMany({
      where: { project_id: projectId },
    });

    return subscriptions.map(sub => ({
      ...sub,
      events: JSON.parse(sub.events as string),
      secret: undefined,
    }));
  }

  async deleteSubscription(subscriptionId: string) {
    await this.prisma.webhookSubscription.delete({
      where: { id: subscriptionId },
    });
    return { success: true };
  }

  async verifySignature(
    payload: string,
    signature: string,
    timestamp: number,
    nonce: string,
    secret: string,
  ): Promise<boolean> {
    if (Date.now() - timestamp > 5 * 60 * 1000) {
      return false;
    }

    const nonceExists = await this.prisma.riskEvent.findFirst({
      where: {
        event_type: 'webhook_nonce',
        event_data: { nonce },
      },
    });

    if (nonceExists) {
      return false;
    }

    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(`${payload}${timestamp}${nonce}`)
      .digest('hex');

    if (signature !== expectedSignature) {
      return false;
    }

    await this.prisma.riskEvent.create({
      data: {
        event_type: 'webhook_nonce',
        event_data: { nonce },
      },
    });

    return true;
  }

  async sendWebhook(subscriptionId: string, event: WebhookEvent) {
    const subscription = await this.prisma.webhookSubscription.findUnique({
      where: { id: subscriptionId },
    });

    if (!subscription || subscription.status !== 'active') {
      return { success: false, reason: 'Subscription not found or inactive' };
    }

    const events: string[] = JSON.parse(subscription.events as string);
    if (!events.includes(event.type)) {
      return { success: false, reason: 'Event type not subscribed' };
    }

    const payload = JSON.stringify(event);
    const timestamp = Date.now();
    const nonce = crypto.randomBytes(16).toString('hex');
    const signature = crypto
      .createHmac('sha256', subscription.secret)
      .update(`${payload}${timestamp}${nonce}`)
      .digest('hex');

    try {
      const response = await fetch(subscription.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-AQ-Signature': signature,
          'X-AQ-Timestamp': timestamp.toString(),
          'X-AQ-Nonce': nonce,
          'X-AQ-Event': event.type,
        },
        body: payload,
      });

      return {
        success: response.ok,
        status: response.status,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async recordWebhookLog(subscriptionId: string, event: WebhookEvent, result: any) {
    await this.prisma.riskEvent.create({
      data: {
        event_type: 'webhook_sent',
        event_data: {
          subscription_id: subscriptionId,
          event_type: event.type,
          result,
        },
      },
    });
  }
}
