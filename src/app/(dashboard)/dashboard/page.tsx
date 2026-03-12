import { requireAuth } from '@/modules/auth/session';
import { walletService } from '@/modules/ledger/wallet.service';
import { orderService } from '@/modules/order/order.service';
import { notificationService } from '@/modules/notification/notification.service';
import { serializeBigInt, formatCurrency } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/shared/StatusBadge';
import Link from 'next/link';
import { Wallet, ShoppingBag, Bell, TrendingUp } from 'lucide-react';

export const metadata = { title: 'Dashboard' };

export default async function DashboardPage() {
  const user = await requireAuth();

  const [wallet, recentOrders, unread] = await Promise.all([
    walletService.getBalance(user.id),
    orderService.getBuyerOrders(user.id, 1, 5),
    notificationService.getUnreadCount(user.id),
  ]);

  const w = serializeBigInt(wallet);
  const orders = serializeBigInt(recentOrders.orders);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground text-sm">Welcome back, {user.name ?? user.username}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: Wallet,      label: 'Available Balance', value: formatCurrency(BigInt(w?.balanceAvailable ?? 0)),  sub: 'Ready to withdraw' },
          { icon: TrendingUp,  label: 'Pending',            value: formatCurrency(BigInt(w?.balancePending   ?? 0)),  sub: 'In escrow' },
          { icon: ShoppingBag, label: 'Total Orders',       value: recentOrders.total.toString(),                     sub: 'All time' },
          { icon: Bell,        label: 'Unread',             value: unread.toString(),                                  sub: 'Notifications' },
        ].map(({ icon: Icon, label, value, sub }) => (
          <Card key={label}>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-2">
                <Icon className="h-4 w-4" />
                <span className="text-xs">{label}</span>
              </div>
              <p className="text-xl font-bold">{value}</p>
              <p className="text-xs text-muted-foreground">{sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Orders */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Recent Orders</CardTitle>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard/orders">View All</Link>
          </Button>
        </CardHeader>
        <CardContent>
          {orders.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No orders yet.</p>
              <Button className="mt-3 gold-gradient text-black" size="sm" asChild>
                <Link href="/listings">Browse Listings</Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {orders.map((order: ReturnType<typeof serializeBigInt>[0]) => (
                <div key={order.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <ShoppingBag className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold line-clamp-1">{order.listing?.title ?? 'Order'}</p>
                      <p className="text-xs text-muted-foreground">{order.orderNumber}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusBadge status={order.status} />
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/orders/${order.id}`}>View</Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
