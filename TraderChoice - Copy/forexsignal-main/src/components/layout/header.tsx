'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/auth-provider';
import { UserNav } from '@/components/auth/user-nav';
import { Logo } from '@/components/logo';
import { Menu, X } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger, SheetClose } from '@/components/ui/sheet';
import { usePathname } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';

export function Header() {
  const { user, loading } = useAuth();
  const [isScrolled, setIsScrolled] = useState(false);
  const pathname = usePathname();
  
  const isHomePage = pathname === '/';

  useEffect(() => {
    // Debounced scroll listener for performance
    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = window.requestAnimationFrame(() => {
        setIsScrolled(window.scrollY > 10);
        raf = 0;
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    // Initial states
    onScroll();
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [isHomePage, pathname]);

  const navLinks = [
    { href: "/features", label: "Features" },
    { href: "/signals", label: "Signals" },
    { href: "/pricing", label: "Pricing" },
    { href: "/about", label: "About" },
    { href: "/contact", label: "Contact" },
  ];
  
  const headerClasses = cn(
    // non-sticky header with smooth color transitions
    "relative z-[1100] transition-colors duration-200",
    isHomePage && !isScrolled ? "bg-black/35" : "bg-white/95 shadow-md backdrop-blur-sm",
    isScrolled ? "shadow-[0_6px_14px_rgba(0,0,0,0.12)]" : ""
  );
  
  const linkClasses = cn(
      "text-sm font-semibold tracking-wide transition-colors",
      // ensure high contrast across backgrounds
      (isHomePage && !isScrolled) ? "text-white hover:text-white" : "text-foreground hover:text-primary"
  );

  const mobileLinkClasses = cn(
      // Sheet uses bg-card (light) so use dark/high-contrast text
      "text-foreground hover:text-primary transition-colors"
  );

  const mobileTriggerClasses = cn(
      isHomePage && !isScrolled ? "text-white hover:bg-white/10 hover:text-white" : "text-primary"
  )

  const logoClasses = cn(
    isHomePage && !isScrolled ? "text-white" : "text-primary"
  )
  
  const loginButtonClasses = cn(
      isScrolled || !isHomePage ? "" : "text-white hover:bg-white/10 hover:text-white"
  )

  return (
    <header id="site-header" className={headerClasses}>
      <div className="container mx-auto flex h-20 items-center justify-between px-4 md:px-6">
        <Link href="/" aria-label="Trader Choice Home">
          <Logo className={logoClasses} />
        </Link>
        <nav className="hidden items-center gap-6 md:flex">
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href} className={linkClasses}>
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-2">
            {loading ? (
              <Skeleton className="h-10 w-28" />
            ) : user ? (
              <UserNav />
            ) : (
              <>
                <Button variant="ghost" asChild className={loginButtonClasses}>
                  <Link href="/login">Login</Link>
                </Button>
                <Button asChild>
                  <Link href="/signup">Sign Up</Link>
                </Button>
              </>
            )}
          </div>
          
          {/* Mobile Menu */}
          <div className="md:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className={mobileTriggerClasses}>
                  <Menu className="h-6 w-6" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-full max-w-sm bg-card">
                <div className="flex flex-col h-full">
                  <div className="flex justify-between items-center border-b pb-4">
                    <Link href="/" aria-label="Trader Choice Home">
                        <Logo />
                    </Link>
                    <SheetClose asChild>
                         <Button variant="ghost" size="icon">
                            <X className="h-6 w-6" />
                            <span className="sr-only">Close menu</span>
                        </Button>
                    </SheetClose>
                  </div>
                  <nav className="flex flex-col gap-6 text-lg font-medium mt-8">
                    {navLinks.map((link) => (
                      <SheetClose asChild key={link.href}>
                        <Link href={link.href} className={mobileLinkClasses}>
                          {link.label}
                        </Link>
                      </SheetClose>
                    ))}
                  </nav>
                  <div className="mt-auto pt-8 border-t">
                     {loading ? (
                        <div className="h-10 w-full animate-pulse rounded-md bg-muted/50" />
                      ) : user ? (
                        <div className="flex flex-col gap-4">
                          <p className="text-center text-muted-foreground">{user.email}</p>
                          <SheetClose asChild>
                            <Button asChild className="w-full">
                              <Link href={user.role === 'admin' ? '/admin' : '/dashboard'}>Dashboard</Link>
                            </Button>
                          </SheetClose>
                        </div>
                      ) : (
                        <div className="flex flex-col gap-4">
                          <SheetClose asChild>
                            <Button asChild variant="outline" className="w-full">
                              <Link href="/login">Login</Link>
                            </Button>
                          </SheetClose>
                          <SheetClose asChild>
                          <Button asChild className="w-full">
                            <Link href="/signup">Sign Up</Link>
                          </Button>
                          </SheetClose>
                        </div>
                      )}
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
           {user && !loading && <div className="md:hidden"><UserNav /></div>}
        </div>
      </div>
    </header>
  );
}
