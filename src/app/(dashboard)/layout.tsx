import { requireAuth } from '@/modules/auth/session';
import { Navbar } from '@/components/layout/Navbar';
import Link from 'next/link';
import { LayoutDashboard, ShoppingBag, Wallet, Settings, Store, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';

const buyerNavItems = [
  { href: '/dashboard',            icon: LayoutDashboard, label: 'Overview' },
  { href: '/dashboard/orders',     icon: ShoppingBag,     label: 'My Orders' },
  { href: '/dashboard/wallet',     icon: Wallet,          label: 'Wallet' },
  { href: '/dashboard/settings',   icon: Settings,        label: 'Settings' },
];

const sellerNavItems = [
  { href: '/seller',               icon: LayoutDashboard, label: 'Seller Overview' },
  { href: '/seller/listings',      icon: FileText,        label: 'My Listings' },
  { href: '/seller/orders',        icon: ShoppingBag,     label: 'Sales' },
  { href: '/seller/withdrawals',   icon: Wallet,          label: 'Withdrawals' },
];

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAuth();
  const isSeller = user.role === 'SELLER' || user.role === 'ADMIN';

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="container py-6">
        <div className="flex gap-6">
          {/* Sidebar */}
          <aside className="hidden md:flex flex-col w-52 flex-shrink-0 gap-1">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 mb-2">Buyer</p>
            {buyerNavItems.map(({ href, icon: Icon, label }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors',
                  'text-muted-foreground hover:text-foreground hover:bg-secondary'
                )}
              >
                <Icon className="h-4 w-4" />{label}
              </Link>
            ))}
            {isSeller && (
              <>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 mt-4 mb-2">Seller</p>
                {sellerNavItems.map(({ href, icon: Icon, label }) => (
                  <Link
                    key={href}
                    href={href}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors',
                      'text-muted-foreground hover:text-foreground hover:bg-secondary'
                    )}
                  >
                    <Icon className="h-4 w-4" />{label}
                  </Link>
                ))}
              </>
            )}
          </aside>

          {/* Main content */}
          <main className="flex-1 min-w-0">{children}</main>
        </div>
      </div>
    </div>
  );
}
