import { requireSeller } from '@/modules/auth/session';
import { orderService } from '@/modules/order/order.service';
import { walletService } from '@/modules/ledger/wallet.service';
import { serializeBigInt, formatCurrency } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/shared/StatusBadge';
import Link from 'next/link';
import { Plus, Wallet, ShoppingBag, TrendingUp, Package } from 'lucide-react';
import prisma from '@/lib/prisma';

export const metadata = { title: 'Seller Dashboard' };

export default async function SellerDashboardPage() {
  const user = await requireSeller();

  const [wallet, recentSales, activeListings, totalListings] = await Promise.all([
    walletService.getBalance(user.id),
    orderService.getSellerOrders(user.id, 1, 5),
    prisma.listing.count({ where: { sellerId: user.id, status: 'ACTIVE' } }),
    prisma.listing.count({ where: { sellerId: user.id } }),
  ]);

  const w = serializeBigInt(wallet);
  const sales = serializeBigInt(recentSales.orders);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Seller Dashboard</h1>
          <p className="text-muted-foreground text-sm">Manage your listings and track earnings</p>
        </div>
        <Button className="gold-gradient text-black font-semibold" asChild>
          <Link href="/seller/listings/new"><Plus className="h-4 w-4 mr-2" />New Listing</Link>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: Wallet,      label: 'Available',     value: formatCurrency(BigInt(w?.balanceAvailable ?? 0)) },
          { icon: TrendingUp,  label: 'Pending',        value: formatCurrency(BigInt(w?.balancePending   ?? 0)) },
          { icon: Package,     label: 'Active Listings', value: activeListings.toString() },
          { icon: ShoppingBag, label: 'Total Sales',    value: recentSales.total.toString() },
        ].map(({ icon: Icon, label, value }) => (
          <Card key={label}>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-2">
                <Icon className="h-4 w-4" />
                <span className="text-xs">{label}</span>
              </div>
              <p className="text-xl font-bold">{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent sales */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Recent Sales</CardTitle>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/seller/orders">View All</Link>
          </Button>
        </CardHeader>
        <CardContent>
          {sales.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p className="text-sm">No sales yet. Create a listing to get started.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {sales.map((order: ReturnType<typeof serializeBigInt>[0]) => (
                <div key={order.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
                  <div>
                    <p className="text-sm font-semibold">{order.listing?.title}</p>
                    <p className="text-xs text-muted-foreground">
                      Buyer: {order.buyer?.username} · {order.orderNumber}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-primary">
                      {formatCurrency(BigInt(order.sellerReceives ?? order.price))}
                    </span>
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
