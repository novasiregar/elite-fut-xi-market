import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ListingCard } from '@/components/listing/ListingCard';
import { listingService } from '@/modules/listing/listing.service';
import { serializeBigInt } from '@/lib/utils';
import { Shield, Zap, Users, TrendingUp, ChevronRight } from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';

export const revalidate = 60;

export default async function HomePage() {
  const { listings } = await listingService.getListings({ limit: 8, sortBy: 'newest' });
  const serialized = serializeBigInt(listings);

  return (
    <div className="min-h-screen">
      <Navbar />

      {/* HERO */}
      <section className="relative overflow-hidden border-b border-border">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 via-transparent to-transparent" />
        <div className="container py-20 md:py-32 relative">
          <div className="max-w-3xl">
            <Badge className="mb-4 bg-primary/20 text-primary border-primary/30">
              ⚽ Trusted Football Account Marketplace
            </Badge>
            <h1 className="text-4xl md:text-6xl font-black mb-6 leading-tight">
              Trade Football Accounts
              <span className="block gold-text">Safely & Securely</span>
            </h1>
            <p className="text-lg text-muted-foreground mb-8 max-w-xl">
              ELITE FUT XI Market uses an escrow-protected ledger system to ensure
              every transaction is safe. Sellers get paid, buyers get accounts.
            </p>
            <div className="flex flex-wrap gap-4">
              <Button size="lg" className="gold-gradient text-black font-bold px-8" asChild>
                <Link href="/listings">Browse Accounts <ChevronRight className="ml-1 h-4 w-4" /></Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/seller/verification">Become a Seller</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* TRUST SIGNALS */}
      <section className="border-b border-border bg-card/50">
        <div className="container py-12 grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { icon: Shield, title: 'Escrow Protected',  desc: 'Funds tracked via internal ledger until delivery confirmed' },
            { icon: Zap,    title: 'Fast Delivery',      desc: 'Most sellers deliver within 24 hours' },
            { icon: Users,  title: 'Verified Sellers',   desc: 'All sellers pass KYC identity verification' },
            { icon: TrendingUp, title: 'Safe Trading',   desc: 'Dispute resolution backed by admin review' },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <Icon className="h-5 w-5 text-primary" />
                <h3 className="font-semibold text-sm">{title}</h3>
              </div>
              <p className="text-xs text-muted-foreground">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* LISTINGS */}
      <section className="container py-16">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold">Latest Listings</h2>
            <p className="text-muted-foreground text-sm mt-1">Fresh football accounts just listed</p>
          </div>
          <Button variant="outline" asChild>
            <Link href="/listings">View All <ChevronRight className="ml-1 h-4 w-4" /></Link>
          </Button>
        </div>

        {serialized.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {serialized.map((listing: ReturnType<typeof serializeBigInt>[0]) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 text-muted-foreground">
            <p className="text-lg">No listings yet. Be the first to sell!</p>
            <Button className="mt-4 gold-gradient text-black" asChild>
              <Link href="/seller/verification">Start Selling</Link>
            </Button>
          </div>
        )}
      </section>

      {/* HOW IT WORKS */}
      <section className="border-t border-border bg-card/30">
        <div className="container py-16">
          <h2 className="text-2xl font-bold text-center mb-12">How It Works</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: '01', title: 'Browse & Buy',    desc: 'Find the perfect account. Click checkout to create a secure order and pay via QRIS, VA, or e-wallet.' },
              { step: '02', title: 'Escrow Hold',     desc: 'Your payment is logged in our ledger as an escrow hold. The seller is notified to deliver the account.' },
              { step: '03', title: 'Confirm & Done',  desc: 'Verify the account works. Confirm delivery to release the escrow. Seller receives their funds.' },
            ].map(({ step, title, desc }) => (
              <div key={step} className="relative">
                <div className="text-6xl font-black gold-text opacity-30 mb-2">{step}</div>
                <h3 className="font-bold text-lg mb-2">{title}</h3>
                <p className="text-muted-foreground text-sm">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-border bg-card/50">
        <div className="container py-8 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <p>⚽ <strong className="gold-text">ELITE FUT XI Market</strong> &mdash; Ledger-based escrow marketplace</p>
          <div className="flex gap-6">
            <Link href="/listings"  className="hover:text-foreground transition-colors">Browse</Link>
            <Link href="/dashboard" className="hover:text-foreground transition-colors">Dashboard</Link>
            <Link href="/login"     className="hover:text-foreground transition-colors">Sign In</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
