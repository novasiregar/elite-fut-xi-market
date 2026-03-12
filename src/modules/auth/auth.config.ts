import type { NextAuthConfig } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';

const loginSchema = z.object({
  email:    z.string().email(),
  password: z.string().min(8),
});

export const authConfig: NextAuthConfig = {
  providers: [
    Credentials({
      name: 'credentials',
      credentials: {
        email:    { label: 'Email',    type: 'email'    },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const { email, password } = parsed.data;

        const user = await prisma.user.findUnique({
          where: { email },
          select: {
            id:           true,
            email:        true,
            username:     true,
            displayName:  true,
            passwordHash: true,
            role:         true,
            avatarUrl:    true,
            isActive:     true,
            isBanned:     true,
          },
        });

        if (!user || !user.passwordHash) return null;
        if (!user.isActive || user.isBanned) return null;

        const isValid = await bcrypt.compare(password, user.passwordHash);
        if (!isValid) return null;

        return {
          id:          user.id,
          email:       user.email,
          name:        user.displayName ?? user.username,
          image:       user.avatarUrl,
          username:    user.username,
          role:        user.role,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id       = user.id;
        token.username = (user as { username: string }).username;
        token.role     = (user as { role: string }).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id       = token.id       as string;
        session.user.username = token.username as string;
        session.user.role     = token.role     as string;
      }
      return session;
    },
  },
  pages: {
    signIn:  '/login',
    signOut: '/',
    error:   '/login',
  },
  session: { strategy: 'jwt' },
};
