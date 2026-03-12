import { Worker, type Job } from 'bullmq';
import { redisConnection } from './queue';
import prisma from '@/lib/prisma';
import { escrowService } from '@/modules/escrow/escrow.service';

interface ReconciliationJobData {
  type: 'AUTO_CONFIRM' | 'EXPIRE_PAYMENTS' | 'SYNC_WALLETS';
  orderId?: string;
}

const worker = new Worker<ReconciliationJobData>(
  'reconciliation',
  async (job: Job<ReconciliationJobData>) => {
    switch (job.data.type) {
      case 'AUTO_CONFIRM': {
        // Auto-confirm orders where autoConfirmAt has passed
        const overdueOrders = await prisma.order.findMany({
          where: {
            status:       'DELIVERED',
            autoConfirmAt: { lte: new Date() },
          },
          select: { id: true },
          take: 50,
        });

        for (const order of overdueOrders) {
          try {
            await escrowService.autoConfirmDelivery(order.id);
            console.log(`[Reconciliation] Auto-confirmed order: ${order.id}`);
          } catch (err) {
            console.error(`[Reconciliation] Auto-confirm failed for ${order.id}:`, err);
          }
        }
        break;
      }

      case 'EXPIRE_PAYMENTS': {
        // Mark expired Xendit invoices
        const expiredPayments = await prisma.payment.findMany({
          where: {
            status:    'PENDING',
            expiresAt: { lte: new Date() },
          },
          select: { id: true, orderId: true },
          take: 50,
        });

        for (const payment of expiredPayments) {
          await prisma.$transaction([
            prisma.payment.update({
              where: { id: payment.id },
              data:  { status: 'EXPIRED' },
            }),
            prisma.order.update({
              where: { id: payment.orderId },
              data:  { status: 'CANCELLED', cancelledAt: new Date(), cancelReason: 'Payment expired' },
            }),
          ]);
        }

        console.log(`[Reconciliation] Expired ${expiredPayments.length} payments`);
        break;
      }

      case 'SYNC_WALLETS': {
        console.log('[Reconciliation] Wallet sync job — implement as needed');
        break;
      }
    }
  },
  {
    connection: redisConnection,
    concurrency: 1,
  }
);

worker.on('failed', (job, err) => {
  console.error(`[ReconciliationWorker] Job ${job?.id} failed:`, err.message);
});

export default worker;
