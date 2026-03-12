import { notFound } from 'next/navigation';
import { requireAuth } from '@/modules/auth/session';
import { orderService } from '@/modules/order/order.service';
import { serializeBigInt, formatCurrency } from '@/lib/utils';
import { Navbar } from '@/components/layout/Navbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { confirmDeliveryAction } from '@/actions/order.actions';
import Link from 'next/link';
import { Shield, CheckCircle, AlertTriangle, Clock } from 'lucide-react';

interface PageProps { params: { orderId: string } }

export const metadata = { title: 'Order Details' };

export default async function OrderDetailPage({ params }: PageProps) {
  const user = await requireAuth();

  let order;
  try {
    order = await orderService.getOrderDetail(params.orderId, user.id);
  } catch {
    notFound();
  }

  const o        = serializeBigInt(order);
  const isBuyer  = order.buyerId  === user.id;
  const isSeller = order.sellerId === user.id;

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="container py-8 max-w-3xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Order Details</h1>
            <p className="text-muted-foreground text-sm font-mono">{o.orderNumber}</p>
          </div>
          <StatusBadge status={o.status} />
        </div>

        {/* Escrow Status Banner */}
        {o.status === 'ESCROW_HOLD' && (
          <div className="rounded-lg border border-purple-500/30 bg-purple-500/10 p-4 mb-6 flex items-start gap-3">
            <Shield className="h-5 w-5 text-purple-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-purple-300">Funds In Escrow</p>
              <p className="text-sm text-muted-foreground mt-1">
                {isBuyer ? 'Your payment is recorded in our escrow ledger. Waiting for seller to deliver the account.'
                         : 'Payment confirmed! Please deliver the account details to the buyer.'}
              </p>
            </div>
          </div>
        )}

        {/* Delivered Banner */}
        {o.status === 'DELIVERED' && isBuyer && (
          <div className="rounded-lg border border-cyan-500/30 bg-cyan-500/10 p-4 mb-6">
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-cyan-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold text-cyan-300">Account Delivered</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Please verify the account, then confirm delivery to release escrow. Auto-confirms in 72 hours.
                </p>
                {o.autoConfirmAt && (
                  <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Auto-confirm: {new Date(o.autoConfirmAt).toLocaleString('id-ID')}
                  </p>
                )}
              </div>
            </div>
            <div className="flex gap-3 mt-4">
              <form action={confirmDeliveryAction.bind(null, o.id)}>
                <Button type="submit" className="gold-gradient text-black font-semibold">
                  Confirm &amp; Release Escrow
                </Button>
              </form>
              <Button variant="destructive" size="sm" asChild>
                <Link href={`/orders/${o.id}/dispute`}>Open Dispute</Link>
              </Button>
            </div>
          </div>
        )}

        <div className="grid gap-6">
          {/* Order Info */}
          <Card>
            <CardHeader><CardTitle className="text-base">Order Summary</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Listing</span>
                <span className="font-medium">{o.listing?.title}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Price</span>
                <span className="font-bold text-primary">{formatCurrency(BigInt(o.price))}</span>
              </div>
              {isSeller && (
                <>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Platform Fee ({process.env.PLATFORM_FEE_PERCENT ?? 5}%)</span>
                    <span className="text-red-400">-{formatCurrency(BigInt(o.platformFee))}</span>
                  </div>
                  <div className="flex justify-between font-bold">
                    <span>You Receive</span>
                    <span className="text-green-400">{formatCurrency(BigInt(o.sellerReceives))}</span>
                  </div>
                </>
              )}
              <Separator />
              <div className="flex justify-between">
                <span className="text-muted-foreground">{isBuyer ? 'Seller' : 'Buyer'}</span>
                <span>{isBuyer ? o.seller?.username : o.buyer?.username}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Created</span>
                <span>{new Date(o.createdAt).toLocaleString('id-ID')}</span>
              </div>
            </CardContent>
          </Card>

          {/* Delivery Note (visible after DELIVERED) */}
          {o.deliveryNote && ['DELIVERED', 'COMPLETED'].includes(o.status) && isBuyer && (
            <Card className="border-cyan-500/30">
              <CardHeader>
                <CardTitle className="text-base text-cyan-300">Account Details</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="text-sm bg-secondary/50 rounded-lg p-4 whitespace-pre-wrap font-mono">
                  {o.deliveryNote}
                </pre>
              </CardContent>
            </Card>
          )}

          {/* Payment info */}
          {o.payment && (
            <Card>
              <CardHeader><CardTitle className="text-base">Payment</CardTitle></CardHeader>
              <CardContent className="text-sm space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status</span>
                  <StatusBadge status={o.payment.status} />
                </div>
                {o.payment.status === 'PENDING' && (
                  <Button className="w-full gold-gradient text-black font-semibold" asChild>
                    <a href={o.payment.invoiceUrl} target="_blank" rel="noreferrer">Pay Now</a>
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
