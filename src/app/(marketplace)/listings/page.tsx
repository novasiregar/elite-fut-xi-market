import { Suspense } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { ListingCard } from '@/components/listing/ListingCard';
import { listingService } from '@/modules/listing/listing.service';
import { serializeBigInt } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Platform, TransferMethod } from '@prisma/client';

interface PageProps {
  searchParams: {
    search?:         string;
    platform?:       string;
    transferMethod?: string;
    minPrice?:       string;
    maxPrice?:       string;
    sortBy?:         string;
    page?:           string;
  };
}

export const metadata = { title: 'Browse Listings' };

export default async function ListingsPage({ searchParams }: PageProps) {
  const page   = Number(searchParams.page || 1);
  const limit  = 20;

  const result = await listingService.getListings({
    search:         searchParams.search,
    platform:       searchParams.platform       as Platform,
    transferMethod: searchParams.transferMethod as TransferMethod,
    minPrice:       searchParams.minPrice ? BigInt(searchParams.minPrice) : undefined,
    maxPrice:       searchParams.maxPrice ? BigInt(searchParams.maxPrice) : undefined,
    sortBy:         searchParams.sortBy as 'price_asc' | 'price_desc' | 'newest',
    page,
    limit,
  });

  const listings   = serializeBigInt(result.listings);
  const totalPages = Math.ceil(result.total / limit);

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="container py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Browse Listings</h1>
          <p className="text-muted-foreground">{result.total.toLocaleString()} accounts available</p>
        </div>

        {/* Filters */}
        <form className="flex flex-wrap gap-3 mb-8">
          <Input
            name="search"
            placeholder="Search accounts..."
            defaultValue={searchParams.search}
            className="w-full md:w-64"
          />
          <Select name="platform" defaultValue={searchParams.platform}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Platform" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="PC">PC</SelectItem>
              <SelectItem value="PLAYSTATION">PlayStation</SelectItem>
              <SelectItem value="XBOX">Xbox</SelectItem>
              <SelectItem value="MOBILE">Mobile</SelectItem>
            </SelectContent>
          </Select>
          <Select name="sortBy" defaultValue={searchParams.sortBy || 'newest'}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest First</SelectItem>
              <SelectItem value="price_asc">Price: Low to High</SelectItem>
              <SelectItem value="price_desc">Price: High to Low</SelectItem>
            </SelectContent>
          </Select>
          <Button type="submit" className="gold-gradient text-black font-semibold">Filter</Button>
        </form>

        {/* Grid */}
        {listings.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {listings.map((listing: ReturnType<typeof serializeBigInt>[0]) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 text-muted-foreground">
            <p className="text-xl mb-2">No listings found</p>
            <p className="text-sm">Try adjusting your filters</p>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-10">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <Button
                key={p}
                variant={p === page ? 'default' : 'outline'}
                size="sm"
                asChild
              >
                <a href={`?page=${p}${searchParams.search ? `&search=${searchParams.search}` : ''}`}>{p}</a>
              </Button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
