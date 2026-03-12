'use server';

import { z } from 'zod';
import { requireAuth } from '@/modules/auth/session';
import { disputeService } from '@/modules/dispute/dispute.service';
import type { ActionResult } from './auth.actions';

const openDisputeSchema = z.object({
  orderId:     z.string().cuid(),
  reason:      z.string().min(5).max(200),
  description: z.string().min(20).max(3000),
});

export async function openDisputeAction(
  prevState: ActionResult | null,
  formData:  FormData
): Promise<ActionResult> {
  const user = await requireAuth();

  const parsed = openDisputeSchema.safeParse({
    orderId:     formData.get('orderId'),
    reason:      formData.get('reason'),
    description: formData.get('description'),
  });
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0].message };
  }

  try {
    const dispute = await disputeService.openDispute({
      ...parsed.data,
      buyerId: user.id,
    });
    return { success: true, data: { disputeId: dispute.id } };
  } catch (err) {
    return { success: false, error: (err as Error).message };
  }
}
