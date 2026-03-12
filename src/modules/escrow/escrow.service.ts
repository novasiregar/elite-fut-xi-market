import prisma from '@/lib/prisma';
import type { Prisma, OrderStatus } from '@prisma/client';
import { ledgerService } from '@/modules/ledger/ledger.service';
import { auditService } from '@/modules/admin/audit.service';
import { notificationService } from '@/modules/notification/notification.service';
import { getAutoConfirmDeadline, calculatePlatformFee } from '@/lib/utils';

/**
 * Escrow Service.
 *
 * The escrow system is a TRANSACTION STATE MACHINE.
 * It does NOT hold real funds — only records state transitions
 * and triggers ledger accounting entries.
 *
 * Flow:
 * CREATED → WAITING_PAYMENT → PAID → ESCROW_HOLD
 *        → DELIVERED → COMPLETED (or DISPUTED)
 */
export class EscrowService {
  /**
   * Transition order to ESCROW_HOLD.
   * Called by webhook handler after payment confirmed.
   */
  async transitionToEscrowHold(
    orderId: string,
    tx: Prisma.TransactionClient
  ): Promise<void> {
    await tx.order.update({
      where: { id: orderId },
      data: {
        status: 'ESCROW_HOLD',
        statusHistory: {
          push: {
            status: 'ESCROW_HOLD',
            at: new Date().toISOString(),
            by: 'system',
            note: 'Payment confirmed — funds in escrow accounting hold',
          },
        } as unknown as Prisma.JsonNullValueInput,
      },
    });
  }

  /**
   * Seller marks order as delivered.
   * Reveals account details to buyer.
   */
  async markDelivered(
    params: {
      orderId:      string;
      sellerId:     string;
      deliveryNote: string;
    }
  ): Promise<void> {
    const order = await prisma.order.findUnique({
      where:   { id: params.orderId },
      include: {
        listing: { select: { title: true, accountEmail: true, accountPassword: true, accountDetails: true } },
        buyer:   { select: { id: true } },
      },
    });

    if (!order) throw new Error('Order not found');
    if (order.sellerId !== params.sellerId) throw new Error('Unauthorized');
    if (order.status !== 'ESCROW_HOLD') {
      throw new Error(`Cannot deliver: order status is ${order.status}`);
    }

    const autoConfirmAt = getAutoConfirmDeadline(new Date());

    await prisma.order.update({
      where: { id: params.orderId },
      data: {
        status:       'DELIVERED',
        deliveredAt:  new Date(),
        deliveryNote: params.deliveryNote,
        autoConfirmAt,
      },
    });

    await notificationService.notify({
      userId:  order.buyerId,
      type:    'ORDER_DELIVERED',
      title:   'Account Delivered — Confirm or Dispute',
      message: `The seller has delivered the account for your order. Please verify and confirm within 72 hours.`,
      data:    { orderId: params.orderId },
    });

    await auditService.log({
      action:      'ORDER_STATUS_CHANGED',
      targetId:    params.orderId,
      targetType:  'ORDER',
      createdById: params.sellerId,
      description: `Order ${order.orderNumber} marked as DELIVERED`,
    });
  }

  /**
   * Buyer confirms delivery — releases escrow.
   * This is the happy path final step.
   */
  async confirmDelivery(
    params: {
      orderId: string;
      buyerId: string;
    }
  ): Promise<void> {
    const order = await prisma.order.findUnique({
      where: { id: params.orderId },
    });

    if (!order) throw new Error('Order not found');
    if (order.buyerId !== params.buyerId) throw new Error('Unauthorized');
    if (order.status !== 'DELIVERED') {
      throw new Error(`Cannot confirm: order status is ${order.status}`);
    }

    const { fee, sellerReceives } = calculatePlatformFee(order.price);

    await prisma.$transaction(async (tx) => {
      // Update order to COMPLETED
      await tx.order.update({
        where: { id: params.orderId },
        data: {
          status:      'COMPLETED',
          confirmedAt: new Date(),
        },
      });

      // Mark listing as SOLD
      await tx.listing.update({
        where: { id: order.listingId },
        data:  { status: 'SOLD' },
      });

      // Release escrow in ledger
      await ledgerService.recordEscrowRelease(
        {
          sellerId:     order.sellerId,
          orderId:      order.id,
          sellerAmount: sellerReceives,
          platformFee:  fee,
          adminId:      'system:auto-confirm',
        },
        tx
      );
    });

    await Promise.allSettled([
      notificationService.notify({
        userId:  order.sellerId,
        type:    'ORDER_COMPLETED',
        title:   'Order Completed — Funds Available',
        message: `Your earnings for order ${order.orderNumber} are now available for withdrawal.`,
        data:    { orderId: params.orderId },
      }),
      notificationService.notify({
        userId:  order.buyerId,
        type:    'ORDER_COMPLETED',
        title:   'Order Completed',
        message: `Order ${order.orderNumber} has been completed. Thank you!`,
        data:    { orderId: params.orderId },
      }),
    ]);

    await auditService.log({
      action:      'ESCROW_RELEASED',
      targetId:    params.orderId,
      targetType:  'ORDER',
      createdById: params.buyerId,
      description: `Escrow released for order ${order.orderNumber}`,
      metadata:    {
        sellerReceives: sellerReceives.toString(),
        platformFee:    fee.toString(),
      },
    });
  }

  /**
   * Auto-confirm delivery after 72 hours (called by BullMQ job).
   */
  async autoConfirmDelivery(orderId: string): Promise<void> {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order || order.status !== 'DELIVERED') return;
    if (!order.autoConfirmAt || new Date() < order.autoConfirmAt) return;

    await this.confirmDelivery({
      orderId,
      buyerId: order.buyerId,
    });
  }
}

export const escrowService = new EscrowService();
