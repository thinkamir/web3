import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ApiService } from './api.service';

@Injectable()
export class HmacGuard {
  constructor(private apiService: ApiService) {}

  async validate(
    headers: {
      'x-aq-key'?: string;
      'x-aq-timestamp'?: string;
      'x-aq-nonce'?: string;
      'x-aq-signature'?: string;
    },
    method: string,
    path: string,
    body: string,
  ) {
    const keyId = headers['x-aq-key'];
    const timestamp = parseInt(headers['x-aq-timestamp'] || '0', 10);
    const nonce = headers['x-aq-nonce'];
    const signature = headers['x-aq-signature'];

    if (!keyId || !timestamp || !nonce || !signature) {
      throw new UnauthorizedException('Missing authentication headers');
    }

    const bodyHash = body ? require('crypto').createHash('sha256').update(body).digest('hex') : '';

    const apiKey = await this.apiService.validateApiKey(
      keyId,
      '',
      timestamp,
      nonce,
      signature,
      method,
      path,
      bodyHash,
    );

    return apiKey;
  }
}
