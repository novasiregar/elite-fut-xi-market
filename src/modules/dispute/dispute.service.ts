import prisma from '@/lib/prisma';
import { ledgerService } from '@/modules/ledger/ledger.service';
import { notificationService } from '@/modules/notification/notification.service';
import { auditService } from '@/modules/admin/audit.service';
import type { DisputeStatus } from '@prisma/client';

export class DisputeService {
  /**
   * Buyer opens a dispute.
   */
  async openDispute(params: {
    orderId:     string;
    buyerId:     string;
    reason:      string;
    description: string;
  }) {
    const order = await prisma.order.findUnique({
      where:   { id: params.orderId },
      include: { seller: { select: { id: true } } },
    });

    if (!order) throw new Error('Order not found');
    if (order.buyerId !== params.buyerId) throw new Error('Unauthorized');
    if (!['ESCROW_HOLD', 'DELIVERED'].includes(order.status)) {
      throw new Error('Dispute can only be opened on active orders');
    }

    const existingDispute = await prisma.dispute.findUnique({
      where: { orderId: params.orderId },
    });
    if (existingDispute) throw new Error('Dispute already exists for this order');

    const dispute = await prisma.$transaction(async (tx) => {
      const d = await tx.dispute.create({
        data: {
          orderId:     params.orderId,
          buyerId:     params.buyerId,
          sellerId:    order.sellerId,
          reason:      params.reason,
          description: params.description,
          evidence:    [],
          status:      'OPEN',
        },
      });

      await tx.order.update({
        where: { id: params.orderId },
        data:  { status: 'DISPUTED' },
      });

      return d;
    });

    await Promise.allSettled([
      notificationService.notify({
        userId:  order.sellerId,
        type:    'DISPUTE_OPENED',
        title:   'Dispute Opened',
        message: `The buyer has opened a dispute for order ${order.orderNumber}. Please respond with evidence.`,
        data:    { orderId: params.orderId, disputeId: dispute.id },
      }),
      auditService.log({
        action:      'DISPUTE_OPENED',
        targetId:    dispute.id,
        targetType:  'ORDER',
        createdById: params.buyerId,
        description: `Dispute opened for order ${order.orderNumber}: ${params.reason}`,
      }),
    ]);

    return dispute;
  }

  /**
   * Add evidence to a dispute (buyer or seller).
   */
  async addEvidence(params: {
    disputeId:  string;
    userId:     string;
    evidenceUrl: string;
    description: string;
  }) {
    const dispute = await prisma.dispute.findUnique({
      where: { id: params.disputeId },
    });

    if (!dispute) throw new Error('Dispute not found');
    if (dispute.buyerId !== params.userId && dispute.sellerId !== params.userId) {
      throw new Error('Unauthorized');
    }
    if (!['OPEN', 'UNDER_REVIEW'].includes(dispute.status)) {
      throw new Error('Cannot add evidence to a closed dispute');
    }

    const currentEvidence = (dispute.evidence as Array<Record<string, unknown>>) ?? [];
    const newEvidence = [
      ...currentEvidence,
      {
        url:          params.evidenceUrl,
        description:  params.description,
        uploadedBy:   params.userId,
        at:           new Date().toISOString(),
      },
    ];

    return prisma.dispute.update({
      where: { id: params.disputeId },
      data:  { evidence: newEvidence, status: 'UNDER_REVIEW' },
    });
  }

  /**
   * Admin resolves dispute.
   * Resolution: 'REFUND' or 'RELEASE'
   */
  async resolveDispute(params: {
    disputeId:  string;
    adminId:    string;
    resolution: 'REFUND' | 'RELEASE';
    adminNote:  string;
  }) {
    const dispute = await prisma.dispute.findUnique({
      where:   { id: params.disputeId },
      include: { order: true },
    });

    if (!dispute) throw new Error('Dispute not found');
    if (dispute.status === 'RESOLVED_REFUND' || dispute.status === 'RESOLVED_RELEASE') {
      throw new Error('Dispute already resolved');
    }

    const resolution: DisputeStatus =
      params.resolution === 'REFUND' ? 'RESOLVED_REFUND' : 'RESOLVED_RELEASE';
    const orderStatus = params.resolution === 'REFUND' ? 'REFUNDED' : 'RELEASED';

    await prisma.$transaction(async (tx) => {
      await tx.dispute.update({
        where: { id: params.disputeId },
        data: {
          status:     resolution,
          adminNote:  params.adminNote,
          resolvedBy: params.adminId,
          resolvedAt: new Date(),
          resolution: params.resolution,
        },
      });

      await tx.order.update({
        where: { id: dispute.orderId },
        data:  { status: orderStatus },
      });

      if (params.resolution === 'REFUND') {
        await ledgerService.recordRefund(
          {
            buyerId:   dispute.buyerId,
            sellerId:  dispute.sellerId,
            orderId:   dispute.orderId,
            amount:    dispute.order.price,
            adminId:   params.adminId,
          },
          tx
        );
      } else {
        // Release to seller
        const { fee, sellerReceives } = {
          fee: dispute.order.platformFee,
          sellerReceives: dispute.order.sellerReceives,
        };
        await ledgerService.recordEscrowRelease(
          {
            sellerId:     dispute.sellerId,
            orderId:      dispute.orderId,
            sellerAmount: sellerReceives,
            platformFee:  fee,
            adminId:      params.adminId,
          },
          tx
        );
      }
    });

    await Promise.allSettled([
      notificationService.notify({
        userId:  dispute.buyerId,
        type:    'DISPUTE_RESOLVED',
        title:   'Dispute Resolved',
        message: params.resolution === 'REFUND'
          ? 'Your dispute has been resolved in your favor. Refund is being processed.'
          : 'Your dispute has been resolved. Funds have been released to the seller.',
        data:    { disputeId: params.disputeId },
      }),
      notificationService.notify({
        userId:  dispute.sellerId,
        type:    'DISPUTE_RESOLVED',
        title:   'Dispute Resolved',
        message: params.resolution === 'RELEASE'
          ? 'The dispute was resolved in your favor. Funds are now available.'
          : 'The dispute was resolved in the buyer\'s favor. Funds have been refunded.',
        data:    { disputeId: params.disputeId },
      }),
      auditService.log({
        action:      'DISPUTE_RESOLVED',
        targetId:    params.disputeId,
        targetType:  'ORDER',
        createdById: params.adminId,
        description: `Dispute resolved: ${params.resolution} for order ${dispute.orderId}`,
        metadata:    { resolution: params.resolution, note: params.adminNote },
      }),
    ]);

    return dispute;
  }
}

export const disputeService = new DisputeService();
