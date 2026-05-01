import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ethers } from 'ethers';
import { AuthService } from './auth.service';

describe('AuthService nonce wallet login', () => {
  const wallet = ethers.Wallet.createRandom();
  const db: any = { users: new Map<string, any>(), nonces: new Map<string, any>() };

  const prisma: any = {
    user: {
      upsert: jest.fn(async ({ where, create }) => {
        const id = 'user-1';
        const existing = db.users.get(where.wallet);
        if (existing) return existing;
        const user = { id, status: 'active', username: null, avatar: null, user_level: 1, risk_score: 0, ...create };
        db.users.set(where.wallet, user);
        return user;
      }),
      findUnique: jest.fn(async ({ where }) => Array.from(db.users.values()).find((u: any) => u.id === where.id) || null),
      findUniqueOrThrow: jest.fn(async ({ where }) => {
        const user = Array.from(db.users.values()).find((u: any) => u.id === where.id);
        if (!user) throw new Error('not found');
        return user;
      }),
    },
    authNonce: {
      create: jest.fn(async ({ data }) => {
        const record = { id: `nonce-${db.nonces.size + 1}`, consumed_at: null, user: db.users.get(data.wallet), ...data };
        db.nonces.set(data.nonce, record);
        return record;
      }),
      findUnique: jest.fn(async ({ where }) => db.nonces.get(where.nonce) || null),
      updateMany: jest.fn(async ({ where, data }) => {
        const record = Array.from(db.nonces.values()).find((n: any) => n.id === where.id && n.consumed_at === where.consumed_at && n.expires_at > where.expires_at.gt) as any;
        if (!record) return { count: 0 };
        record.consumed_at = data.consumed_at;
        return { count: 1 };
      }),
    },
    $transaction: jest.fn((fn) => fn(prisma)),
  };

  const config: any = { get: jest.fn((key: string) => ({ APP_DOMAIN: 'alphaquest.test', NODE_ENV: 'test' } as any)[key]) };
  const jwt = new JwtService({ secret: 'test-secret' });
  const service = new AuthService(prisma, jwt, config);

  beforeEach(() => {
    db.users.clear();
    db.nonces.clear();
    jest.clearAllMocks();
  });

  it('persists nonce, verifies signature, consumes nonce exactly once', async () => {
    const generated = await service.generateNonce(wallet.address);
    expect(generated.message).toContain(generated.nonce);
    expect(prisma.authNonce.create).toHaveBeenCalledTimes(1);

    const timestamp = Date.parse(generated.message.match(/Issued At: (.*)$/m)![1]);
    const signature = await wallet.signMessage(generated.message);
    const result = await service.walletLogin(wallet.address, signature, generated.nonce, timestamp);

    expect(result.accessToken).toBeTruthy();
    expect(result.refreshToken).toBeTruthy();
    expect(db.nonces.get(generated.nonce).consumed_at).toBeInstanceOf(Date);
    await expect(service.walletLogin(wallet.address, signature, generated.nonce, timestamp)).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('accepts an optional client-provided message when it matches the stored nonce message', async () => {
    const generated = await service.generateNonce(wallet.address);
    const timestamp = Date.parse(generated.message.match(/Issued At: (.*)$/m)![1]);
    const signature = await wallet.signMessage(generated.message);

    const result = await service.walletLogin(wallet.address, signature, generated.nonce, timestamp, generated.message);

    expect(result.accessToken).toBeTruthy();
    expect(result.refreshToken).toBeTruthy();
  });

  it('rejects a client-provided message when it does not match the stored nonce message', async () => {
    const generated = await service.generateNonce(wallet.address);
    const timestamp = Date.parse(generated.message.match(/Issued At: (.*)$/m)![1]);
    const signature = await wallet.signMessage(generated.message);
    const mismatchedMessage = `${generated.message}
Extra line`;

    await expect(
      service.walletLogin(wallet.address, signature, generated.nonce, timestamp, mismatchedMessage),
    ).rejects.toMatchObject({
      message: 'Invalid login message',
    });
  });

  it('returns a new access token for an active existing user on refresh', async () => {
    const user = {
      id: 'user-refresh',
      wallet: wallet.address.toLowerCase(),
      status: 'active',
      username: null,
      avatar: null,
      referral_code: 'REFRESH1',
      user_level: 1,
      risk_score: 0,
    };
    db.users.set(user.wallet, user);

    const refreshToken = jwt.sign({ sub: user.id, wallet: user.wallet }, { expiresIn: '7d' });
    const result = await service.refreshToken(refreshToken);

    expect(result.accessToken).toBeTruthy();
    expect(jwt.verify(result.accessToken)).toMatchObject({ sub: user.id, wallet: user.wallet });
    expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { id: user.id } });
  });

  it('rejects invalid refresh tokens', async () => {
    await expect(service.refreshToken('invalid-token')).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('rejects stale signature timestamps beyond the five-minute window', async () => {
    const staleTimestamp = Date.now() - 5 * 60 * 1000 - 1;
    const nonce = 'stale-nonce';
    const message = (service as any).buildLoginMessage(wallet.address.toLowerCase(), nonce, staleTimestamp, 'alphaquest.test');
    const signature = await wallet.signMessage(message);

    db.users.set(wallet.address.toLowerCase(), {
      id: 'user-stale',
      wallet: wallet.address.toLowerCase(),
      status: 'active',
      username: null,
      avatar: null,
      referral_code: 'STALE001',
      user_level: 1,
      risk_score: 0,
    });

    await prisma.authNonce.create({
      data: {
        user_id: 'user-stale',
        wallet: wallet.address.toLowerCase(),
        nonce,
        domain: 'alphaquest.test',
        message,
        expires_at: new Date(Date.now() + 60 * 1000),
      },
    });

    await expect(service.walletLogin(wallet.address, signature, nonce, staleTimestamp)).rejects.toMatchObject({
      message: 'Signature timestamp expired',
    });
  });
});
