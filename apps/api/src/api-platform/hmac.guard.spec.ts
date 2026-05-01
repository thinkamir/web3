import { UnauthorizedException } from '@nestjs/common';
import { HmacGuard } from './hmac.guard';

describe('HmacGuard', () => {
  const apiService = {
    validateApiKey: jest.fn(),
  };

  const guard = new HmacGuard(apiService as any);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('passes the provided secret header into API key validation', async () => {
    apiService.validateApiKey.mockResolvedValueOnce({ id: 'api-key-1' });

    await guard.validate(
      {
        'x-aq-key': 'aq_key_1',
        'x-aq-secret': 'super-secret',
        'x-aq-timestamp': '1710000000000',
        'x-aq-nonce': 'nonce-1',
        'x-aq-signature': 'signature-1',
      },
      'POST',
      '/api/events',
      '{"ok":true}',
    );

    expect(apiService.validateApiKey).toHaveBeenCalledWith(
      'aq_key_1',
      'super-secret',
      1710000000000,
      'nonce-1',
      'signature-1',
      'POST',
      '/api/events',
      '4062edaf750fb8074e7e83e0c9028c94e32468a8b6f1614774328ef045150f93',
    );
  });

  it('rejects requests missing the secret header', async () => {
    await expect(
      guard.validate(
        {
          'x-aq-key': 'aq_key_1',
          'x-aq-timestamp': '1710000000000',
          'x-aq-nonce': 'nonce-1',
          'x-aq-signature': 'signature-1',
        },
        'POST',
        '/api/events',
        '{"ok":true}',
      ),
    ).rejects.toBeInstanceOf(UnauthorizedException);

    expect(apiService.validateApiKey).not.toHaveBeenCalled();
  });
});
