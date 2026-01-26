import { supabase, type DBTask, type DBEntry, type DBDayNote, type DBUserSettings } from './supabaseClient';
import { addToOutbox, isOnline } from './outbox';
import type { Task, Entry, DayNote } from './db';

// ============================================
// TASKS
// ============================================

export async function fetchTasks(userId: string): Promise<Task[]> {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('user_id', userId)
    .order('sort_index', { ascending: true });

  if (error) throw error;

  return (data || []).map(dbTaskToTask);
}

export async function fetchActiveTasks(userId: string): Promise<Task[]> {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('user_id', userId)
    .eq('active', true)
    .order('sort_index', { ascending: true });

  if (error) throw error;

  return (data || []).map(dbTaskToTask);
}

export async function upsertTask(userId: string, task: Partial<Task> & { id: string; name: string }): Promise<void> {
  const payload = {
    id: task.id,
    user_id: userId,
    name: task.name,
    category: task.category || null,
    active: task.active ?? true,
    schedule: task.schedule || 'daily',
    sort_index: task.order ?? 0,
    updated_at: new Date().toISOString()
  };

  if (!isOnline()) {
    await addToOutbox('upsert_task', payload);
    return;
  }

  const { error } = await supabase
    .from('tasks')
    .upsert(payload, { onConflict: 'id' });

  if (error) {
    await addToOutbox('upsert_task', payload);
    throw error;
  }
}

export async function deleteTaskRemote(userId: string, taskId: string): Promise<void> {
  const payload = { user_id: userId, task_id: taskId };

  if (!isOnline()) {
    await addToOutbox('delete_task', payload);
    return;
  }

  const { error } = await supabase
    .from('tasks')
    .delete()
    .eq('id', taskId)
    .eq('user_id', userId);

  if (error) {
    await addToOutbox('delete_task', payload);
    throw error;
  }
}

// ============================================
// ENTRIES
// ============================================

export async function fetchEntries(userId: string, startDate?: string, endDate?: string): Promise<Entry[]> {
  let query = supabase
    .from('entries')
    .select('*')
    .eq('user_id', userId);

  if (startDate) {
    query = query.gte('date', startDate);
  }
  if (endDate) {
    query = query.lte('date', endDate);
  }

  const { data, error } = await query;

  if (error) throw error;

  return (data || []).map(dbEntryToEntry);
}

export async function fetchEntriesForDate(userId: string, date: string): Promise<Entry[]> {
  const { data, error } = await supabase
    .from('entries')
    .select('*')
    .eq('user_id', userId)
    .eq('date', date);

  if (error) throw error;

  return (data || []).map(dbEntryToEntry);
}

export async function upsertEntry(
  userId: string,
  taskId: string,
  date: string,
  value: 1 | 0 | null
): Promise<void> {
  const payload = {
    user_id: userId,
    task_id: taskId,
    date,
    value,
    updated_at: new Date().toISOString()
  };

  if (!isOnline()) {
    await addToOutbox('upsert_entry', payload);
    return;
  }

  // First check if entry exists
  const { data: existing } = await supabase
    .from('entries')
    .select('id')
    .eq('user_id', userId)
    .eq('task_id', taskId)
    .eq('date', date)
    .single();

  if (existing) {
    const { error } = await supabase
      .from('entries')
      .update({ value, updated_at: new Date().toISOString() })
      .eq('id', existing.id);

    if (error) {
      await addToOutbox('upsert_entry', payload);
      throw error;
    }
  } else {
    const { error } = await supabase
      .from('entries')
      .insert({
        user_id: userId,
        task_id: taskId,
        date,
        value
      });

    if (error) {
      await addToOutbox('upsert_entry', payload);
      throw error;
    }
  }
}

// ============================================
// DAY NOTES
// ============================================

export async function fetchDayNote(userId: string, date: string): Promise<DayNote | null> {
  const { data, error } = await supabase
    .from('day_notes')
    .select('*')
    .eq('user_id', userId)
    .eq('date', date)
    .single();

  if (error && error.code !== 'PGRST116') throw error;

  return data ? dbDayNoteToNote(data) : null;
}

export async function fetchDayNotes(userId: string, startDate: string, endDate: string): Promise<DayNote[]> {
  const { data, error } = await supabase
    .from('day_notes')
    .select('*')
    .eq('user_id', userId)
    .gte('date', startDate)
    .lte('date', endDate);

  if (error) throw error;

  return (data || []).map(dbDayNoteToNote);
}

export async function upsertDayNote(
  userId: string,
  date: string,
  learnedText: string,
  notesText: string
): Promise<void> {
  const payload = {
    user_id: userId,
    date,
    learned_text: learnedText,
    notes_text: notesText,
    updated_at: new Date().toISOString()
  };

  if (!isOnline()) {
    await addToOutbox('upsert_day_note', payload);
    return;
  }

  // Check if exists
  const { data: existing } = await supabase
    .from('day_notes')
    .select('id')
    .eq('user_id', userId)
    .eq('date', date)
    .single();

  if (existing) {
    const { error } = await supabase
      .from('day_notes')
      .update({
        learned_text: learnedText,
        notes_text: notesText,
        updated_at: new Date().toISOString()
      })
      .eq('id', existing.id);

    if (error) {
      await addToOutbox('upsert_day_note', payload);
      throw error;
    }
  } else {
    const { error } = await supabase
      .from('day_notes')
      .insert({
        user_id: userId,
        date,
        learned_text: learnedText,
        notes_text: notesText
      });

    if (error) {
      await addToOutbox('upsert_day_note', payload);
      throw error;
    }
  }
}

// ============================================
// USER SETTINGS (Motivation Image)
// ============================================

export async function fetchUserSettings(userId: string): Promise<DBUserSettings | null> {
  const { data, error } = await supabase
    .from('user_settings')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error && error.code !== 'PGRST116') throw error;

  return data;
}

export async function updateMotivationImage(userId: string, imageUrl: string | null): Promise<void> {
  const payload = {
    user_id: userId,
    motivation_image_url: imageUrl,
    updated_at: new Date().toISOString()
  };

  if (!isOnline()) {
    await addToOutbox('update_settings', payload);
    return;
  }

  // Check if settings exist
  const { data: existing } = await supabase
    .from('user_settings')
    .select('id')
    .eq('user_id', userId)
    .single();

  if (existing) {
    const { error } = await supabase
      .from('user_settings')
      .update({
        motivation_image_url: imageUrl,
        updated_at: new Date().toISOString()
      })
      .eq('id', existing.id);

    if (error) {
      await addToOutbox('update_settings', payload);
      throw error;
    }
  } else {
    const { error } = await supabase
      .from('user_settings')
      .insert({
        user_id: userId,
        motivation_image_url: imageUrl
      });

    if (error) {
      await addToOutbox('update_settings', payload);
      throw error;
    }
  }
}

// ============================================
// CONVERTERS
// ============================================

function dbTaskToTask(db: DBTask): Task {
  return {
    id: db.id,
    name: db.name,
    category: db.category || undefined,
    active: db.active,
    schedule: db.schedule as 'daily' | 'weekdays' | 'custom',
    order: db.sort_index,
    createdAt: new Date(db.created_at)
  };
}

function dbEntryToEntry(db: DBEntry): Entry {
  return {
    id: parseInt(db.id.slice(0, 8), 16), // Convert UUID to number for compatibility
    date: db.date,
    taskId: db.task_id,
    value: db.value as 1 | 0 | null,
    updatedAt: new Date(db.updated_at)
  };
}

function dbDayNoteToNote(db: DBDayNote): DayNote {
  return {
    date: db.date,
    learnedText: db.learned_text,
    notesText: db.notes_text
  };
}

