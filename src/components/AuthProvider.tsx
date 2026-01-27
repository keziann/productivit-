'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import type { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabaseClient';
import { getPendingCount, getLastSyncAt, isOnline } from '@/lib/outbox';
import { flushOutbox } from '@/lib/sync';
import type { SyncStatus } from '@/lib/outbox';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  syncStatus: SyncStatus;
  forceSync: () => Promise<void>;
  refreshSyncStatus: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    isOnline: true,
    pendingCount: 0,
    lastSyncAt: null,
    error: null
  });
  const router = useRouter();
  const pathname = usePathname();

  // Refresh sync status
  const refreshSyncStatus = useCallback(async () => {
    const pending = await getPendingCount();
    const lastSync = getLastSyncAt();
    const online = isOnline();
    
    setSyncStatus(prev => ({
      ...prev,
      isOnline: online,
      pendingCount: pending,
      lastSyncAt: lastSync
    }));
  }, []);

  // Force sync
  const forceSync = useCallback(async () => {
    if (!user) return;
    
    setSyncStatus(prev => ({ ...prev, error: null }));
    
    try {
      const result = await flushOutbox(user.id);
      await refreshSyncStatus();
      
      if (result.failed > 0) {
        setSyncStatus(prev => ({ 
          ...prev, 
          error: `${result.failed} action(s) en échec` 
        }));
      }
    } catch (error) {
      setSyncStatus(prev => ({ 
        ...prev, 
        error: 'Erreur de synchronisation' 
      }));
    }
  }, [user, refreshSyncStatus]);

  // Auth state listener
  useEffect(() => {
    // Handle hash fragments from Supabase callback
    const handleHash = async () => {
      if (typeof window !== 'undefined' && window.location.hash) {
        const hash = window.location.hash.substring(1);
        const params = new URLSearchParams(hash.split('?')[1] || hash);
        const access_token = params.get('access_token');
        const refresh_token = params.get('refresh_token');
        
        if (access_token && refresh_token) {
          const { data: { session }, error } = await supabase.auth.setSession({
            access_token,
            refresh_token
          });
          
          if (session && !error) {
            // Clear hash and redirect
            window.history.replaceState(null, '', '/');
            setUser(session.user);
            setIsLoading(false);
            router.push('/');
            return;
          }
        }
      }
    };

    handleHash();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null);
        setIsLoading(false);

        if (event === 'SIGNED_IN' && session?.user) {
          // Clear any hash fragments
          if (typeof window !== 'undefined' && window.location.hash) {
            window.history.replaceState(null, '', '/');
          }
          if (pathname === '/login' || pathname === '/auth/callback') {
            router.push('/');
          }
        }

        if (!session?.user && pathname !== '/login' && pathname !== '/auth/callback') {
          router.push('/login');
        }
      }
    );

    // Initial session check - with retry for PWA
    const checkSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Erreur récupération session:', error);
        }
        
        setUser(session?.user ?? null);
        setIsLoading(false);
        
        if (session?.user) {
          // User is logged in
          if (pathname === '/login' || pathname === '/auth/callback') {
            router.push('/');
          }
        } else {
          // No session
          if (pathname !== '/login' && pathname !== '/auth/callback') {
            router.push('/login');
          }
        }
      } catch (err) {
        console.error('Erreur lors de la vérification de session:', err);
        setIsLoading(false);
        if (pathname !== '/login') {
          router.push('/login');
        }
      }
    };

    // Check immediately
    checkSession();
    
    // Also check after a short delay (for PWA localStorage initialization)
    const timeoutId = setTimeout(checkSession, 500);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeoutId);
    };
  }, [router, pathname]);

  // Online/offline listener
  useEffect(() => {
    const handleOnline = () => {
      setSyncStatus(prev => ({ ...prev, isOnline: true }));
      if (user) {
        forceSync();
      }
    };

    const handleOffline = () => {
      setSyncStatus(prev => ({ ...prev, isOnline: false }));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial status
    refreshSyncStatus();

    // Periodic sync check
    const interval = setInterval(() => {
      refreshSyncStatus();
      if (user && isOnline()) {
        forceSync();
      }
    }, 30000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, [user, forceSync, refreshSyncStatus]);

  // Show loading screen
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center animate-pulse">
            <span className="text-white font-bold text-xl">HT</span>
          </div>
          <p className="text-muted-foreground text-sm">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, syncStatus, forceSync, refreshSyncStatus }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

