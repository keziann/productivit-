'use client';

import { supabase } from './supabaseClient';
import type { User, Session } from '@supabase/supabase-js';

export async function signInWithPassword(email: string, password: string): Promise<{ error: Error | null }> {
  try {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (error) {
      console.error('Erreur Supabase auth:', error);
      return { error: new Error(error.message || 'Email ou mot de passe incorrect') };
    }
    
    return { error: null };
  } catch (err) {
    console.error('Erreur lors de la connexion:', err);
    return { 
      error: err instanceof Error 
        ? err 
        : new Error('Erreur réseau. Vérifiez votre connexion.') 
    };
  }
}

export async function signUp(email: string, password: string): Promise<{ error: Error | null }> {
  try {
    const { error } = await supabase.auth.signUp({
      email,
      password
    });
    
    if (error) {
      console.error('Erreur Supabase signup:', error);
      return { error: new Error(error.message || 'Erreur lors de l\'inscription') };
    }
    
    return { error: null };
  } catch (err) {
    console.error('Erreur lors de l\'inscription:', err);
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

