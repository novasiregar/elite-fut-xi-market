import { notFound } from 'next/navigation';
import Image from 'next/image';
import { Navbar } from '@/components/layout/Navbar';
import { listingService } from '@/modules/listing/listing.service';
import { serializeBigInt, formatCurrency } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { createOrderAction } from '@/actions/order.actions';
import { getSessionUser } from '@/modules/auth/session';
import { StatusBadge } from '@/components/shared/StatusBadge';
import {
  Star, Coins, Monitor, Shield, Clock, User, CheckCircle
} from 'lucide-react';

interface PageProps { params: { id: string }; }

export async function generateMetadata({ params }: PageProps) {
  const listing = await listingService.getListingBySlug(params.id);
  if (!listing) return { title: 'Not Found' };
  return { title: listing.title };
}

export default async function ListingDetailPage({ params }: PageProps) {
  const [listing, sessionUser] = await Promise.all([
    listingService.getListingBySlug(params.id),
    getSessionUser(),
  ]);

  if (!listing) notFound();

  const s = serializeBigInt(listing);
  const price = BigInt(s.price);
  const isSeller = sessionUser?.id === listing.sellerId;

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="container py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Images + Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Image gallery */}
            <div className="relative aspect-video rounded-xl overflow-hidden bg-card border border-border">
              <Image
                src={s.images[0]?.url ?? '/placeholder-listing.webp'}
                alt={s.title}
                fill
                className="object-cover"
                priority
              />
            </div>
            {s.images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-2">
                {s.images.map((img: { url: string }, i: number) => (
                  <div key={i} className="relative w-24 h-16 flex-shrink-0 rounded-lg overflow-hidden border border-border">
                    <Image src={img.url} alt="" fill className="object-cover" />
                  </div>
                ))}
              </div>
            )}

            {/* Details */}
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">{s.title}</CardTitle>
                <div className="flex flex-wrap gap-2 mt-2">
                  <Badge variant="outline">{s.platform}</Badge>
                  <Badge variant="outline">{s.transferMethod.replace('_', ' ')}</Badge>
                  {s.rating && (
                    <Badge className="bg-primary/20 text-primary border-primary/30">
                      <Star className="h-3 w-3 mr-1 fill-current" />{s.rating} OVR
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  {s.coins && (
                    <div className="flex items-center gap-2">
                      <Coins className="h-4 w-4 text-amber-400" />
                      <span className="text-muted-foreground">Coins:</span>
                      <span className="font-semibold">{Number(s.coins).toLocaleString()}</span>
                    </div>
                  )}
                  {s.accountLevel && (
                    <div className="flex items-center gap-2">
                      <Star className="h-4 w-4 text-primary" />
                      <span className="text-muted-foreground">Level:</span>
                      <span className="font-semibold">{s.accountLevel}</span>
                    </div>
                  )}
                </div>
                <Separator />
                <div>
                  <h3 className="font-semibold mb-2">Description</h3>
                  <p className="text-muted-foreground text-sm whitespace-pre-wrap">{s.description}</p>
                </div>
                {s.tags?.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {s.tags.map((tag: string) => (
                      <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Purchase sidebar */}
          <div className="space-y-4">
            <Card className="sticky top-20">
              <CardContent className="p-6 space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Price</p>
                  <p className="text-3xl font-black gold-text">{formatCurrency(price)}</p>
                </div>
                <Separator />

                {!isSeller && sessionUser && (
                  <form action={async () => {
                    'use server';
                    await createOrderAction(listing.id);
                  }}>
                    <Button
                      type="submit"
                      className="w-full gold-gradient text-black font-bold h-12 text-base"
                    >
                      Buy Now — Escrow Protected
                    </Button>
                  </form>
                )}
                {!sessionUser && (
                  <Button className="w-full gold-gradient text-black font-bold h-12" asChild>
                    <a href="/login">Sign In to Buy</a>
                  </Button>
                )}
                {isSeller && (
                  <Badge className="w-full justify-center bg-muted text-muted-foreground">Your listing</Badge>
                )}

                {/* Escrow notice */}
                <div className="rounded-lg bg-primary/5 border border-primary/20 p-3 space-y-2">
                  <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                    <Shield className="h-4 w-4" /> Escrow Protected
                  </div>
                  {[
                    'Payment logged in our ledger',
                    'Seller delivers account',
                    'You confirm → funds released',
                    'Dispute support if needed',
                  ].map((point) => (
                    <div key={point} className="flex items-center gap-2 text-xs text-muted-foreground">
                      <CheckCircle className="h-3 w-3 text-green-400 flex-shrink-0" />{point}
                    </div>
                  ))}
                </div>

                {/* Seller info */}
                <Separator />
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                    <User className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{s.seller.username}</p>
                    <p className="text-xs text-muted-foreground">
                      {s.seller._count?.ordersAsSeller ?? 0} completed sales
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
