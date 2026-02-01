import Dexie, { type EntityTable } from 'dexie';

// Types
export interface Task {
  id: string;
  name: string;
  category?: string;
  active: boolean;
  schedule: 'daily' | 'weekdays' | 'custom';
  order: number;
  createdAt: Date;
  allowPartial?: boolean; // Si true, permet une valeur intermédiaire (orange)
}

export interface Entry {
  id?: number;
  date: string; // YYYY-MM-DD
  taskId: string;
  value: 1 | 0.5 | 0 | null; // 1=fait, 0.5=partiel (orange), 0=raté, null=non renseigné
  updatedAt: Date;
}

export interface DayNote {
  date: string; // YYYY-MM-DD
  learnedText: string;
  notesText: string;
}

// Database class
class HabitTrackerDB extends Dexie {
  tasks!: EntityTable<Task, 'id'>;
  entries!: EntityTable<Entry, 'id'>;
  dayNotes!: EntityTable<DayNote, 'date'>;

  constructor() {
    super('HabitTrackerDB');
    this.version(1).stores({
      tasks: 'id, name, category, active, order, createdAt',
      entries: '++id, date, taskId, [date+taskId]',
      dayNotes: 'date'
    });
  }
}

export const db = new HabitTrackerDB();

// Seed initial tasks
const SEED_TASKS = [
  'Dormir 23:00',
  'Réveil 08:00',
  'Méditation',
  'Douche froide',
  'Deep work 4h',
  'Sport',
  'Apprendre',
  'Tracking',
  'Compléments',
  'Manger sain',
  'Planifier journée/semaine',
  'Tâche 1',
  'Tâche 2'
];

export async function initializeDB() {
  const taskCount = await db.tasks.count();
  if (taskCount === 0) {
    const tasks: Task[] = SEED_TASKS.map((name, index) => ({
      id: crypto.randomUUID(),
      name,
      active: true,
      schedule: 'daily' as const,
      order: index,
      createdAt: new Date()
    }));
    await db.tasks.bulkAdd(tasks);
  }
}

// Task operations
export async function getTasks(activeOnly = true): Promise<Task[]> {
  const allTasks = await db.tasks.orderBy('order').toArray();
  if (activeOnly) {
    return allTasks.filter(task => task.active === true);
  }
  return allTasks;
}

export async function getAllTasks(): Promise<Task[]> {
  return db.tasks.orderBy('order').toArray();
}

export async function addTask(name: string, category?: string): Promise<Task> {
  const maxOrder = await db.tasks.orderBy('order').last();
  const task: Task = {
    id: crypto.randomUUID(),
    name,
    category,
    active: true,
    schedule: 'daily',
    order: (maxOrder?.order ?? -1) + 1,
    createdAt: new Date()
  };
  await db.tasks.add(task);
  return task;
}

export async function updateTask(id: string, updates: Partial<Task>): Promise<void> {
  await db.tasks.update(id, updates);
}

export async function deleteTask(id: string): Promise<void> {
  await db.tasks.delete(id);
  await db.entries.where('taskId').equals(id).delete();
}

export async function reorderTasks(taskIds: string[]): Promise<void> {
  await db.transaction('rw', db.tasks, async () => {
    for (let i = 0; i < taskIds.length; i++) {
      await db.tasks.update(taskIds[i], { order: i });
    }
  });
}

// Entry operations
export async function getEntry(date: string, taskId: string): Promise<Entry | undefined> {
  return db.entries.where('[date+taskId]').equals([date, taskId]).first();
}

export async function getEntriesForDate(date: string): Promise<Entry[]> {
  return db.entries.where('date').equals(date).toArray();
}

export async function getEntriesForDateRange(startDate: string, endDate: string): Promise<Entry[]> {
  return db.entries.where('date').between(startDate, endDate, true, true).toArray();
}

export async function upsertEntry(date: string, taskId: string, value: 1 | 0 | null): Promise<void> {
  const existing = await getEntry(date, taskId);
  if (existing) {
    await db.entries.update(existing.id!, { value, updatedAt: new Date() });
  } else {
    await db.entries.add({ date, taskId, value, updatedAt: new Date() });
  }
}

// DayNote operations
export async function getDayNote(date: string): Promise<DayNote | undefined> {
  return db.dayNotes.get(date);
}

export async function getDayNotesForDateRange(startDate: string, endDate: string): Promise<DayNote[]> {
  return db.dayNotes.where('date').between(startDate, endDate, true, true).toArray();
}

export async function upsertDayNote(date: string, learnedText: string, notesText: string): Promise<void> {
  await db.dayNotes.put({ date, learnedText, notesText });
}

// Export/Import
export interface ExportData {
  tasks: Task[];
  entries: Entry[];
  dayNotes: DayNote[];
  exportedAt: string;
}

export async function exportData(): Promise<ExportData> {
  const [tasks, entries, dayNotes] = await Promise.all([
    db.tasks.toArray(),
    db.entries.toArray(),
    db.dayNotes.toArray()
  ]);
  return {
    tasks,
    entries,
    dayNotes,
    exportedAt: new Date().toISOString()
  };
}

export async function importData(data: ExportData, merge = true): Promise<void> {
  await db.transaction('rw', [db.tasks, db.entries, db.dayNotes], async () => {
    if (!merge) {
      await db.tasks.clear();
      await db.entries.clear();
      await db.dayNotes.clear();
    }

    // Import tasks (upsert by id)
    for (const task of data.tasks) {
      await db.tasks.put(task);
    }

    // Import entries (upsert by date+taskId)
    for (const entry of data.entries) {
      const existing = await db.entries
        .where('[date+taskId]')
        .equals([entry.date, entry.taskId])
        .first();
      if (existing) {
        await db.entries.update(existing.id!, {
          value: entry.value,
          updatedAt: entry.updatedAt
        });
      } else {
        const { id, ...entryWithoutId } = entry;
        await db.entries.add(entryWithoutId);
      }
    }

    // Import day notes (upsert by date)
    for (const note of data.dayNotes) {
      await db.dayNotes.put(note);
    }
  });
}

