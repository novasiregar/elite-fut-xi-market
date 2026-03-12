import { requireSeller } from '@/modules/auth/session';
import prisma from '@/lib/prisma';
import { serializeBigInt, formatCurrency } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { publishListingAction, archiveListingAction } from '@/actions/listing.actions';
import Link from 'next/link';
import Image from 'next/image';
import { Plus, Eye } from 'lucide-react';

export const metadata = { title: 'My Listings' };

export default async function SellerListingsPage() {
  const user = await requireSeller();

  const listings = await prisma.listing.findMany({
    where:   { sellerId: user.id },
    include: { images: { where: { isPrimary: true }, take: 1 }, _count: { select: { orders: true } } },
    orderBy: { createdAt: 'desc' },
  });

  const serialized = serializeBigInt(listings);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">My Listings</h1>
        <Button className="gold-gradient text-black font-semibold" asChild>
          <Link href="/seller/listings/new"><Plus className="h-4 w-4 mr-2" />New Listing</Link>
        </Button>
      </div>

      {serialized.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <p className="text-lg mb-2">No listings yet</p>
          <Button className="gold-gradient text-black font-semibold" asChild>
            <Link href="/seller/listings/new">Create Your First Listing</Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {serialized.map((listing: ReturnType<typeof serializeBigInt>[0]) => (
            <Card key={listing.id} className="overflow-hidden">
              <CardContent className="p-0">
                <div className="flex items-center gap-4 p-4">
                  <div className="relative w-20 h-16 rounded-lg overflow-hidden bg-secondary flex-shrink-0">
                    {listing.images[0] ? (
                      <Image src={listing.images[0].url} alt="" fill className="object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">No img</div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">{listing.title}</p>
                    <p className="text-xs text-muted-foreground">{listing.platform} · {listing._count?.orders ?? 0} orders</p>
                    <p className="text-sm font-bold text-primary mt-1">{formatCurrency(BigInt(listing.price))}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <StatusBadge status={listing.status} />
                    <Button variant="ghost" size="icon" asChild>
                      <Link href={`/listings/${listing.slug}`}><Eye className="h-4 w-4" /></Link>
                    </Button>
                    {listing.status === 'DRAFT' && (
                      <form action={publishListingAction.bind(null, listing.id)}>
                        <Button type="submit" size="sm" className="gold-gradient text-black">Publish</Button>
                      </form>
                    )}
                    {listing.status === 'ACTIVE' && (
                      <form action={archiveListingAction.bind(null, listing.id)}>
                        <Button type="submit" size="sm" variant="outline">Archive</Button>
                      </form>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
