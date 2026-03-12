import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/utils';
import { Star, Coins, Monitor } from 'lucide-react';

interface ListingCardProps {
  listing: {
    id:             string;
    slug:           string;
    title:          string;
    price:          bigint | string;
    coins?:         bigint | string | null;
    rating?:        number | null;
    platform:       string;
    transferMethod: string;
    images:         Array<{ url: string; altText?: string | null }>;
    seller:         { username: string; avatarUrl?: string | null };
  };
}

export function ListingCard({ listing }: ListingCardProps) {
  const price  = BigInt(listing.price.toString());
  const coins  = listing.coins ? BigInt(listing.coins.toString()) : null;
  const imgSrc = listing.images[0]?.url ?? '/placeholder-listing.webp';

  return (
    <Card className="group overflow-hidden bg-card border-border card-hover">
      <div className="relative aspect-video overflow-hidden">
        <Image
          src={imgSrc}
          alt={listing.images[0]?.altText ?? listing.title}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-105"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
        <div className="absolute top-2 left-2 flex gap-1">
          <Badge className="bg-black/70 text-white border-0 text-xs">
            <Monitor className="h-3 w-3 mr-1" />{listing.platform}
          </Badge>
        </div>
        {listing.rating && (
          <div className="absolute top-2 right-2">
            <Badge className="bg-primary/90 text-primary-foreground border-0">
              <Star className="h-3 w-3 mr-1 fill-current" />{listing.rating}
            </Badge>
          </div>
        )}
      </div>

      <CardContent className="p-4">
        <h3 className="font-semibold text-sm leading-tight line-clamp-2 mb-2 group-hover:text-primary transition-colors">
          {listing.title}
        </h3>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {coins && (
            <span className="flex items-center gap-1">
              <Coins className="h-3 w-3 text-amber-400" />
              {Number(coins).toLocaleString()} coins
            </span>
          )}
          <span className="ml-auto">{listing.transferMethod.replace('_', ' ')}</span>
        </div>
      </CardContent>

      <CardFooter className="p-4 pt-0 flex items-center justify-between">
        <div>
          <p className="text-xs text-muted-foreground">Price</p>
          <p className="font-bold text-primary">{formatCurrency(price)}</p>
        </div>
        <Button size="sm" asChild className="gold-gradient text-black font-semibold hover:opacity-90">
          <Link href={`/listings/${listing.slug}`}>View</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
