import { requireAuth } from '@/modules/auth/session';
import { walletService } from '@/modules/ledger/wallet.service';
import { ledgerRepository } from '@/modules/ledger/ledger.repository';
import { serializeBigInt, formatCurrency, maskSensitive } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { requestWithdrawalAction } from '@/actions/withdrawal.actions';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Wallet, ArrowDownCircle, ArrowUpCircle, AlertCircle } from 'lucide-react';

export const metadata = { title: 'Wallet' };

const ledgerTypeLabels: Record<string, string> = {
  PAYMENT_RECEIVED:  'Payment',
  ESCROW_HOLD:       'Escrow Hold',
  ESCROW_RELEASE:    'Escrow Release',
  PLATFORM_FEE:      'Platform Fee',
  REFUND:            'Refund',
  WITHDRAW_REQUEST:  'Withdrawal Request',
  WITHDRAW_COMPLETED:'Withdrawal Completed',
  ADMIN_ADJUSTMENT:  'Admin Adjustment',
  DISPUTE_REFUND:    'Dispute Refund',
};

export default async function WalletPage() {
  const user = await requireAuth();

  const [wallet, { entries }] = await Promise.all([
    walletService.getBalance(user.id),
    ledgerRepository.findByUser(user.id, { page: 1, limit: 30 }),
  ]);

  const w = serializeBigInt(wallet);
  const txs = serializeBigInt(entries);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Wallet</h1>

      {/* Balance cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Available',  value: w?.balanceAvailable ?? '0', color: 'text-green-400' },
          { label: 'Pending',    value: w?.balancePending   ?? '0', color: 'text-yellow-400' },
          { label: 'Withdrawn',  value: w?.balanceWithdrawn ?? '0', color: 'text-blue-400' },
          { label: 'Refunded',   value: w?.balanceRefunded  ?? '0', color: 'text-orange-400' },
        ].map(({ label, value, color }) => (
          <Card key={label}>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className={`text-lg font-bold ${color}`}>{formatCurrency(BigInt(value))}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Important notice */}
      <div className="flex gap-3 rounded-lg border border-amber-500/30 bg-amber-500/5 p-4">
        <AlertCircle className="h-5 w-5 text-amber-400 flex-shrink-0 mt-0.5" />
        <div className="text-sm">
          <p className="font-semibold text-amber-400">Ledger-Based Wallet</p>
          <p className="text-muted-foreground mt-1">
            Your balance is calculated from transaction records. Withdrawals are processed manually by admins within 1–3 business days.
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Withdrawal form */}
        <Card>
          <CardHeader><CardTitle className="text-base">Request Withdrawal</CardTitle></CardHeader>
          <CardContent>
            <form action={requestWithdrawalAction.bind(null, null)} className="space-y-3">
              <div className="space-y-1">
                <Label htmlFor="amount">Amount (IDR)</Label>
                <Input id="amount" name="amount" type="number" placeholder="Min. 50,000" required />
              </div>
              <div className="space-y-1">
                <Label>Bank Name</Label>
                <Input name="bankName" placeholder="e.g. BCA, BNI, Mandiri" required />
              </div>
              <div className="space-y-1">
                <Label>Account Number</Label>
                <Input name="bankAccountNumber" placeholder="1234567890" required />
              </div>
              <div className="space-y-1">
                <Label>Account Holder Name</Label>
                <Input name="bankAccountName" placeholder="Full Name" required />
              </div>
              <Button type="submit" className="w-full gold-gradient text-black font-semibold">
                Request Withdrawal
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Transaction history */}
        <Card>
          <CardHeader><CardTitle className="text-base">Transaction History</CardTitle></CardHeader>
          <CardContent className="space-y-2 max-h-96 overflow-y-auto">
            {txs.length === 0 ? (
              <p className="text-center text-muted-foreground py-6 text-sm">No transactions yet</p>
            ) : (
              txs.map((tx: ReturnType<typeof serializeBigInt>[0]) => {
                const amount = BigInt(tx.amount);
                const isCredit = amount > 0;
                return (
                  <div key={tx.id} className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-2">
                      {isCredit
                        ? <ArrowDownCircle className="h-4 w-4 text-green-400" />
                        : <ArrowUpCircle   className="h-4 w-4 text-red-400" />}
                      <div>
                        <p className="text-xs font-medium">{ledgerTypeLabels[tx.type] ?? tx.type}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(tx.createdAt).toLocaleDateString('id-ID')}
                        </p>
                      </div>
                    </div>
                    <span className={`text-sm font-semibold ${isCredit ? 'text-green-400' : 'text-red-400'}`}>
                      {isCredit ? '+' : ''}{formatCurrency(amount)}
                    </span>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
