import { NextRequest, NextResponse } from 'next/server';
import { listingService } from '@/modules/listing/listing.service';
import { withRateLimit, rateLimits } from '@/lib/rate-limit';
import { serializeBigInt } from '@/lib/utils';
import type { Platform, TransferMethod } from '@prisma/client';

const handler = async (req: NextRequest): Promise<NextResponse> => {
  const { searchParams } = req.nextUrl;

  const filters = {
    platform:       (searchParams.get('platform')       as Platform)       || undefined,
    transferMethod: (searchParams.get('transferMethod') as TransferMethod) || undefined,
    minPrice:       searchParams.get('minPrice') ? BigInt(searchParams.get('minPrice')!) : undefined,
    maxPrice:       searchParams.get('maxPrice') ? BigInt(searchParams.get('maxPrice')!) : undefined,
    search:         searchParams.get('search')   || undefined,
    page:           Number(searchParams.get('page')  || 1),
    limit:          Number(searchParams.get('limit') || 20),
    sortBy:         (searchParams.get('sortBy') as 'price_asc' | 'price_desc' | 'newest') || 'newest',
  };

  const result = await listingService.getListings(filters);
  return NextResponse.json(serializeBigInt(result));
};

export const GET = withRateLimit(rateLimits.api, handler);
