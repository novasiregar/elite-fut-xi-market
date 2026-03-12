import { adminService } from '@/modules/admin/admin.service';
import { serializeBigInt, formatCurrency } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import {
  Users, ShoppingBag, AlertTriangle, Wallet,
  TrendingUp, FileCheck, Package, DollarSign
} from 'lucide-react';

export const metadata = { title: 'Admin Overview' };

export default async function AdminOverviewPage() {
  const metrics = serializeBigInt(await adminService.getDashboardMetrics());

  const stats = [
    { icon: Users,        label: 'Total Users',      value: metrics.users.total,         sub: `${metrics.users.sellers} sellers`,        href: '/admin/users',         color: 'text-blue-400' },
    { icon: Package,      label: 'Active Listings',  value: metrics.listings.active,     sub: `${metrics.listings.total} total`,         href: '/admin/listings',      color: 'text-green-400' },
    { icon: ShoppingBag,  label: "Today's Orders",   value: metrics.orders.today,        sub: `${metrics.orders.total} all time`,        href: '/admin/orders',        color: 'text-purple-400' },
    { icon: AlertTriangle,label: 'Open Disputes',    value: metrics.disputes.open,       sub: 'Needs resolution',                        href: '/admin/disputes',      color: 'text-red-400' },
    { icon: Wallet,       label: 'Pending Withdraw', value: metrics.withdrawals.pending, sub: 'Manual transfer required',                href: '/admin/withdrawals',   color: 'text-yellow-400' },
    { icon: FileCheck,    label: 'Pending KYC',      value: metrics.kyc.pending,         sub: 'Awaiting review',                         href: '/admin/verifications', color: 'text-cyan-400' },
    { icon: DollarSign,   label: 'Total Volume',     value: formatCurrency(BigInt(metrics.financials.totalVolume)), sub: 'Completed orders', href: '/admin/orders', color: 'text-primary' },
    { icon: TrendingUp,   label: 'Escrow Value',     value: formatCurrency(BigInt(metrics.financials.escrowValue)), sub: 'In ledger hold', href: '/admin/ledger',  color: 'text-amber-400' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Admin Overview</h1>
        <p className="text-muted-foreground text-sm">Platform metrics and pending actions</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(({ icon: Icon, label, value, sub, href, color }) => (
          <Link key={label} href={href}>
            <Card className="hover:border-primary/30 transition-colors cursor-pointer">
              <CardContent className="p-4">
                <div className={`flex items-center gap-2 mb-2 ${color}`}>
                  <Icon className="h-4 w-4" />
                  <span className="text-xs text-muted-foreground">{label}</span>
                </div>
                <p className="text-2xl font-black">{value}</p>
                <p className="text-xs text-muted-foreground mt-1">{sub}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader><CardTitle className="text-base">Quick Actions</CardTitle></CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button variant="outline" asChild><Link href="/admin/verifications">Review KYC</Link></Button>
          <Button variant="outline" asChild><Link href="/admin/disputes">Resolve Disputes</Link></Button>
          <Button variant="outline" asChild><Link href="/admin/withdrawals">Process Withdrawals</Link></Button>
          <Button variant="outline" asChild><Link href="/admin/ledger">View Ledger</Link></Button>
        </CardContent>
      </Card>
    </div>
  );
}
