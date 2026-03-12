import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/modules/auth/auth';
import { orderService } from '@/modules/order/order.service';
import { serializeBigInt } from '@/lib/utils';

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = req.nextUrl;
  const page  = Number(searchParams.get('page')  || 1);
  const limit = Number(searchParams.get('limit') || 10);
  const role  = searchParams.get('role') || 'buyer';

  const result = role === 'seller'
    ? await orderService.getSellerOrders(session.user.id, page, limit)
    : await orderService.getBuyerOrders(session.user.id, page, limit);

  return NextResponse.json(serializeBigInt(result));
}
