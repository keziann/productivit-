'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { LayoutDashboard, Calendar, ListTodo, Settings, Moon, Sun, CloudOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';
import { useAuth } from './AuthProvider';

const navItems = [
  { href: '/', label: 'Accueil', icon: LayoutDashboard },
  { href: '/week', label: 'Semaine', icon: Calendar },
  { href: '/tasks', label: 'Tâches', icon: ListTodo },
  { href: '/settings', label: 'Réglages', icon: Settings },
];

export function Navbar() {
  const pathname = usePathname();
  const [isDark, setIsDark] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    setIsOnline(navigator.onLine);
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    const dark = localStorage.getItem('theme') === 'dark' ||
      (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
    setIsDark(dark);
    document.documentElement.classList.toggle('dark', dark);
  }, []);

  const toggleTheme = () => {
    const newDark = !isDark;
    setIsDark(newDark);
    localStorage.setItem('theme', newDark ? 'dark' : 'light');
    document.documentElement.classList.toggle('dark', newDark);
  };

  // Don't show navbar on login page
  if (pathname === '/login' || pathname === '/auth/callback') {
    return null;
  }

  // Don't show navbar if not logged in
  if (!isAuthenticated) {
    return null;
  }

  return (
    <>
      {/* Desktop navbar */}
      <nav className="hidden md:flex fixed top-0 left-0 right-0 h-16 bg-background/80 backdrop-blur-xl border-b border-border/50 z-50">
        <div className="max-w-6xl mx-auto w-full flex items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <span className="text-white font-bold text-sm">HT</span>
            </div>
            <span className="font-bold text-lg">Habit Tracker</span>

            {/* Offline indicator */}
            {!isOnline && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400">
                <CloudOff className="w-3.5 h-3.5" />
                <span className="text-xs font-medium">Hors ligne</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-1">
            {navItems.map(({ href, label, icon: Icon }) => (
              <Link key={href} href={href}>
                <Button
                  variant={pathname === href ? 'default' : 'ghost'}
                  size="sm"
                  className={cn(
                    'gap-2 rounded-xl h-10',
                    pathname === href && 'shadow-md'
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </Button>
              </Link>
            ))}
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="rounded-xl h-10 w-10"
            onClick={toggleTheme}
          >
            {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </Button>
        </div>
      </nav>

      {/* Mobile bottom navbar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-xl border-t border-border/50 z-50">
        <div
          className="flex items-stretch h-[70px] px-2"
          style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
        >
          {navItems.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href;
            return (
              <Link key={href} href={href} className="flex-1">
                <div
                  className={cn(
                    'flex flex-col items-center justify-center h-full gap-1 relative',
                    'transition-all duration-200 touch-manipulation',
                    isActive ? 'text-primary' : 'text-muted-foreground'
                  )}
                >
                  {/* Active indicator */}
                  {isActive && (
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-primary rounded-b-full" />
                  )}
                  <div className={cn(
                    'flex items-center justify-center w-10 h-10 rounded-xl transition-all',
                    isActive && 'bg-primary/10 scale-110'
                  )}>
                    <Icon className={cn('w-5 h-5', isActive && 'text-primary')} />
                  </div>
                  <span className={cn(
                    'text-[10px] font-medium',
                    isActive && 'text-primary font-semibold'
                  )}>
                    {label}
                  </span>
                </div>
              </Link>
            );
          })}
          <button
            onClick={toggleTheme}
            className="flex-1 flex flex-col items-center justify-center gap-1 text-muted-foreground touch-manipulation"
          >
            <div className="flex items-center justify-center w-10 h-10 rounded-xl">
              {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </div>
            <span className="text-[10px] font-medium">Thème</span>
          </button>
        </div>

        {/* Offline banner for mobile */}
        {!isOnline && (
          <div className="absolute -top-8 left-0 right-0 bg-yellow-500 text-yellow-900 text-xs text-center py-2 font-medium flex items-center justify-center gap-1.5">
            <CloudOff className="w-3.5 h-3.5" />
            Mode hors ligne
          </div>
        )}
      </nav>

      {/* Spacers */}
      <div className="hidden md:block h-16" />
      <div className="md:hidden h-0" />
    </>
  );
}
