import { auth } from '@/modules/auth/auth';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Routes that require authentication
const PROTECTED_PATTERNS = [
  '/dashboard',
  '/seller',
  '/admin',
  '/checkout',
  '/orders',
  '/disputes',
];

// Routes only for admins
const ADMIN_ONLY = ['/admin'];

// Routes only for sellers
const SELLER_ONLY = ['/seller/listings/new', '/seller/listings/:id/edit'];

export default auth((req: NextRequest & { auth: { user?: { role?: string } } | null }) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;

  const isProtected = PROTECTED_PATTERNS.some((p) =>
    pathname.startsWith(p)
  );

  if (isProtected && !session?.user) {
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (session?.user) {
    const isAdminRoute = ADMIN_ONLY.some((p) => pathname.startsWith(p));
    if (isAdminRoute && session.user.role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api/webhooks).*)',
  ],
};
