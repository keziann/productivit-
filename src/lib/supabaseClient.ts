import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Create a placeholder client if env vars are missing (for build time)
let supabase: SupabaseClient;

if (supabaseUrl && supabaseAnonKey) {
  supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    }
  });
} else {
  // Dummy client for build time - will be replaced at runtime
  supabase = createClient('https://placeholder.supabase.co', 'placeholder-key', {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    }
  });
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

