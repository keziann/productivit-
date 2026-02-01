import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { customStorage } from './supabaseStorage';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Validate environment variables
if (typeof window !== 'undefined' && (!supabaseUrl || !supabaseAnonKey)) {
  console.error('❌ Variables d\'environnement Supabase manquantes !');
  console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅' : '❌');
  console.error('NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseAnonKey ? '✅' : '❌');
}

// Create Supabase client
let supabase: SupabaseClient;

if (supabaseUrl && supabaseAnonKey) {
  supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storage: customStorage, // Use IndexedDB for better iOS PWA support
      storageKey: 'sb-auth-token'
    }
  });
} else {
  // Dummy client for build time - will fail at runtime if env vars missing
  supabase = createClient(
    'https://placeholder.supabase.co', 
    'placeholder-key', 
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      }
    }
  );
}

export { supabase };

// Types for database
export interface DBTask {
  id: string;
  user_id: string;
  name: string;
  category: string | null;
  active: boolean;
  schedule: string;
  sort_index: number;
  allow_partial: boolean;
  created_at: string;
  updated_at: string;
}

export interface DBEntry {
  id: string;
  user_id: string;
  task_id: string;
  date: string;
  value: number | null;
  updated_at: string;
}

export interface DBDayNote {
  id: string;
  user_id: string;
  date: string;
  learned_text: string;
  notes_text: string;
  updated_at: string;
}

export interface DBUserSettings {
  id: string;
  user_id: string;
  motivation_image_url: string | null;
  updated_at: string;
}

