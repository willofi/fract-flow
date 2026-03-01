'use client';

import Link from 'next/link';
import { BrainCircuit, LogOut, LayoutDashboard, Plus, CloudCheck, CloudUpload } from 'lucide-react';
import { ModeToggle } from '@/components/mode-toggle';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { useMindMapStore } from '@/store/useMindMapStore';

export function Header() {
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();
  const pathname = usePathname();
  const { isSaving } = useMindMapStore();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  };

  const isMapPage = pathname.startsWith('/map');

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className={`container mx-auto h-16 flex items-center transition-all duration-300 ${isMapPage ? 'px-4 md:px-12 max-w-[none]' : 'px-4 md:px-8'}`}>
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2 transition-opacity hover:opacity-80">
            <BrainCircuit className="h-7 w-7 text-primary" />
            <span className="text-xl font-black tracking-tight">MindMap AI</span>
          </Link>
          
          {isMapPage && (
            <div className="flex items-center gap-2 px-3 py-1 bg-muted/40 rounded-full border border-border/40 transition-all duration-300">
              {isSaving ? (
                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-primary">
                  <CloudUpload className="h-3.5 w-3.5 animate-bounce" />
                  <span className="animate-pulse">Syncing</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground/80">
                  <CloudCheck className="h-3.5 w-3.5 text-green-500/80" />
                  <span>Saved</span>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex-1" />

        <nav className="flex items-center gap-2 md:gap-4">
          <ModeToggle />
          
          {user ? (
            <>
              <Link href="/">
                <Button variant="ghost" size="sm" className={pathname === '/' ? "bg-accent" : ""}>
                  <LayoutDashboard className="mr-2 h-4 w-4" />
                  <span className="hidden md:inline">Dashboard</span>
                </Button>
              </Link>
              <Link href="/map/new">
                <Button variant="ghost" size="sm">
                  <Plus className="mr-2 h-4 w-4" />
                  <span className="hidden md:inline">New Map</span>
                </Button>
              </Link>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </Button>
            </>
          ) : (
            <>
              <Link href="/login">
                <Button variant="ghost" size="sm" className="font-bold">
                  Sign In
                </Button>
              </Link>
              <Link href="/login">
                <Button size="sm" className="font-bold rounded-xl px-5">
                  Get Started
                </Button>
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
