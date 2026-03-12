'use server';

import { z } from 'zod';
import { requireSeller, requireAuth } from '@/modules/auth/session';
import { listingService } from '@/modules/listing/listing.service';
import { uploadDocument } from '@/lib/cloudinary';
import type { ActionResult } from './auth.actions';
import type { Platform, TransferMethod } from '@prisma/client';

const createListingSchema = z.object({
  title:          z.string().min(10).max(100),
  description:    z.string().min(30).max(5000),
  price:          z.string().transform((v) => BigInt(v)),
  coins:          z.string().optional().transform((v) => v ? BigInt(v) : undefined),
  rating:         z.string().optional().transform((v) => v ? Number(v) : undefined),
  platform:       z.enum(['PC','PLAYSTATION','XBOX','MOBILE','NINTENDO']),
  accountLevel:   z.string().optional().transform((v) => v ? Number(v) : undefined),
  transferMethod: z.enum(['FULL_ACCESS','EMAIL_CHANGE','MIDMAN','GIFT']),
  tags:           z.string().optional().transform((v) => v ? v.split(',').map(t => t.trim()) : []),
});

export async function createListingAction(
  prevState: ActionResult | null,
  formData:  FormData
): Promise<ActionResult> {
  const seller = await requireSeller();

  const raw = {
    title:          formData.get('title')          as string,
    description:    formData.get('description')    as string,
    price:          formData.get('price')          as string,
    coins:          formData.get('coins')          as string,
    rating:         formData.get('rating')         as string,
    platform:       formData.get('platform')       as string,
    accountLevel:   formData.get('accountLevel')   as string,
    transferMethod: formData.get('transferMethod') as string,
    tags:           formData.get('tags')           as string,
  };

  const parsed = createListingSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0].message };
  }

  try {
    const listing = await listingService.createListing({
      sellerId: seller.id,
      ...parsed.data,
      platform:       parsed.data.platform       as Platform,
      transferMethod: parsed.data.transferMethod as TransferMethod,
    });
    return { success: true, data: { listingId: listing.id, slug: listing.slug } };
  } catch (err) {
    return { success: false, error: (err as Error).message };
  }
}

export async function publishListingAction(
  listingId: string
): Promise<ActionResult> {
  const seller = await requireSeller();
  try {
    await listingService.updateStatus(listingId, seller.id, 'ACTIVE');
    return { success: true };
  } catch (err) {
    return { success: false, error: (err as Error).message };
  }
}

export async function archiveListingAction(
  listingId: string
): Promise<ActionResult> {
  const seller = await requireSeller();
  try {
    await listingService.updateStatus(listingId, seller.id, 'ARCHIVED');
    return { success: true };
  } catch (err) {
    return { success: false, error: (err as Error).message };
  }
}
