import { NextRequest, NextResponse } from 'next/server';
import { verifyXenditWebhook } from '@/modules/payment/xendit.client';
import { webhookHandler } from '@/modules/payment/webhook.handler';
import { withRateLimit, rateLimits } from '@/lib/rate-limit';
import type { XenditWebhookPayload } from '@/modules/payment/types';

const handler = async (req: NextRequest): Promise<NextResponse> => {
  // Verify webhook authenticity
  const token = req.headers.get('x-callback-token') ?? '';
  if (!verifyXenditWebhook(token)) {
    console.warn('[Webhook] Invalid Xendit token');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let payload: XenditWebhookPayload;
  try {
    payload = (await req.json()) as XenditWebhookPayload;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  console.log(`[Webhook] Received: ${payload.status} for ${payload.external_id}`);

  if (payload.status === 'PAID') {
    const result = await webhookHandler.handleInvoicePaid(payload);
    if (!result.success) {
      console.error(`[Webhook] Processing failed: ${result.message}`);
      // Return 200 to prevent Xendit retries for known invalid states
      return NextResponse.json({ received: true, message: result.message });
    }
  }

  return NextResponse.json({ received: true });
};

export const POST = withRateLimit(rateLimits.webhook, handler);
