import { SupabaseClient } from '@supabase/supabase-js';
import Dexie from 'dexie';

// IndexedDB storage for Supabase auth (more reliable on iOS PWA)
class SupabaseStorage extends Dexie {
  auth!: Dexie.Table<{ key: string; value: string }, string>;

  constructor() {
    super('SupabaseAuthStorage');
    this.version(1).stores({
      auth: 'key'
    });
  }
}

const storageDb = new SupabaseStorage();

// Custom storage adapter for Supabase
export const customStorage = {
  getItem: async (key: string): Promise<string | null> => {
    try {
      const item = await storageDb.auth.get(key);
      return item?.value ?? null;
    } catch (error) {
      console.error('Error getting from storage:', error);
      // Fallback to localStorage
      if (typeof window !== 'undefined') {
        return localStorage.getItem(key);
      }
      return null;
    }
  },
  setItem: async (key: string, value: string): Promise<void> => {
    try {
      await storageDb.auth.put({ key, value });
      // Also save to localStorage as backup
      if (typeof window !== 'undefined') {
        localStorage.setItem(key, value);
      }
    } catch (error) {
      console.error('Error setting in storage:', error);
      // Fallback to localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem(key, value);
      }
    }
  },
  removeItem: async (key: string): Promise<void> => {
    try {
      await storageDb.auth.delete(key);
      // Also remove from localStorage
      if (typeof window !== 'undefined') {
        localStorage.removeItem(key);
      }
    } catch (error) {
      console.error('Error removing from storage:', error);
      // Fallback to localStorage
      if (typeof window !== 'undefined') {
        localStorage.removeItem(key);
      }
    }
  }
};

