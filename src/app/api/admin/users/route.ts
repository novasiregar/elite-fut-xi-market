import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/modules/auth/auth';
import { adminService } from '@/modules/admin/admin.service';

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { searchParams } = req.nextUrl;
  const page   = Number(searchParams.get('page')   || 1);
  const limit  = Number(searchParams.get('limit')  || 20);
  const search = searchParams.get('search') || undefined;

  const result = await adminService.getUsers(page, limit, search);
  return NextResponse.json(result);
}
