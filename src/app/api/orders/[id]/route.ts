import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/modules/auth/auth';
import { orderService } from '@/modules/order/order.service';
import { serializeBigInt } from '@/lib/utils';

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const order = await orderService.getOrderDetail(params.id, session.user.id);
    return NextResponse.json(serializeBigInt(order));
  } catch (err) {
    const message = (err as Error).message;
    const status  = message === 'Order not found' ? 404 : message === 'Unauthorized' ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
