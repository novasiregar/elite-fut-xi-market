import { requireAdmin } from '@/modules/auth/session';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard, Users, FileCheck, ShoppingBag,
  AlertTriangle, Wallet, BookOpen, Settings, Shield
} from 'lucide-react';

const adminNav = [
  { href: '/admin',               icon: LayoutDashboard, label: 'Overview' },
  { href: '/admin/users',         icon: Users,           label: 'Users' },
  { href: '/admin/verifications', icon: FileCheck,       label: 'KYC Verifications' },
  { href: '/admin/orders',        icon: ShoppingBag,     label: 'Orders' },
  { href: '/admin/disputes',      icon: AlertTriangle,   label: 'Disputes' },
  { href: '/admin/withdrawals',   icon: Wallet,          label: 'Withdrawals' },
  { href: '/admin/ledger',        icon: BookOpen,        label: 'Ledger' },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();

  return (
    <div className="min-h-screen flex">
      {/* Admin sidebar */}
      <aside className="w-60 flex-shrink-0 border-r border-border bg-card/50 flex flex-col">
        <div className="p-5 border-b border-border">
          <Link href="/admin" className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            <span className="font-bold text-sm">Admin Panel</span>
          </Link>
          <p className="text-xs text-muted-foreground mt-0.5">ELITE FUT XI Market</p>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {adminNav.map(({ href, icon: Icon, label }) => (
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
        </nav>
        <div className="p-4 border-t border-border">
          <Link href="/" className="text-xs text-muted-foreground hover:text-foreground">
            ← Back to marketplace
          </Link>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 min-w-0 p-8 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
