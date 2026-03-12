import prisma from '@/lib/prisma';
import type { LedgerEntry, Prisma } from '@prisma/client';
import type { CreateLedgerEntryInput } from './types';

/**
 * Ledger Repository.
 * Ledger entries are IMMUTABLE — no update or delete operations.
 */
export class LedgerRepository {
  /**
   * Create a new ledger entry.
   * MUST be called inside a prisma.$transaction() for financial operations.
   */
  async create(
    data:   CreateLedgerEntryInput,
    tx?:    Prisma.TransactionClient
  ): Promise<LedgerEntry> {
    const client = tx ?? prisma;
    return client.ledgerEntry.create({
      data: {
        userId:        data.userId,
        amount:        data.amount,
        currency:      'IDR',
        type:          data.type,
        referenceId:   data.referenceId,
        referenceType: data.referenceType,
        description:   data.description,
        metadata:      data.metadata ?? {},
        createdBy:     data.createdBy ?? 'system',
      },
    });
  }

  /**
   * Get all ledger entries for a user.
   */
  async findByUser(
    userId:   string,
    options?: {
      page?:    number;
      limit?:   number;
      type?:    string;
    }
  ): Promise<{ entries: LedgerEntry[]; total: number }> {
    const page  = options?.page  ?? 1;
    const limit = options?.limit ?? 20;
    const skip  = (page - 1) * limit;

    const where: Prisma.LedgerEntryWhereInput = {
      userId,
      ...(options?.type ? { type: options.type as LedgerEntry['type'] } : {}),
    };

    const [entries, total] = await prisma.$transaction([
      prisma.ledgerEntry.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.ledgerEntry.count({ where }),
    ]);

    return { entries, total };
  }

  /**
   * Get entries by reference (e.g., all entries for an order).
   */
  async findByReference(
    referenceId:   string,
    referenceType?: string
  ): Promise<LedgerEntry[]> {
    return prisma.ledgerEntry.findMany({
      where: {
        referenceId,
        ...(referenceType ? { referenceType } : {}),
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  /**
   * Check if a ledger entry already exists for an idempotency key.
   * Used to prevent duplicate webhook processing.
   */
  async existsByReference(
    referenceId: string,
    type:        LedgerEntry['type']
  ): Promise<boolean> {
    const count = await prisma.ledgerEntry.count({
      where: { referenceId, type },
    });
    return count > 0;
  }
}

export const ledgerRepository = new LedgerRepository();
