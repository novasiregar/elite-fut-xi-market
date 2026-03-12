import type { Prisma } from '@prisma/client';
import { ledgerRepository } from './ledger.repository';
import { walletService } from './wallet.service';
import type { CreateLedgerEntryInput } from './types';

/**
 * Ledger Service.
 *
 * CRITICAL FINANCIAL RULES:
 * 1. All entries are immutable — no updates or deletes.
 * 2. All financial operations MUST run inside prisma.$transaction().
 * 3. Wallet balances are recalculated after each entry.
 * 4. Duplicate entries are prevented via idempotency checks.
 */
export class LedgerService {
  /**
   * Record a payment received event.
   * Called by webhook handler after Xendit confirms payment.
   */
  async recordPaymentReceived(
    params: {
      buyerId:   string;
      orderId:   string;
      amount:    bigint;
      createdBy: string;
    },
    tx: Prisma.TransactionClient
  ) {
    // Idempotency check
    const exists = await ledgerRepository.existsByReference(
      params.orderId,
      'PAYMENT_RECEIVED'
    );
    if (exists) return null;

    const entry = await ledgerRepository.create(
      {
        userId:        params.buyerId,
        amount:        -params.amount, // debit from buyer
        type:          'PAYMENT_RECEIVED',
        referenceId:   params.orderId,
        referenceType: 'ORDER',
        description:   `Payment received for order ${params.orderId}`,
        createdBy:     params.createdBy,
      },
      tx
    );

    await walletService.recalculate(params.buyerId, tx);
    return entry;
  }

  /**
   * Record escrow hold event.
   * Funds are "held" (accounting only) until delivery confirmed.
   */
  async recordEscrowHold(
    params: {
      sellerId: string;
      orderId:  string;
      amount:   bigint;
    },
    tx: Prisma.TransactionClient
  ) {
    const exists = await ledgerRepository.existsByReference(
      params.orderId,
      'ESCROW_HOLD'
    );
    if (exists) return null;

    const entry = await ledgerRepository.create(
      {
        userId:        params.sellerId,
        amount:        params.amount, // pending credit for seller
        type:          'ESCROW_HOLD',
        referenceId:   params.orderId,
        referenceType: 'ORDER',
        description:   `Escrow hold for order ${params.orderId} — pending buyer confirmation`,
        createdBy:     'system',
      },
      tx
    );

    await walletService.recalculate(params.sellerId, tx);
    return entry;
  }

  /**
   * Record escrow release.
   * Funds become available to seller after buyer confirms delivery.
   */
  async recordEscrowRelease(
    params: {
      sellerId:      string;
      orderId:       string;
      sellerAmount:  bigint;
      platformFee:   bigint;
      adminId:       string;
    },
    tx: Prisma.TransactionClient
  ) {
    const exists = await ledgerRepository.existsByReference(
      params.orderId,
      'ESCROW_RELEASE'
    );
    if (exists) return null;

    // Credit seller
    const releaseEntry = await ledgerRepository.create(
      {
        userId:        params.sellerId,
        amount:        params.sellerAmount,
        type:          'ESCROW_RELEASE',
        referenceId:   params.orderId,
        referenceType: 'ORDER',
        description:   `Escrow released for order ${params.orderId}`,
        metadata:      { platformFee: params.platformFee.toString() },
        createdBy:     params.adminId,
      },
      tx
    );

    // Debit escrow hold (reverse the pending entry)
    await ledgerRepository.create(
      {
        userId:        params.sellerId,
        amount:        -params.sellerAmount, // reverse escrow
        type:          'ESCROW_RELEASE',
        referenceId:   params.orderId,
        referenceType: 'ORDER',
        description:   `Escrow hold reversed for order ${params.orderId}`,
        createdBy:     params.adminId,
      },
      tx
    );

    // Record platform fee
    await ledgerRepository.create(
      {
        userId:        params.sellerId,
        amount:        -params.platformFee,
        type:          'PLATFORM_FEE',
        referenceId:   params.orderId,
        referenceType: 'ORDER',
        description:   `Platform fee (${process.env.PLATFORM_FEE_PERCENT ?? 5}%) for order ${params.orderId}`,
        createdBy:     'system',
      },
      tx
    );

    await walletService.recalculate(params.sellerId, tx);
    return releaseEntry;
  }

  /**
   * Record a refund (dispute resolved in buyer's favor).
   */
  async recordRefund(
    params: {
      buyerId:   string;
      sellerId:  string;
      orderId:   string;
      amount:    bigint;
      adminId:   string;
    },
    tx: Prisma.TransactionClient
  ) {
    // Refund credit for buyer (admin processes manual refund)
    await ledgerRepository.create(
      {
        userId:        params.buyerId,
        amount:        params.amount,
        type:          'REFUND',
        referenceId:   params.orderId,
        referenceType: 'ORDER',
        description:   `Refund approved for order ${params.orderId}`,
        createdBy:     params.adminId,
      },
      tx
    );

    // Reverse escrow hold for seller
    await ledgerRepository.create(
      {
        userId:        params.sellerId,
        amount:        -params.amount,
        type:          'DISPUTE_REFUND',
        referenceId:   params.orderId,
        referenceType: 'ORDER',
        description:   `Escrow reversed due to refund on order ${params.orderId}`,
        createdBy:     params.adminId,
      },
      tx
    );

    await walletService.recalculate(params.buyerId, tx);
    await walletService.recalculate(params.sellerId, tx);
  }

  /**
   * Record a withdrawal request.
   */
  async recordWithdrawRequest(
    params: {
      userId:     string;
      withdrawId: string;
      amount:     bigint;
    },
    tx: Prisma.TransactionClient
  ) {
    const entry = await ledgerRepository.create(
      {
        userId:        params.userId,
        amount:        -params.amount, // debit pending
        type:          'WITHDRAW_REQUEST',
        referenceId:   params.withdrawId,
        referenceType: 'WITHDRAW',
        description:   `Withdrawal request of ${params.amount} submitted`,
        createdBy:     params.userId,
      },
      tx
    );

    await walletService.recalculate(params.userId, tx);
    return entry;
  }

  /**
   * Record withdrawal completed (admin manually transferred funds).
   */
  async recordWithdrawCompleted(
    params: {
      userId:     string;
      withdrawId: string;
      amount:     bigint;
      adminId:    string;
    },
    tx: Prisma.TransactionClient
  ) {
    const entry = await ledgerRepository.create(
      {
        userId:        params.userId,
        amount:        -params.amount,
        type:          'WITHDRAW_COMPLETED',
        referenceId:   params.withdrawId,
        referenceType: 'WITHDRAW',
        description:   `Withdrawal of ${params.amount} completed by admin`,
        createdBy:     params.adminId,
      },
      tx
    );

    await walletService.recalculate(params.userId, tx);
    return entry;
  }

  /**
   * Admin adjustment (manual ledger correction).
   */
  async recordAdminAdjustment(
    params: {
      userId:      string;
      amount:      bigint;
      description: string;
      adminId:     string;
      referenceId?: string;
    },
    tx: Prisma.TransactionClient
  ) {
    const entry = await ledgerRepository.create(
      {
        userId:        params.userId,
        amount:        params.amount,
        type:          'ADMIN_ADJUSTMENT',
        referenceId:   params.referenceId,
        referenceType: 'MANUAL',
        description:   params.description,
        createdBy:     params.adminId,
      },
      tx
    );

    await walletService.recalculate(params.userId, tx);
    return entry;
  }
}

export const ledgerService = new LedgerService();
