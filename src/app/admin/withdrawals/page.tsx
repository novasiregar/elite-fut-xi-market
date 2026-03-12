import { adminService } from '@/modules/admin/admin.service';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { approveWithdrawalAction, completeWithdrawalAction, rejectWithdrawalAction } from '@/actions/admin.actions';
import { serializeBigInt, formatCurrency, maskSensitive } from '@/lib/utils';
import { Wallet } from 'lucide-react';

export const metadata = { title: 'Withdrawals' };

export default async function AdminWithdrawalsPage() {
  const { withdrawals } = await adminService.getAllWithdrawals(1, 50);
  const serialized = serializeBigInt(withdrawals);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Withdrawals</h1>
        <p className="text-muted-foreground text-sm">
          Manual payout model — all transfers processed by admin
        </p>
      </div>

      <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-4 text-sm">
        <p className="font-semibold text-amber-400">⚠️ Manual Payout Required</p>
        <p className="text-muted-foreground mt-1">
          For each APPROVED withdrawal, manually transfer via bank, then mark as Completed to record the ledger entry.
        </p>
      </div>

      {serialized.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <Wallet className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p>No withdrawal requests</p>
        </div>
      ) : (
        <div className="space-y-4">
          {serialized.map((w: ReturnType<typeof serializeBigInt>[0]) => (
            <Card key={w.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="font-bold text-lg text-primary">{formatCurrency(BigInt(w.amount))}</p>
                    <p className="text-sm text-muted-foreground">
                      {w.user?.username} · {w.user?.email}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(w.createdAt).toLocaleString('id-ID')}
                    </p>
                  </div>
                  <StatusBadge status={w.status} />
                </div>

                <div className="bg-secondary/50 rounded-lg p-3 text-sm space-y-1 mb-4">
                  <p><span className="text-muted-foreground">Bank:</span> <strong>{w.bankName}</strong></p>
                  <p><span className="text-muted-foreground">Account:</span> <strong className="font-mono">{w.bankAccountNumber}</strong></p>
                  <p><span className="text-muted-foreground">Name:</span> <strong>{w.bankAccountName}</strong></p>
                </div>

                <div className="flex gap-3 flex-wrap">
                  {w.status === 'PENDING' && (
                    <form action={approveWithdrawalAction.bind(null, w.id)}>
                      <Button type="submit" size="sm" className="gold-gradient text-black font-semibold">Approve</Button>
                    </form>
                  )}
                  {['APPROVED', 'PROCESSING'].includes(w.status) && (
                    <form action={completeWithdrawalAction.bind(null, w.id, 'Manual bank transfer completed')}>
                      <Button type="submit" size="sm" className="bg-green-600 hover:bg-green-700 text-white">Mark Completed</Button>
                    </form>
                  )}
                  {['PENDING', 'UNDER_REVIEW'].includes(w.status) && (
                    <form action={rejectWithdrawalAction.bind(null, w.id, 'Request rejected by admin')}>
                      <Button type="submit" size="sm" variant="destructive">Reject</Button>
                    </form>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
