import { NextResponse } from 'next/server';
import { auth } from '@/modules/auth/auth';
import { walletService } from '@/modules/ledger/wallet.service';
import { ledgerRepository } from '@/modules/ledger/ledger.repository';
import { serializeBigInt } from '@/lib/utils';

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const [balance, { entries, total }] = await Promise.all([
    walletService.getBalance(session.user.id),
    ledgerRepository.findByUser(session.user.id, { page: 1, limit: 20 }),
  ]);

  return NextResponse.json(serializeBigInt({ balance, entries, total }));
}
