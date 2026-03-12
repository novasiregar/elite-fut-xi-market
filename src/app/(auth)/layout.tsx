import Link from 'next/link';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Left branding panel */}
      <div className="hidden lg:flex flex-col justify-between p-12 bg-gradient-to-br from-amber-500/10 via-card to-card border-r border-border">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-3xl">⚽</span>
          <span className="font-black text-xl gold-text">ELITE FUT XI</span>
        </Link>
        <div>
          <blockquote className="text-2xl font-bold leading-tight mb-4">
            &ldquo;The safest place to buy and sell football game accounts.&rdquo;
          </blockquote>
          <p className="text-muted-foreground text-sm">
            Every transaction protected by our escrow ledger system.
          </p>
        </div>
        <p className="text-xs text-muted-foreground">&copy; {new Date().getFullYear()} ELITE FUT XI Market</p>
      </div>

      {/* Right form panel */}
      <div className="flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {children}
        </div>
      </div>
    </div>
  );
}
