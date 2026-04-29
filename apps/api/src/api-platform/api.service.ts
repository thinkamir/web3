import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as crypto from 'crypto';

@Injectable()
export class ApiService {
  constructor(private prisma: PrismaService) {}

  async createApiKey(projectId: string, userId: string, permissions: string[]) {
    const keyId = `aq_${crypto.randomBytes(16).toString('hex')}`;
    const secret = crypto.randomBytes(32).toString('hex');
    const secretHash = crypto.createHash('sha256').update(secret).digest('hex');

    const apiKey = await this.prisma.apiKey.create({
      data: {
        project_id: projectId,
        user_id: userId,
        key_id: keyId,
        secret_hash: secretHash,
        permissions,
        status: 'active',
      },
    });

    return {
      key_id: apiKey.key_id,
      secret,
      permissions,
      rate_limit: apiKey.rate_limit,
    };
  }

  async validateApiKey(keyId: string, secret: string, timestamp: number, nonce: string, signature: string, method: string, path: string, bodyHash: string) {
    const apiKey = await this.prisma.apiKey.findUnique({
      where: { key_id: keyId },
    });

    if (!apiKey || apiKey.status !== 'active') {
      throw new UnauthorizedException('Invalid API key');
    }

    if (Date.now() - timestamp > 5 * 60 * 1000) {
      throw new UnauthorizedException('Request expired');
    }

    const nonceExists = await this.prisma.riskEvent.findFirst({
      where: {
        event_type: 'api_nonce',
        event_data: { nonce },
      },
    });

    if (nonceExists) {
      throw new UnauthorizedException('Nonce already used');
    }

    const payload = `${method}${path}${bodyHash}${timestamp}${nonce}`;
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');

    if (signature !== expectedSignature) {
      throw new UnauthorizedException('Invalid signature');
    }

    await this.prisma.apiKey.update({
      where: { id: apiKey.id },
      data: { last_used_at: new Date() },
    });

    await this.prisma.riskEvent.create({
      data: {
        event_type: 'api_nonce',
        event_data: { key_id: keyId, nonce },
      },
    });

    return apiKey;
  }

  async checkPermission(apiKey: any, requiredPermission: string): Promise<boolean> {
    const permissions = apiKey.permissions as string[];
    return permissions.includes(requiredPermission) || permissions.includes('*');
  }

  async revokeApiKey(keyId: string) {
    await this.prisma.apiKey.update({
      where: { key_id: keyId },
      data: { status: 'revoked' },
    });

    return { status: 'revoked' };
  }

  async createWebhookSubscription(projectId: string, url: string, events: string[], secret: string) {
    return this.prisma.webhookSubscription.create({
      data: {
        project_id: projectId,
        url,
        events,
        secret,
        status: 'active',
      },
    });
  }

  async getWebhookSubscriptions(projectId: string) {
    return this.prisma.webhookSubscription.findMany({
      where: { project_id: projectId },
    });
  }

  async deleteWebhookSubscription(subscriptionId: string) {
    await this.prisma.webhookSubscription.delete({
      where: { id: subscriptionId },
    });

    return { status: 'deleted' };
  }
}
