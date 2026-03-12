import { NextRequest, NextResponse } from 'next/server';
import { listingService } from '@/modules/listing/listing.service';
import { serializeBigInt } from '@/lib/utils';

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const listing = await listingService.getListingBySlug(params.id);
  if (!listing) {
    return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
  }
  return NextResponse.json(serializeBigInt(listing));
}
