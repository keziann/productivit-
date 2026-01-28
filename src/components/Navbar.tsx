'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { LayoutDashboard, Calendar, ListTodo, Settings, Moon, Sun, CloudOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';
import { useAuth } from './AuthProvider';

const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
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
      <nav className="hidden md:flex fixed top-0 left-0 right-0 h-16 bg-background/80 backdrop-blur-lg border-b border-border z-50">
        <div className="max-w-6xl mx-auto w-full flex items-center justify-between px-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
              <span className="text-white font-bold text-sm">HT</span>
            </div>
            <span className="font-semibold text-lg">Habit Tracker</span>
            
            {/* Offline indicator */}
            {!isOnline && (
              <span className="flex items-center gap-1 text-xs text-yellow-600 dark:text-yellow-400 ml-2">
                <CloudOff className="w-3 h-3" />
                Hors ligne
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-1">
            {navItems.map(({ href, label, icon: Icon }) => (
              <Link key={href} href={href}>
                <Button
                  variant={pathname === href ? 'secondary' : 'ghost'}
                  size="sm"
                  className={cn(
                    'gap-2',
                    pathname === href && 'bg-secondary'
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </Button>
              </Link>
            ))}
          </div>

          <Button variant="ghost" size="icon" onClick={toggleTheme}>
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </Button>
        </div>
      </nav>

      {/* Mobile bottom navbar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-background/95 backdrop-blur-lg border-t border-border z-50 safe-area-bottom">
        <div className="flex items-center justify-around h-full px-2">
          {navItems.slice(0, 4).map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href} className="flex-1">
              <div
                className={cn(
                  'flex flex-col items-center justify-center gap-0.5 py-2 rounded-lg transition-colors',
                  pathname === href 
                    ? 'text-emerald-600 dark:text-emerald-400' 
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <Icon className="w-5 h-5" />
                <span className="text-[10px] font-medium">{label}</span>
              </div>
            </Link>
          ))}
          <button
            onClick={toggleTheme}
            className="flex flex-col items-center justify-center gap-0.5 py-2 px-3 text-muted-foreground"
          >
            {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            <span className="text-[10px] font-medium">Thème</span>
          </button>
        </div>
        
        {/* Offline banner for mobile */}
        {!isOnline && (
          <div className="absolute -top-6 left-0 right-0 bg-yellow-500 text-yellow-900 text-xs text-center py-1">
            <CloudOff className="w-3 h-3 inline mr-1" />
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
