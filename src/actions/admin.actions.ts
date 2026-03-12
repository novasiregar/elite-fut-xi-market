'use server';

import { z } from 'zod';
import { requireAdmin } from '@/modules/auth/session';
import { adminService } from '@/modules/admin/admin.service';
import { disputeService } from '@/modules/dispute/dispute.service';
import { withdrawalService } from '@/modules/withdrawal/withdrawal.service';
import { ledgerService } from '@/modules/ledger/ledger.service';
import prisma from '@/lib/prisma';
import type { ActionResult } from './auth.actions';

export async function reviewKycAction(
  prevState: ActionResult | null,
  formData:  FormData
): Promise<ActionResult> {
  const admin = await requireAdmin();

  const kycId  = formData.get('kycId')  as string;
  const status = formData.get('status') as 'APPROVED' | 'REJECTED' | 'RESUBMIT';
  const note   = formData.get('note')   as string;

  if (!kycId || !status) return { success: false, error: 'Missing required fields' };

  try {
    await adminService.reviewKyc({ kycId, adminId: admin.id, status, note });
    return { success: true };
  } catch (err) {
    return { success: false, error: (err as Error).message };
  }
}

export async function resolveDisputeAction(
  prevState: ActionResult | null,
  formData:  FormData
): Promise<ActionResult> {
  const admin = await requireAdmin();

  const disputeId  = formData.get('disputeId')  as string;
  const resolution = formData.get('resolution') as 'REFUND' | 'RELEASE';
  const adminNote  = formData.get('adminNote')  as string;

  if (!disputeId || !resolution) return { success: false, error: 'Missing required fields' };

  try {
    await disputeService.resolveDispute({ disputeId, adminId: admin.id, resolution, adminNote });
    return { success: true };
  } catch (err) {
    return { success: false, error: (err as Error).message };
  }
}

export async function approveWithdrawalAction(
  withdrawId: string
): Promise<ActionResult> {
  const admin = await requireAdmin();
  try {
    await withdrawalService.approveWithdrawal({ withdrawId, adminId: admin.id });
    return { success: true };
  } catch (err) {
    return { success: false, error: (err as Error).message };
  }
}

export async function completeWithdrawalAction(
  withdrawId: string,
  note?:      string
): Promise<ActionResult> {
  const admin = await requireAdmin();
  try {
    await withdrawalService.completeWithdrawal({ withdrawId, adminId: admin.id, note });
    return { success: true };
  } catch (err) {
    return { success: false, error: (err as Error).message };
  }
}

export async function rejectWithdrawalAction(
  withdrawId: string,
  reason:     string
): Promise<ActionResult> {
  const admin = await requireAdmin();
  try {
    await withdrawalService.rejectWithdrawal({ withdrawId, adminId: admin.id, reason });
    return { success: true };
  } catch (err) {
    return { success: false, error: (err as Error).message };
  }
}

export async function adminAdjustmentAction(
  prevState: ActionResult | null,
  formData:  FormData
): Promise<ActionResult> {
  const admin = await requireAdmin();

  const userId      = formData.get('userId')      as string;
  const amount      = formData.get('amount')      as string;
  const description = formData.get('description') as string;

  if (!userId || !amount || !description) {
    return { success: false, error: 'Missing required fields' };
  }

  try {
    await prisma.$transaction(async (tx) => {
      await ledgerService.recordAdminAdjustment({
        userId,
        amount:      BigInt(amount),
        description,
        adminId:     admin.id,
      }, tx);
    });
    return { success: true };
  } catch (err) {
    return { success: false, error: (err as Error).message };
  }
}

export async function banUserAction(
  userId: string,
  reason: string
): Promise<ActionResult> {
  const admin = await requireAdmin();
  try {
    await adminService.banUser({ userId, adminId: admin.id, reason });
    return { success: true };
  } catch (err) {
    return { success: false, error: (err as Error).message };
  }
}
