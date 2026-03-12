import prisma from '@/lib/prisma';
import { serializeBigInt, formatCurrency } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowDownCircle, ArrowUpCircle } from 'lucide-react';

export const metadata = { title: 'Ledger' };

export default async function AdminLedgerPage() {
  const entries = await prisma.ledgerEntry.findMany({
    include: { user: { select: { username: true, email: true } } },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });

  const serialized = serializeBigInt(entries);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Ledger</h1>
        <p className="text-muted-foreground text-sm">
          Immutable financial event log — showing last 100 entries
        </p>
      </div>

      <div className="rounded-lg border border-blue-500/30 bg-blue-500/5 p-4 text-sm">
        <p className="font-semibold text-blue-400">📊 Internal Accounting Ledger</p>
        <p className="text-muted-foreground mt-1">
          These are accounting records only. The platform does NOT hold real funds.
          All entries are immutable and cannot be modified.
        </p>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  {['Date', 'User', 'Type', 'Amount', 'Reference', 'Description'].map((h) => (
                    <th key={h} className="text-left text-xs text-muted-foreground font-medium px-4 py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {serialized.map((entry: ReturnType<typeof serializeBigInt>[0]) => {
                  const amount   = BigInt(entry.amount);
                  const isCredit = amount > 0;
                  return (
                    <tr key={entry.id} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                      <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                        {new Date(entry.createdAt).toLocaleString('id-ID')}
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-xs">{entry.user?.username}</p>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className="text-xs">{entry.type}</Badge>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`font-semibold flex items-center gap-1 ${isCredit ? 'text-green-400' : 'text-red-400'}`}>
                          {isCredit
                            ? <ArrowDownCircle className="h-3 w-3" />
                            : <ArrowUpCircle   className="h-3 w-3" />}
                          {formatCurrency(amount)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground font-mono">
                        {entry.referenceId?.slice(0, 12)}...
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground max-w-xs truncate">
                        {entry.description}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
