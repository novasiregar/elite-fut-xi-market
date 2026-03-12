import { NextResponse } from 'next/server';
import { auth } from '@/modules/auth/auth';
import { adminService } from '@/modules/admin/admin.service';
import { serializeBigInt } from '@/lib/utils';

export async function GET() {
  const session = await auth();
  if (!session?.user || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const metrics = await adminService.getDashboardMetrics();
  return NextResponse.json(serializeBigInt(metrics));
}
