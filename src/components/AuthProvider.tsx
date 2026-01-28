'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  isLoading: true,
  logout: () => {}
});

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  // Check authentication on mount
  useEffect(() => {
    const checkAuth = () => {
      const isAuth = localStorage.getItem('habit-tracker-auth') === 'true';
      setIsAuthenticated(isAuth);
      setIsLoading(false);

      // Redirect logic
      if (isAuth && pathname === '/login') {
        router.push('/');
      } else if (!isAuth && pathname !== '/login') {
        router.push('/login');
      }
    };

    checkAuth();

    // Listen for storage changes (in case of logout in another tab)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'habit-tracker-auth') {
        checkAuth();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [router, pathname]);

  const logout = useCallback(() => {
    localStorage.removeItem('habit-tracker-auth');
    setIsAuthenticated(false);
    router.push('/login');
  }, [router]);

  // Show loading screen
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center animate-pulse">
            <span className="text-white font-bold text-2xl">HT</span>
          </div>
          <p className="text-muted-foreground text-sm">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, isLoading, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
