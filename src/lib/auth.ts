'use client';

import { supabase } from './supabaseClient';
import type { User, Session } from '@supabase/supabase-js';

export async function signInWithMagicLink(email: string): Promise<{ error: Error | null }> {
  try {
    const { error, data } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: typeof window !== 'undefined' 
          ? `${window.location.origin}/auth/callback`
          : undefined
      }
    });
    
    if (error) {
      console.error('Erreur Supabase auth:', error);
      return { error: new Error(error.message || 'Erreur de connexion') };
    }
    
    return { error: null };
  } catch (err) {
    console.error('Erreur lors de l\'envoi du magic link:', err);
    return { 
      error: err instanceof Error 
        ? err 
        : new Error('Erreur réseau. Vérifiez votre connexion.') 
    };
  }
}

export async function signOut(): Promise<void> {
  await supabase.auth.signOut();
}

export async function getSession(): Promise<Session | null> {
  const { data: { session } } = await supabase.auth.getSession();
  return session;
}

export async function getUser(): Promise<User | null> {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export function onAuthStateChange(callback: (user: User | null) => void) {
  return supabase.auth.onAuthStateChange((event, session) => {
    callback(session?.user ?? null);
  });
}

