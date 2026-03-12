import { auth } from './auth';
import { redirect } from 'next/navigation';
import type { Role } from '@prisma/client';

export type SessionUser = {
  id:       string;
  email:    string;
  name?:    string | null;
  image?:   string | null;
  username: string;
  role:     Role;
};

/**
 * Get current session user. Returns null if not authenticated.
 */
export async function getSessionUser(): Promise<SessionUser | null> {
  const session = await auth();
  if (!session?.user) return null;
  return session.user as SessionUser;
}

/**
 * Get current session user or redirect to login.
 */
export async function requireAuth(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) redirect('/login');
  return user;
}

/**
 * Require a specific role. Redirects if unauthorized.
 */
export async function requireRole(
  ...roles: Role[]
): Promise<SessionUser> {
  const user = await requireAuth();
  if (!roles.includes(user.role)) {
    redirect('/dashboard?error=unauthorized');
  }
  return user;
}

/**
 * Check if current user is admin.
 */
export async function requireAdmin(): Promise<SessionUser> {
  return requireRole('ADMIN');
}

/**
 * Check if current user is approved seller.
 */
export async function requireSeller(): Promise<SessionUser> {
  const user = await requireAuth();
  if (user.role !== 'SELLER' && user.role !== 'ADMIN') {
    redirect('/seller/verification?error=not_verified');
  }
  return user;
}

/**
 * RBAC helper — check if a role has permission.
 */
export function hasPermission(userRole: Role, allowedRoles: Role[]): boolean {
  return allowedRoles.includes(userRole);
}
