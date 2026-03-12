import type { LedgerType } from '@prisma/client';

export interface CreateLedgerEntryInput {
  userId:        string;
  amount:        bigint;       // positive = credit, negative = debit
  type:          LedgerType;
  referenceId?:  string;
  referenceType?: string;
  description:   string;
  metadata?:     Record<string, unknown>;
  createdBy?:    string;
}

export interface WalletBalance {
  userId:           string;
  balanceAvailable: bigint;
  balancePending:   bigint;
  balanceWithdrawn: bigint;
  balanceRefunded:  bigint;
  totalEarned:      bigint;
  currency:         string;
}

export interface LedgerSummary {
  totalCredits: bigint;
  totalDebits:  bigint;
  netBalance:   bigint;
}
