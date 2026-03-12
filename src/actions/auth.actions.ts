'use server';

import { z } from 'zod';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';
import { signIn, signOut } from '@/modules/auth/auth';
import { AuthError } from 'next-auth';
import { redirect } from 'next/navigation';

const registerSchema = z.object({
  email:       z.string().email('Invalid email address'),
  username:    z.string().min(3).max(20).regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
  displayName: z.string().min(2).max(50).optional(),
  password:    z.string().min(8, 'Password must be at least 8 characters'),
});

export type ActionResult =
  | { success: true;  data?: unknown }
  | { success: false; error: string };

export async function registerAction(
  prevState: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const raw = {
    email:       formData.get('email')       as string,
    username:    formData.get('username')    as string,
    displayName: formData.get('displayName') as string,
    password:    formData.get('password')    as string,
  };

  const parsed = registerSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0].message };
  }

  const { email, username, displayName, password } = parsed.data;

  const existing = await prisma.user.findFirst({
    where: { OR: [{ email }, { username }] },
    select: { id: true, email: true, username: true },
  });

  if (existing) {
    if (existing.email === email)       return { success: false, error: 'Email already registered' };
    if (existing.username === username) return { success: false, error: 'Username already taken' };
  }

  const passwordHash = await bcrypt.hash(password, 12);

  await prisma.user.create({
    data: {
      email,
      username,
      displayName: displayName || username,
      passwordHash,
      role: 'USER',
    },
  });

  return { success: true };
}

export async function loginAction(
  prevState: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  try {
    await signIn('credentials', {
      email:       formData.get('email')    as string,
      password:    formData.get('password') as string,
      redirectTo:  '/dashboard',
    });
    return { success: true };
  } catch (err) {
    if (err instanceof AuthError) {
      switch (err.type) {
        case 'CredentialsSignin': return { success: false, error: 'Invalid email or password' };
        default:                  return { success: false, error: 'Authentication failed' };
      }
    }
    throw err;
  }
}

export async function logoutAction() {
  await signOut({ redirectTo: '/' });
}
