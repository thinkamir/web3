import { NextResponse } from 'next/server';

interface WebhookEvent {
  id: string;
  project_id: string;
  type: string;
  payload: Record<string, any>;
  signature: string;
  timestamp: number;
  processed: boolean;
}

interface WebhookConfig {
  project_id: string;
  webhook_url: string;
  secret: string;
  events: string[];
  active: boolean;
  created_at: string;
}

const webhooks: Map<string, WebhookConfig> = new Map();
const webhookEvents: Map<string, WebhookEvent[]> = new Map();
const processedEvents: Set<string> = new Set();

const REPLAY_WINDOW_MS = 5 * 60 * 1000;

function generateHMAC(payload: string, secret: string): string {
  const crypto = require('crypto');
  return crypto.createHmac('sha256', secret).update(payload).digest('hex');
}

function verifySignature(payload: string, signature: string, secret: string): boolean {
  const expectedSignature = generateHMAC(payload, secret);
  return signature === expectedSignature;
}

function isReplayAttack(timestamp: number): boolean {
  const now = Date.now();
  return Math.abs(now - timestamp) > REPLAY_WINDOW_MS;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get('project_id');
  const eventId = searchParams.get('event_id');

  if (eventId) {
    const events = webhookEvents.get(projectId || '') || [];
    const event = events.find(e => e.id === eventId);
    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }
    return NextResponse.json({ event });
  }

  if (projectId) {
    const events = webhookEvents.get(projectId) || [];
    return NextResponse.json({
      events: events.filter(e => !e.processed),
      processed: events.filter(e => e.processed).length,
    });
  }

  return NextResponse.json({
    webhooks: Array.from(webhooks.values()),
    total_events: Array.from(webhookEvents.values()).flat().length,
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, project_id, webhook_url, secret, events } = body;

    if (action === 'register') {
      if (!project_id || !webhook_url || !secret) {
        return NextResponse.json(
          { error: 'Missing required fields: project_id, webhook_url, secret' },
          { status: 400 }
        );
      }

      const config: WebhookConfig = {
        project_id,
        webhook_url,
        secret,
        events: events || ['task_completed', 'draw_finalized', 'points_updated'],
        active: true,
        created_at: new Date().toISOString(),
      };

      webhooks.set(project_id, config);
      webhookEvents.set(project_id, []);

      return NextResponse.json({
        success: true,
        webhook: config,
        message: 'Webhook registered successfully',
      });
    }

    if (action === 'send') {
      const { project_id, event_type, payload } = body;

      if (!project_id || !event_type || !payload) {
        return NextResponse.json(
          { error: 'Missing required fields: project_id, event_type, payload' },
          { status: 400 }
        );
      }

      const config = webhooks.get(project_id);
      if (!config || !config.active) {
        return NextResponse.json(
          { error: 'Webhook not found or inactive' },
          { status: 404 }
        );
      }

      if (!config.events.includes(event_type) && !config.events.includes('*')) {
        return NextResponse.json(
          { error: 'Event type not subscribed' },
          { status: 400 }
        );
      }

      const timestamp = Date.now();
      const eventId = `evt_${timestamp}_${Math.random().toString(36).substr(2, 9)}`;
      const payloadStr = JSON.stringify({ ...payload, event_type, timestamp });
      const signature = generateHMAC(payloadStr, config.secret);

      const event: WebhookEvent = {
        id: eventId,
        project_id,
        type: event_type,
        payload,
        signature,
        timestamp,
        processed: false,
      };

      const events = webhookEvents.get(project_id) || [];
      events.push(event);
      webhookEvents.set(project_id, events);

      return NextResponse.json({
        success: true,
        event_id: eventId,
        signature,
        message: 'Event queued for delivery',
      });
    }

    return NextResponse.json(
      { error: 'Invalid action. Use "register" or "send"' },
      { status: 400 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to process webhook request' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { project_id, active, events } = body;

    if (!project_id) {
      return NextResponse.json(
        { error: 'project_id is required' },
        { status: 400 }
      );
    }

    const config = webhooks.get(project_id);
    if (!config) {
      return NextResponse.json(
        { error: 'Webhook not found' },
        { status: 404 }
      );
    }

    if (typeof active === 'boolean') {
      config.active = active;
    }
    if (events) {
      config.events = events;
    }

    return NextResponse.json({
      success: true,
      webhook: config,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update webhook' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get('project_id');

  if (!projectId) {
    return NextResponse.json(
      { error: 'project_id is required' },
      { status: 400 }
    );
  }

  const deleted = webhooks.delete(projectId);
  webhookEvents.delete(projectId);

  return NextResponse.json({
    success: deleted,
    message: deleted ? 'Webhook deleted' : 'Webhook not found',
  });
}

export async function verifyWebhookSignature(
  payload: string,
  signature: string,
  timestamp: number,
  secret: string
): Promise<{ valid: boolean; error?: string }> {
  if (isReplayAttack(timestamp)) {
    return { valid: false, error: 'Replay attack detected: timestamp outside valid window' };
  }

  if (!verifySignature(payload, signature, secret)) {
    return { valid: false, error: 'Invalid signature' };
  }

  return { valid: true };
}
