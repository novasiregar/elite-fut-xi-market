'use server';

import { z } from 'zod';
import { requireAuth } from '@/modules/auth/session';
import { withdrawalService } from '@/modules/withdrawal/withdrawal.service';
import type { ActionResult } from './auth.actions';

const withdrawSchema = z.object({
  amount:            z.string().transform((v) => BigInt(v)),
  bankName:          z.string().min(2).max(100),
  bankAccountNumber: z.string().min(5).max(30),
  bankAccountName:   z.string().min(2).max(100),
});

export async function requestWithdrawalAction(
  prevState: ActionResult | null,
  formData:  FormData
): Promise<ActionResult> {
  const user = await requireAuth();

  const parsed = withdrawSchema.safeParse({
    amount:            formData.get('amount'),
    bankName:          formData.get('bankName'),
    bankAccountNumber: formData.get('bankAccountNumber'),
    bankAccountName:   formData.get('bankAccountName'),
  });
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0].message };
  }

  try {
    const result = await withdrawalService.requestWithdrawal({
      userId: user.id,
      ...parsed.data,
    });
    return { success: true, data: { withdrawId: result.id } };
  } catch (err) {
    return { success: false, error: (err as Error).message };
  }
}
