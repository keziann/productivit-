import { supabase } from './supabaseClient';
import {
  getPendingActions,
  removeFromOutbox,
  incrementRetryCount,
  setLastSyncAt,
  type OutboxAction
} from './outbox';

const MAX_RETRIES = 5;
const RETRY_DELAY_BASE = 1000; // 1 second

// Process a single outbox action
async function processAction(action: OutboxAction, userId: string): Promise<boolean> {
  try {
    switch (action.type) {
      case 'upsert_task': {
        const { error } = await supabase
          .from('tasks')
          .upsert(action.payload, { onConflict: 'id' });
        if (error) throw error;
        break;
      }

      case 'delete_task': {
        const { error } = await supabase
          .from('tasks')
          .delete()
          .eq('id', action.payload.task_id)
          .eq('user_id', action.payload.user_id);
        if (error) throw error;
        break;
      }

      case 'upsert_entry': {
        const { user_id, task_id, date, value } = action.payload as {
          user_id: string;
          task_id: string;
          date: string;
          value: number | null;
        };

        // Check if exists
        const { data: existing } = await supabase
          .from('entries')
          .select('id')
          .eq('user_id', user_id)
          .eq('task_id', task_id)
          .eq('date', date)
          .single();

        if (existing) {
          const { error } = await supabase
            .from('entries')
            .update({ value, updated_at: new Date().toISOString() })
            .eq('id', existing.id);
          if (error) throw error;
        } else {
          const { error } = await supabase
            .from('entries')
            .insert({ user_id, task_id, date, value });
          if (error) throw error;
        }
        break;
      }

      case 'upsert_day_note': {
        const { user_id, date, learned_text, notes_text } = action.payload as {
          user_id: string;
          date: string;
          learned_text: string;
          notes_text: string;
        };

        const { data: existing } = await supabase
          .from('day_notes')
          .select('id')
          .eq('user_id', user_id)
          .eq('date', date)
          .single();

        if (existing) {
          const { error } = await supabase
            .from('day_notes')
            .update({ learned_text, notes_text, updated_at: new Date().toISOString() })
            .eq('id', existing.id);
          if (error) throw error;
        } else {
          const { error } = await supabase
            .from('day_notes')
            .insert({ user_id, date, learned_text, notes_text });
          if (error) throw error;
        }
        break;
      }

      case 'update_settings': {
        const { user_id, motivation_image_url } = action.payload as {
          user_id: string;
          motivation_image_url: string | null;
        };

        const { data: existing } = await supabase
          .from('user_settings')
          .select('id')
          .eq('user_id', user_id)
          .single();

        if (existing) {
          const { error } = await supabase
            .from('user_settings')
            .update({ motivation_image_url, updated_at: new Date().toISOString() })
            .eq('id', existing.id);
          if (error) throw error;
        } else {
          const { error } = await supabase
            .from('user_settings')
            .insert({ user_id, motivation_image_url });
          if (error) throw error;
        }
        break;
      }
    }

    return true;
  } catch (error) {
    console.error(`Failed to process action ${action.type}:`, error);
    return false;
  }
}

// Flush all pending actions
export async function flushOutbox(userId: string): Promise<{ success: number; failed: number }> {
  const actions = await getPendingActions();
  let success = 0;
  let failed = 0;

  for (const action of actions) {
    if (action.retryCount >= MAX_RETRIES) {
      // Too many retries, remove from outbox
      await removeFromOutbox(action.id!);
      failed++;
      continue;
    }

    const ok = await processAction(action, userId);

    if (ok) {
      await removeFromOutbox(action.id!);
      success++;
    } else {
      await incrementRetryCount(action.id!);
      failed++;
      // Exponential backoff
      await new Promise(r => setTimeout(r, RETRY_DELAY_BASE * Math.pow(2, action.retryCount)));
    }
  }

  if (success > 0) {
    setLastSyncAt(new Date());
  }

  return { success, failed };
}

