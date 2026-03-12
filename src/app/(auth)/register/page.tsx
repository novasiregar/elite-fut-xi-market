'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { registerAction } from '@/actions/auth.actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full gold-gradient text-black font-bold h-11" disabled={pending}>
      {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create Account'}
    </Button>
  );
}

export default function RegisterPage() {
  const [state, action] = useActionState(registerAction, null);
  const router = useRouter();

  useEffect(() => {
    if (state?.success) {
      setTimeout(() => router.push('/login?registered=1'), 1500);
    }
  }, [state, router]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Create Account</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Join ELITE FUT XI Market today
        </p>
      </div>

      {state?.success === false && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}
      {state?.success === true && (
        <Alert className="border-green-500/30 bg-green-500/10 text-green-400">
          <CheckCircle2 className="h-4 w-4" />
          <AlertDescription>Account created! Redirecting to login...</AlertDescription>
        </Alert>
      )}

      <form action={action} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" placeholder="you@example.com" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="username">Username</Label>
          <Input id="username" name="username" placeholder="coolseller99" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="displayName">Display Name <span className="text-muted-foreground">(optional)</span></Label>
          <Input id="displayName" name="displayName" placeholder="Your Name" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password <span className="text-xs text-muted-foreground">(min 8 chars)</span></Label>
          <Input id="password" name="password" type="password" placeholder="••••••••" required />
        </div>
        <SubmitButton />
      </form>

      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{' '}
        <Link href="/login" className="text-primary hover:underline font-semibold">Sign in</Link>
      </p>
    </div>
  );
}
