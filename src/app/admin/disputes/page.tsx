import { adminService } from '@/modules/admin/admin.service';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { resolveDisputeAction } from '@/actions/admin.actions';
import { serializeBigInt, formatCurrency } from '@/lib/utils';
import { AlertTriangle } from 'lucide-react';

export const metadata = { title: 'Disputes' };

export default async function AdminDisputesPage() {
  const { disputes } = await adminService.getAllDisputes(1, 20);
  const serialized   = serializeBigInt(disputes);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Disputes</h1>
        <p className="text-muted-foreground text-sm">{disputes.length} disputes</p>
      </div>

      {serialized.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <AlertTriangle className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p>No disputes found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {serialized.map((dispute: ReturnType<typeof serializeBigInt>[0]) => (
            <Card key={dispute.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="font-semibold">{dispute.order?.orderNumber}</p>
                    <p className="text-sm text-muted-foreground">
                      Buyer: <strong>{dispute.buyer?.username}</strong> vs Seller: <strong>{dispute.seller?.username}</strong>
                    </p>
                    <p className="text-sm text-muted-foreground">Order Value: {formatCurrency(BigInt(dispute.order?.price ?? 0))}</p>
                  </div>
                  <StatusBadge status={dispute.status} />
                </div>

                <div className="bg-secondary/50 rounded-lg p-4 mb-4">
                  <p className="text-xs text-muted-foreground mb-1">Reason</p>
                  <p className="text-sm font-semibold">{dispute.reason}</p>
                  <p className="text-sm text-muted-foreground mt-2">{dispute.description}</p>
                </div>

                {['OPEN', 'UNDER_REVIEW'].includes(dispute.status) && (
                  <div className="flex gap-3">
                    <form action={resolveDisputeAction.bind(null, null)}>
                      <input type="hidden" name="disputeId"  value={dispute.id} />
                      <input type="hidden" name="resolution" value="REFUND" />
                      <input type="hidden" name="adminNote"  value="Dispute resolved in buyer favor" />
                      <Button type="submit" variant="destructive" size="sm">
                        Refund Buyer
                      </Button>
                    </form>
                    <form action={resolveDisputeAction.bind(null, null)}>
                      <input type="hidden" name="disputeId"  value={dispute.id} />
                      <input type="hidden" name="resolution" value="RELEASE" />
                      <input type="hidden" name="adminNote"  value="Dispute resolved in seller favor" />
                      <Button type="submit" className="gold-gradient text-black" size="sm">
                        Release to Seller
                      </Button>
                    </form>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
