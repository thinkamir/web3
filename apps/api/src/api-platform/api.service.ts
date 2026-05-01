import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as crypto from 'crypto';
import { ProjectService } from '../project/project.service';

@Injectable()
export class ApiService {
  constructor(
    private prisma: PrismaService,
    private projectService: ProjectService,
  ) {}

  private async assertProjectAdminAccess(projectId: string, userId: string) {
    await this.projectService.assertProjectMember(projectId, userId, ['owner', 'admin']);
  }

  async createApiKey(projectId: string, userId: string, permissions: string[]) {
    await this.assertProjectAdminAccess(projectId, userId);

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

    const maxTimestampSkewMs = 5 * 60 * 1000;
    const timestampSkewMs = Math.abs(Date.now() - timestamp);

    if (timestampSkewMs > maxTimestampSkewMs) {
      throw new UnauthorizedException('Request expired');
    }

    const secretHash = crypto.createHash('sha256').update(secret).digest('hex');

    if (secretHash !== apiKey.secret_hash) {
      throw new UnauthorizedException('Invalid API secret');
    }

    const nonceExists = await this.prisma.riskEvent.findFirst({
      where: {
        event_type: 'api_nonce',
        event_data: {
          path: ['nonce'],
          equals: nonce,
        },
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

  async listApiKeys(projectId: string, userId: string) {
    await this.assertProjectAdminAccess(projectId, userId);

    return this.prisma.apiKey.findMany({
      where: { project_id: projectId },
      select: {
        id: true,
        key_id: true,
        user_id: true,
        permissions: true,
        rate_limit: true,
        status: true,
        last_used_at: true,
        created_at: true,
      },
      orderBy: { created_at: 'desc' },
    });
  }

  async revokeApiKey(keyId: string, userId: string) {
    const apiKey = await this.prisma.apiKey.findUnique({
      where: { key_id: keyId },
      select: { id: true, project_id: true },
    });

    if (!apiKey) {
      throw new NotFoundException('API key not found');
    }

    await this.assertProjectAdminAccess(apiKey.project_id, userId);

    await this.prisma.apiKey.update({
      where: { id: apiKey.id },
      data: { status: 'revoked' },
    });

    return { status: 'revoked' };
  }

  async createWebhookSubscription(projectId: string, userId: string, url: string, events: string[], secret: string) {
    await this.assertProjectAdminAccess(projectId, userId);

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

  async getWebhookSubscriptions(projectId: string, userId: string) {
    await this.assertProjectAdminAccess(projectId, userId);

    return this.prisma.webhookSubscription.findMany({
      where: { project_id: projectId },
      select: {
        id: true,
        project_id: true,
        url: true,
        events: true,
        status: true,
        created_at: true,
      },
      orderBy: { created_at: 'desc' },
    });
  }

  async deleteWebhookSubscription(subscriptionId: string, userId: string) {
    const subscription = await this.prisma.webhookSubscription.findUnique({
      where: { id: subscriptionId },
      select: { id: true, project_id: true },
    });

    if (!subscription) {
      throw new NotFoundException('Webhook subscription not found');
    }

    await this.assertProjectAdminAccess(subscription.project_id, userId);

    await this.prisma.webhookSubscription.delete({
      where: { id: subscription.id },
    });

    return { status: 'deleted' };
  }
}
