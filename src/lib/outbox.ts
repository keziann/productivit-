import Dexie, { type EntityTable } from 'dexie';

// Outbox action types
export type OutboxActionType = 
  | 'upsert_task'
  | 'delete_task'
  | 'upsert_entry'
  | 'upsert_day_note'
  | 'update_settings';

export interface OutboxAction {
  id?: number;
  type: OutboxActionType;
  payload: Record<string, unknown>;
  createdAt: Date;
  retryCount: number;
}

// Sync status
export interface SyncStatus {
  isOnline: boolean;
  pendingCount: number;
  lastSyncAt: Date | null;
  error: string | null;
}

// Local Outbox DB
class OutboxDB extends Dexie {
  actions!: EntityTable<OutboxAction, 'id'>;

  constructor() {
    super('HabitTrackerOutbox');
    this.version(1).stores({
      actions: '++id, type, createdAt'
    });
  }
}

export const outboxDb = new OutboxDB();

// Add action to outbox
export async function addToOutbox(type: OutboxActionType, payload: Record<string, unknown>): Promise<void> {
  await outboxDb.actions.add({
    type,
    payload,
    createdAt: new Date(),
    retryCount: 0
  });
}

// Get pending count
export async function getPendingCount(): Promise<number> {
  return outboxDb.actions.count();
}

// Get all pending actions
export async function getPendingActions(): Promise<OutboxAction[]> {
  return outboxDb.actions.orderBy('createdAt').toArray();
}

// Remove action from outbox
export async function removeFromOutbox(id: number): Promise<void> {
  await outboxDb.actions.delete(id);
}

// Increment retry count
export async function incrementRetryCount(id: number): Promise<void> {
  const action = await outboxDb.actions.get(id);
  if (action) {
    await outboxDb.actions.update(id, { retryCount: action.retryCount + 1 });
  }
}

// Clear all outbox
export async function clearOutbox(): Promise<void> {
  await outboxDb.actions.clear();
}

// Last sync timestamp (stored in localStorage)
const LAST_SYNC_KEY = 'habit_tracker_last_sync';

export function getLastSyncAt(): Date | null {
  if (typeof window === 'undefined') return null;
  const stored = localStorage.getItem(LAST_SYNC_KEY);
  return stored ? new Date(stored) : null;
}

export function setLastSyncAt(date: Date): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(LAST_SYNC_KEY, date.toISOString());
  }
}

// Online status helpers
export function isOnline(): boolean {
  if (typeof navigator === 'undefined') return true;
  return navigator.onLine;
}

