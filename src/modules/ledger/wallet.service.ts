import prisma from '@/lib/prisma';
import { cache, redis } from '@/lib/redis';
import { CACHE_KEYS, CACHE_TTL } from '@/lib/constants';
import type { Prisma } from '@prisma/client';
import type { WalletBalance } from './types';

/**
 * Wallet Service.
 *
 * Wallet balances are DERIVED from ledger entries.
 * This service recalculates and caches wallet state.
 *
 * The wallet table is a denormalized cache of the ledger sum.
 * Source of truth = ledger_entries table.
 */
export class WalletService {
  /**
   * Recalculate wallet balance from ledger entries.
   * MUST be called inside a prisma.$transaction().
   */
  async recalculate(
    userId: string,
    tx: Prisma.TransactionClient
  ): Promise<void> {
    const entries = await tx.ledgerEntry.findMany({
      where: { userId },
      select: { amount: true, type: true },
    });

    let balanceAvailable = BigInt(0);
    let balancePending   = BigInt(0);
    let balanceWithdrawn = BigInt(0);
    let balanceRefunded  = BigInt(0);
    let totalEarned      = BigInt(0);

    for (const entry of entries) {
      switch (entry.type) {
        case 'ESCROW_HOLD':
          // Pending credit for seller
          balancePending += entry.amount > 0 ? entry.amount : BigInt(0);
          break;

        case 'ESCROW_RELEASE':
          // When released, move from pending to available
          if (entry.amount > 0) {
            balanceAvailable += entry.amount;
            totalEarned      += entry.amount;
          } else {
            balancePending   += entry.amount; // subtract from pending
          }
          break;

        case 'PLATFORM_FEE':
          balanceAvailable += entry.amount; // negative
          break;

        case 'REFUND':
          balanceRefunded  += entry.amount > 0 ? entry.amount : BigInt(0);
          break;

        case 'WITHDRAW_REQUEST':
          balanceAvailable += entry.amount; // negative (debit)
          break;

        case 'WITHDRAW_COMPLETED':
          balanceWithdrawn += entry.amount < 0 ? -entry.amount : BigInt(0);
          break;

        case 'ADMIN_ADJUSTMENT':
          balanceAvailable += entry.amount;
          break;

        case 'DISPUTE_REFUND':
          if (entry.amount < 0) {
            balancePending   += entry.amount; // reduce pending
          }
          break;

        default:
          break;
      }
    }

    // Upsert wallet record
    await tx.wallet.upsert({
      where:  { userId },
      create: {
        userId,
        balanceAvailable: balanceAvailable < 0 ? BigInt(0) : balanceAvailable,
        balancePending:   balancePending   < 0 ? BigInt(0) : balancePending,
        balanceWithdrawn,
        balanceRefunded,
        totalEarned,
        lastRecalcAt: new Date(),
      },
      update: {
        balanceAvailable: balanceAvailable < 0 ? BigInt(0) : balanceAvailable,
        balancePending:   balancePending   < 0 ? BigInt(0) : balancePending,
        balanceWithdrawn,
        balanceRefunded,
        totalEarned,
        lastRecalcAt: new Date(),
      },
    });

    // Invalidate cache
    await cache.del(CACHE_KEYS.userWallet(userId));
  }

  /**
   * Get wallet balance (cached).
   */
  async getBalance(userId: string): Promise<WalletBalance | null> {
    const cached = await cache.get<WalletBalance>(
      CACHE_KEYS.userWallet(userId)
    );
    if (cached) return cached;

    const wallet = await prisma.wallet.findUnique({
      where: { userId },
    });

    if (!wallet) {
      // Create empty wallet
      const empty = await prisma.wallet.create({
        data: { userId },
      });
      return {
        userId,
        balanceAvailable: empty.balanceAvailable,
        balancePending:   empty.balancePending,
        balanceWithdrawn: empty.balanceWithdrawn,
        balanceRefunded:  empty.balanceRefunded,
        totalEarned:      empty.totalEarned,
        currency:         empty.currency,
      };
    }

    const result: WalletBalance = {
      userId,
      balanceAvailable: wallet.balanceAvailable,
      balancePending:   wallet.balancePending,
      balanceWithdrawn: wallet.balanceWithdrawn,
      balanceRefunded:  wallet.balanceRefunded,
      totalEarned:      wallet.totalEarned,
      currency:         wallet.currency,
    };

    await cache.set(CACHE_KEYS.userWallet(userId), result, CACHE_TTL.wallet);
    return result;
  }

  /**
   * Check if user has sufficient available balance.
   */
  async hasSufficientBalance(
    userId: string,
    amount: bigint
  ): Promise<boolean> {
    const wallet = await this.getBalance(userId);
    if (!wallet) return false;
    return wallet.balanceAvailable >= amount;
  }
}

export const walletService = new WalletService();
