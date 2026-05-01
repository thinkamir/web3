import { ForbiddenException } from '@nestjs/common';
import * as crypto from 'crypto';
import { ApiService } from './api.service';

describe('ApiService', () => {
  const prisma: any = {
    apiKey: {
      create: jest.fn(async ({ data }) => ({ ...data, rate_limit: 1000 })),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(async ({ data }) => data),
    },
    webhookSubscription: {
      create: jest.fn(async ({ data }) => ({ id: 'webhook-1', ...data })),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      delete: jest.fn(async () => ({})),
    },
    riskEvent: {
      findFirst: jest.fn(),
      create: jest.fn(),
    },
  };

  const projectService = {
    assertProjectMember: jest.fn(),
  };

  const service = new ApiService(prisma, projectService as any);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('creates API keys for owner/admin members', async () => {
    await service.createApiKey('project-1', 'owner-1', ['events:write']);

    expect(projectService.assertProjectMember).toHaveBeenCalledWith(
      'project-1',
      'owner-1',
      ['owner', 'admin'],
    );
    expect(prisma.apiKey.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        project_id: 'project-1',
        user_id: 'owner-1',
        permissions: ['events:write'],
        status: 'active',
      }),
    });
  });

  it('rejects API key creation for non-members', async () => {
    projectService.assertProjectMember.mockRejectedValueOnce(new ForbiddenException('Project permission required'));

    await expect(service.createApiKey('project-1', 'user-2', ['events:write'])).rejects.toBeInstanceOf(ForbiddenException);
    expect(prisma.apiKey.create).not.toHaveBeenCalled();
  });

  it('creates webhook subscriptions for owner/admin members', async () => {
    await service.createWebhookSubscription(
      'project-1',
      'admin-1',
      'https://example.com/hook',
      ['quest.completed'],
      'secret',
    );

    expect(projectService.assertProjectMember).toHaveBeenCalledWith(
      'project-1',
      'admin-1',
      ['owner', 'admin'],
    );
    expect(prisma.webhookSubscription.create).toHaveBeenCalledWith({
      data: {
        project_id: 'project-1',
        url: 'https://example.com/hook',
        events: ['quest.completed'],
        secret: 'secret',
        status: 'active',
      },
    });
  });

  it('rejects webhook creation for non-members', async () => {
    projectService.assertProjectMember.mockRejectedValueOnce(new ForbiddenException('Project permission required'));

    await expect(
      service.createWebhookSubscription(
        'project-1',
        'user-2',
        'https://example.com/hook',
        ['quest.completed'],
        'secret',
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(prisma.webhookSubscription.create).not.toHaveBeenCalled();
  });

  it('validates API key requests with matching secret hash and signature', async () => {
    const secret = 'top-secret';
    const timestamp = Date.now();
    const nonce = 'nonce-1';
    const method = 'POST';
    const path = '/api/events';
    const bodyHash = 'body-hash';
    const signature = crypto
      .createHmac('sha256', secret)
      .update(`${method}${path}${bodyHash}${timestamp}${nonce}`)
      .digest('hex');

    prisma.apiKey.findUnique.mockResolvedValueOnce({
      id: 'api-key-1',
      key_id: 'aq_key_1',
      secret_hash: crypto.createHash('sha256').update(secret).digest('hex'),
      status: 'active',
      permissions: ['events:write'],
    });
    prisma.riskEvent.findFirst.mockResolvedValueOnce(null);

    await expect(
      service.validateApiKey('aq_key_1', secret, timestamp, nonce, signature, method, path, bodyHash),
    ).resolves.toEqual(
      expect.objectContaining({
        id: 'api-key-1',
        key_id: 'aq_key_1',
      }),
    );

    expect(prisma.apiKey.update).toHaveBeenCalledWith({
      where: { id: 'api-key-1' },
      data: { last_used_at: expect.any(Date) },
    });
    expect(prisma.riskEvent.create).toHaveBeenCalledWith({
      data: {
        event_type: 'api_nonce',
        event_data: { key_id: 'aq_key_1', nonce },
      },
    });
  });

  it('rejects API key requests when the provided secret does not match the stored secret hash', async () => {
    prisma.apiKey.findUnique.mockResolvedValueOnce({
      id: 'api-key-1',
      key_id: 'aq_key_1',
      secret_hash: crypto.createHash('sha256').update('expected-secret').digest('hex'),
      status: 'active',
      permissions: ['events:write'],
    });

    await expect(
      service.validateApiKey('aq_key_1', 'wrong-secret', Date.now(), 'nonce-2', 'signature', 'GET', '/api/events', ''),
    ).rejects.toThrow('Invalid API secret');
  });

  it('rejects API key requests with far-future timestamps', async () => {
    prisma.apiKey.findUnique.mockResolvedValueOnce({
      id: 'api-key-1',
      key_id: 'aq_key_1',
      secret_hash: crypto.createHash('sha256').update('secret').digest('hex'),
      status: 'active',
      permissions: ['events:write'],
    });

    await expect(
      service.validateApiKey(
        'aq_key_1',
        'secret',
        Date.now() + 10 * 60 * 1000,
        'nonce-3',
        'signature',
        'GET',
        '/api/events',
        '',
      ),
    ).rejects.toThrow('Request expired');
  });

  it('lists webhook subscriptions without selecting or returning secret values', async () => {
    prisma.webhookSubscription.findMany.mockResolvedValueOnce([
      {
        id: 'webhook-1',
        project_id: 'project-1',
        url: 'https://example.com/hook',
        events: ['quest.completed'],
        status: 'active',
        created_at: new Date('2024-01-01T00:00:00.000Z'),
      },
    ]);

    const result = await service.getWebhookSubscriptions('project-1', 'admin-1');

    expect(prisma.webhookSubscription.findMany).toHaveBeenCalledWith({
      where: { project_id: 'project-1' },
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
    expect(result[0]).not.toHaveProperty('secret');
  });
});
