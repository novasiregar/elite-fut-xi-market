'use server';

import { requireAuth } from '@/modules/auth/session';
import { orderService } from '@/modules/order/order.service';
import { escrowService } from '@/modules/escrow/escrow.service';
import type { ActionResult } from './auth.actions';
import { z } from 'zod';

export async function createOrderAction(
  listingId: string
): Promise<ActionResult> {
  const user = await requireAuth();

  try {
    const result = await orderService.createOrder({
      buyerId:   user.id,
      listingId,
      buyerEmail: user.email!,
    });
    return { success: true, data: { orderId: result.order.id, invoiceUrl: result.invoiceUrl } };
  } catch (err) {
    return { success: false, error: (err as Error).message };
  }
}

const deliverSchema = z.object({
  orderId:      z.string().cuid(),
  deliveryNote: z.string().min(10).max(2000),
});

export async function markDeliveredAction(
  prevState: ActionResult | null,
  formData:  FormData
): Promise<ActionResult> {
  const seller = await requireAuth();

  const parsed = deliverSchema.safeParse({
    orderId:      formData.get('orderId'),
    deliveryNote: formData.get('deliveryNote'),
  });
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0].message };
  }

  try {
    await escrowService.markDelivered({
      orderId:      parsed.data.orderId,
      sellerId:     seller.id,
      deliveryNote: parsed.data.deliveryNote,
    });
    return { success: true };
  } catch (err) {
    return { success: false, error: (err as Error).message };
  }
}

export async function confirmDeliveryAction(
  orderId: string
): Promise<ActionResult> {
  const user = await requireAuth();

  try {
    await escrowService.confirmDelivery({ orderId, buyerId: user.id });
    return { success: true };
  } catch (err) {
    return { success: false, error: (err as Error).message };
  }
}
