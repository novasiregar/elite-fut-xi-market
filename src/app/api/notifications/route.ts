import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/modules/auth/auth';
import { notificationService } from '@/modules/notification/notification.service';

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = req.nextUrl;
  const page  = Number(searchParams.get('page')  || 1);
  const limit = Number(searchParams.get('limit') || 20);

  const [data, unread] = await Promise.all([
    notificationService.getUserNotifications(session.user.id, page, limit),
    notificationService.getUnreadCount(session.user.id),
  ]);

  return NextResponse.json({ ...data, unread });
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json() as { id?: string; all?: boolean };

  if (body.all) {
    await notificationService.markAllRead(session.user.id);
  } else if (body.id) {
    await notificationService.markRead(body.id, session.user.id);
  }

  return NextResponse.json({ success: true });
}
