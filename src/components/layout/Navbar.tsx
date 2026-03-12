'use client';

import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Bell, ShoppingBag, LogOut, User, Settings, Shield, Store } from 'lucide-react';
import { logoutAction } from '@/actions/auth.actions';

export function Navbar() {
  const { data: session } = useSession();

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <span className="text-2xl">⚽</span>
          <span className="font-bold text-lg">
            <span className="gold-text">ELITE FUT XI</span>
            <span className="text-muted-foreground text-sm ml-1">Market</span>
          </span>
        </Link>

        {/* Nav Links */}
        <nav className="hidden md:flex items-center gap-6 text-sm">
          <Link href="/listings" className="text-muted-foreground hover:text-foreground transition-colors">
            Browse
          </Link>
          {session?.user && (
            <>
              <Link href="/dashboard" className="text-muted-foreground hover:text-foreground transition-colors">
                Dashboard
              </Link>
              {(session.user.role === 'SELLER' || session.user.role === 'ADMIN') && (
                <Link href="/seller" className="text-muted-foreground hover:text-foreground transition-colors">
                  Seller Hub
                </Link>
              )}
              {session.user.role === 'ADMIN' && (
                <Link href="/admin" className="text-amber-400 hover:text-amber-300 transition-colors flex items-center gap-1">
                  <Shield className="h-3 w-3" /> Admin
                </Link>
              )}
            </>
          )}
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-3">
          {session?.user ? (
            <>
              <Button variant="ghost" size="icon" asChild>
                <Link href="/dashboard/notifications">
                  <Bell className="h-5 w-5" />
                </Link>
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={session.user.image ?? undefined} />
                      <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                        {(session.user.name ?? 'U').charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <p className="font-semibold">{session.user.name}</p>
                    <p className="text-xs text-muted-foreground">{session.user.email}</p>
                    <Badge variant="outline" className="mt-1 text-xs">{session.user.role}</Badge>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard"><User className="mr-2 h-4 w-4" /> Dashboard</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard/wallet"><ShoppingBag className="mr-2 h-4 w-4" /> Wallet</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard/settings"><Settings className="mr-2 h-4 w-4" /> Settings</Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => logoutAction()} className="text-destructive">
                    <LogOut className="mr-2 h-4 w-4" /> Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Button variant="ghost" asChild><Link href="/login">Sign In</Link></Button>
              <Button asChild className="gold-gradient text-black font-semibold">
                <Link href="/register">Get Started</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
