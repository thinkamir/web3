import { ApiController } from './api.controller';

describe('ApiController', () => {
  const apiService = {
    createApiKey: jest.fn(),
    listApiKeys: jest.fn(),
    revokeApiKey: jest.fn(),
    createWebhookSubscription: jest.fn(),
    getWebhookSubscriptions: jest.fn(),
    deleteWebhookSubscription: jest.fn(),
  };

  const controller = new ApiController(apiService as any);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('passes authenticated user.userId when creating an API key', async () => {
    await controller.createKey(
      { userId: 'user-123', wallet: '0xabc' },
      { project_id: 'project-456', permissions: ['events:write'] },
    );

    expect(apiService.createApiKey).toHaveBeenCalledWith(
      'project-456',
      'user-123',
      ['events:write'],
    );
  });

  it('passes authenticated user.userId when creating a webhook', async () => {
    await controller.createWebhook(
      { userId: 'admin-1', wallet: '0xdef' },
      {
        project_id: 'project-1',
        url: 'https://example.com/webhook',
        events: ['quest.completed'],
        secret: 'super-secret',
      },
    );

    expect(apiService.createWebhookSubscription).toHaveBeenCalledWith(
      'project-1',
      'admin-1',
      'https://example.com/webhook',
      ['quest.completed'],
      'super-secret',
    );
  });
});
