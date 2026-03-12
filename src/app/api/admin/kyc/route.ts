import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/modules/auth/auth';
import { adminService } from '@/modules/admin/admin.service';

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const page  = Number(req.nextUrl.searchParams.get('page')  || 1);
  const limit = Number(req.nextUrl.searchParams.get('limit') || 20);

  const result = await adminService.getPendingKyc(page, limit);
  return NextResponse.json(result);
}
