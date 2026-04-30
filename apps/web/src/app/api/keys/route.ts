import { NextResponse } from 'next/server';

interface APIKey {
  id: string;
  project_id: string;
  name: string;
  key_prefix: string;
  key_hash: string;
  permissions: string[];
  rate_limit: number;
  active: boolean;
  last_used: string | null;
  created_at: string;
  expires_at: string | null;
}

interface APIKeyCreate {
  name: string;
  permissions: string[];
  rate_limit?: number;
  expires_in_days?: number;
}

const apiKeys: Map<string, APIKey> = new Map();
const projectKeys: Map<string, string[]> = new Map();

function generateKeyId(): string {
  return `key_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function generateAPIKey(): { key: string; key_prefix: string; key_hash: string } {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let key = 'aq_';
  for (let i = 0; i < 48; i++) {
    key += chars[Math.floor(Math.random() * chars.length)];
  }
  const key_prefix = key.slice(0, 12);
  const key_hash = require('crypto').createHash('sha256').update(key).digest('hex');
  return { key, key_prefix, key_hash };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get('project_id');
  const keyId = searchParams.get('key_id');

  if (keyId) {
    const key = apiKeys.get(keyId);
    if (!key) {
      return NextResponse.json({ error: 'API key not found' }, { status: 404 });
    }
    return NextResponse.json({ api_key: key });
  }

  if (!projectId) {
    return NextResponse.json(
      { error: 'project_id is required' },
      { status: 400 }
    );
  }

  const keyIds = projectKeys.get(projectId) || [];
  const keys = keyIds.map(id => apiKeys.get(id)).filter(Boolean) as APIKey[];

  return NextResponse.json({
    api_keys: keys.map(k => ({
      ...k,
      key: undefined,
      key_hash: undefined,
    })),
    total: keys.length,
  });
}

export async function POST(request: Request) {
  try {
    const body: APIKeyCreate & { project_id: string } = await request.json();
    const { project_id, name, permissions, rate_limit, expires_in_days } = body;

    if (!project_id || !name || !permissions) {
      return NextResponse.json(
        { error: 'Missing required fields: project_id, name, permissions' },
        { status: 400 }
      );
    }

    const validPermissions = [
      'tasks:read',
      'tasks:write',
      'campaigns:read',
      'campaigns:write',
      'draws:read',
      'draws:write',
      'analytics:read',
      'points:read',
      'webhooks:write',
    ];

    const invalidPerms = permissions.filter(p => !validPermissions.includes(p));
    if (invalidPerms.length > 0) {
      return NextResponse.json(
        { error: `Invalid permissions: ${invalidPerms.join(', ')}` },
        { status: 400 }
      );
    }

    const keyId = generateKeyId();
    const { key, key_prefix, key_hash } = generateAPIKey();

    const apiKey: APIKey = {
      id: keyId,
      project_id,
      name,
      key_prefix,
      key_hash,
      permissions,
      rate_limit: rate_limit || 1000,
      active: true,
      last_used: null,
      created_at: new Date().toISOString(),
      expires_at: expires_in_days
        ? new Date(Date.now() + expires_in_days * 24 * 60 * 60 * 1000).toISOString()
        : null,
    };

    apiKeys.set(keyId, apiKey);

    const keys = projectKeys.get(project_id) || [];
    keys.push(keyId);
    projectKeys.set(project_id, keys);

    return NextResponse.json({
      success: true,
      api_key: {
        id: keyId,
        name,
        key,
        key_prefix,
        permissions,
        rate_limit: apiKey.rate_limit,
        created_at: apiKey.created_at,
        expires_at: apiKey.expires_at,
      },
      message: 'Store this key securely. It will not be shown again.',
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create API key' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const keyId = searchParams.get('key_id');

  if (!keyId) {
    return NextResponse.json(
      { error: 'key_id is required' },
      { status: 400 }
    );
  }

  const key = apiKeys.get(keyId);
  if (!key) {
    return NextResponse.json(
      { error: 'API key not found' },
      { status: 404 }
    );
  }

  const keys = projectKeys.get(key.project_id) || [];
  const updatedKeys = keys.filter(id => id !== keyId);
  projectKeys.set(key.project_id, updatedKeys);

  apiKeys.delete(keyId);

  return NextResponse.json({
    success: true,
    message: 'API key deleted',
  });
}

export async function verifyAPIKey(
  apiKey: string
): Promise<{ valid: boolean; key?: APIKey; error?: string }> {
  if (!apiKey.startsWith('aq_')) {
    return { valid: false, error: 'Invalid API key format' };
  }

  const keyHash = require('crypto').createHash('sha256').update(apiKey).digest('hex');

  for (const key of Array.from(apiKeys.values())) {
    if (key.key_hash === keyHash && key.active) {
      if (key.expires_at && new Date(key.expires_at) < new Date()) {
        return { valid: false, error: 'API key expired' };
      }

      key.last_used = new Date().toISOString();

      return { valid: true, key };
    }
  }

  return { valid: false, error: 'API key not found or inactive' };
}
