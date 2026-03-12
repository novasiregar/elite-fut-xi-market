import prisma from '@/lib/prisma';
import { ledgerService } from '@/modules/ledger/ledger.service';
import { escrowService } from '@/modules/escrow/escrow.service';
import { notificationService } from '@/modules/notification/notification.service';
import type { XenditWebhookPayload } from './types';

/**
 * Webhook Handler.
 *
 * CRITICAL: All financial operations run inside prisma.$transaction().
 * Idempotency is enforced — duplicate webhooks are safe.
 */
export class WebhookHandler {
  /**
   * Process Xendit invoice paid webhook.
   */
  async handleInvoicePaid(
    payload: XenditWebhookPayload
  ): Promise<{ success: boolean; message: string }> {
    const orderId = payload.external_id;

    // Find order + payment in a single query
    const order = await prisma.order.findUnique({
      where:  { id: orderId },
      include: {
        payment: true,
        buyer:   { select: { id: true, email: true } },
        seller:  { select: { id: true } },
        listing: { select: { title: true } },
      },
    });

    if (!order) {
      console.error(`[Webhook] Order not found: ${orderId}`);
      return { success: false, message: 'Order not found' };
    }

    // Idempotency: already processed
    if (order.status === 'ESCROW_HOLD' || order.status === 'COMPLETED') {
      return { success: true, message: 'Already processed (idempotent)' };
    }

    if (order.status !== 'WAITING_PAYMENT') {
      return { success: false, message: `Invalid order status: ${order.status}` };
    }

    // Process inside transaction
    await prisma.$transaction(async (tx) => {
      // 1. Update payment record
      await tx.payment.update({
        where: { orderId },
        data: {
          status:          'PAID',
          xenditPaymentId: payload.id,
          method:          this.mapPaymentMethod(payload.payment_method),
          paidAt:          payload.paid_at ? new Date(payload.paid_at) : new Date(),
          webhookPayload:  payload as unknown as Record<string, unknown>,
        },
      });

      // 2. Record PAYMENT_RECEIVED ledger entry (buyer debit)
      await ledgerService.recordPaymentReceived(
        {
          buyerId:   order.buyerId,
          orderId:   order.id,
          amount:    order.price,
          createdBy: 'system:webhook',
        },
        tx
      );

      // 3. Record ESCROW_HOLD ledger entry (seller pending credit)
      await ledgerService.recordEscrowHold(
        {
          sellerId: order.sellerId,
          orderId:  order.id,
          amount:   order.sellerReceives,
        },
        tx
      );

      // 4. Update order status to ESCROW_HOLD
      await escrowService.transitionToEscrowHold(order.id, tx);
    });

    // 5. Send notifications (outside transaction)
    await Promise.allSettled([
      notificationService.notify({
        userId:  order.buyerId,
        type:    'ORDER_PAID',
        title:   'Payment Confirmed',
        message: `Your payment for "${order.listing.title}" has been confirmed. Waiting for seller to deliver.`,
        data:    { orderId: order.id },
      }),
      notificationService.notify({
        userId:  order.sellerId,
        type:    'ORDER_PAID',
        title:   'New Order — Deliver Now',
        message: `You have a new paid order for "${order.listing.title}". Please deliver the account details.`,
        data:    { orderId: order.id },
      }),
    ]);

    return { success: true, message: 'Webhook processed successfully' };
  }

  private mapPaymentMethod(
    method: string
  ): 'QRIS' | 'VIRTUAL_ACCOUNT' | 'EWALLET' | 'BANK_TRANSFER' {
    const m = method.toUpperCase();
    if (m === 'QRIS')                                       return 'QRIS';
    if (['OVO', 'DANA', 'LINKAJA', 'SHOPEEPAY'].includes(m)) return 'EWALLET';
    if (['BNI', 'BRI', 'MANDIRI', 'PERMATA', 'BCA'].includes(m)) return 'VIRTUAL_ACCOUNT';
    return 'BANK_TRANSFER';
  }
}

export const webhookHandler = new WebhookHandler();
