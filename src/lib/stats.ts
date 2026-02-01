import { format, startOfWeek, endOfWeek, eachDayOfInterval, subDays, addDays, getISOWeek, getYear, startOfMonth, endOfMonth, addMonths, subMonths } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { Task, Entry } from './db';

export interface TaskStats {
  taskId: string;
  taskName: string;
  weekCompleted: number;
  weekTotal: number;
  weekRate: number;
  globalCompleted: number;
  globalTotal: number;
  globalRate: number;
  streak: number;
}

export interface DayStats {
  completed: number;
  partial: number;
  total: number;
  rate: number;
  filled: number;
  fillRate: number;
}

export interface WeekInfo {
  weekNumber: number;
  year: number;
  startDate: Date;
  endDate: Date;
  label: string;
  days: Date[];
}

export interface MonthInfo {
  year: number;
  month: number;
  startDate: Date;
  endDate: Date;
  label: string;
  days: Date[];
}

// Get week info for a given date
export function getWeekInfo(date: Date): WeekInfo {
  const start = startOfWeek(date, { weekStartsOn: 1 }); // Monday
  const end = endOfWeek(date, { weekStartsOn: 1 }); // Sunday
  const weekNumber = getISOWeek(date);
  const year = getYear(start);

  const startLabel = format(start, 'd', { locale: fr });
  const endLabel = format(end, 'd MMM', { locale: fr });

  return {
    weekNumber,
    year,
    startDate: start,
    endDate: end,
    label: `Semaine ${weekNumber} (${startLabel}–${endLabel})`,
    days: eachDayOfInterval({ start, end })
  };
}

// Format date as YYYY-MM-DD
export function formatDate(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

// Format date for display
export function formatDateDisplay(date: Date): string {
  return format(date, 'EEE d', { locale: fr });
}

// Get day name
export function getDayName(date: Date): string {
  return format(date, 'EEE', { locale: fr });
}

// Helper to calculate score from value (1 = 1, 0.5 = 0.5, 0 = 0)
function getValueScore(value: number | null): number {
  if (value === 1) return 1;
  if (value === 0.5) return 0.5;
  return 0;
}

// Calculate stats for a single day
export function calculateDayStats(entries: Entry[], tasks: Task[]): DayStats {
  const activeTaskIds = new Set(tasks.filter(t => t.active).map(t => t.id));
  const relevantEntries = entries.filter(e => activeTaskIds.has(e.taskId));

  const filled = relevantEntries.filter(e => e.value !== null).length;
  const completed = relevantEntries.filter(e => e.value === 1).length;
  const partial = relevantEntries.filter(e => e.value === 0.5).length;
  const total = filled;

  // Rate: 1 = 100%, 0.5 = 50%, 0 = 0%
  const score = relevantEntries.reduce((sum, e) => sum + getValueScore(e.value), 0);

  return {
    completed,
    partial,
    total,
    rate: total > 0 ? Math.round((score / total) * 100) : 0,
    filled,
    fillRate: activeTaskIds.size > 0 ? Math.round((filled / activeTaskIds.size) * 100) : 0
  };
}

// Calculate week stats for a task
export function calculateTaskWeekStats(
  taskId: string,
  entries: Entry[],
  weekDates: string[]
): { completed: number; total: number; rate: number } {
  const taskEntries = entries.filter(
    e => e.taskId === taskId && weekDates.includes(e.date) && e.value !== null
  );

  // Score: 1 = 1, 0.5 = 0.5, 0 = 0
  const score = taskEntries.reduce((sum, e) => sum + getValueScore(e.value), 0);
  const total = taskEntries.length;

  return {
    completed: score, // Can be fractional now
    total,
    rate: total > 0 ? Math.round((score / total) * 100) : 0
  };
}

// Calculate global stats for a task (last 30 days or all data)
export function calculateTaskGlobalStats(
  taskId: string,
  entries: Entry[]
): { completed: number; total: number; rate: number } {
  const taskEntries = entries.filter(
    e => e.taskId === taskId && e.value !== null
  );

  const score = taskEntries.reduce((sum, e) => sum + getValueScore(e.value), 0);
  const total = taskEntries.length;

  return {
    completed: score,
    total,
    rate: total > 0 ? Math.round((score / total) * 100) : 0
  };
}

// Calculate current streak for a task
export function calculateStreak(taskId: string, entries: Entry[]): number {
  const taskEntries = entries
    .filter(e => e.taskId === taskId)
    .sort((a, b) => b.date.localeCompare(a.date)); // Sort descending

  let streak = 0;
  const today = formatDate(new Date());
  let currentDate = today;

  for (const entry of taskEntries) {
    if (entry.date !== currentDate) {
      // Check if we skipped a day
      const entryDate = new Date(entry.date);
      const expected = new Date(currentDate);
      const diff = Math.floor((expected.getTime() - entryDate.getTime()) / (1000 * 60 * 60 * 24));

      if (diff > 1) break; // Streak broken
      currentDate = entry.date;
    }

    // 1 or 0.5 counts as streak (at least partially done)
    if (entry.value === 1 || entry.value === 0.5) {
      streak++;
      currentDate = formatDate(subDays(new Date(currentDate), 1));
    } else if (entry.value === 0) {
      break; // Streak broken
    }
  }

  return streak;
}

// Get full stats for all tasks
export function calculateAllTaskStats(
  tasks: Task[],
  allEntries: Entry[],
  weekDates: string[]
): TaskStats[] {
  return tasks.filter(t => t.active).map(task => {
    const weekStats = calculateTaskWeekStats(task.id, allEntries, weekDates);
    const globalStats = calculateTaskGlobalStats(task.id, allEntries);
    const streak = calculateStreak(task.id, allEntries);

    return {
      taskId: task.id,
      taskName: task.name,
      weekCompleted: weekStats.completed,
      weekTotal: weekStats.total,
      weekRate: weekStats.rate,
      globalCompleted: globalStats.completed,
      globalTotal: globalStats.total,
      globalRate: globalStats.rate,
      streak
    };
  });
}

// Get hardest tasks (lowest global rate)
export function getHardestTasks(stats: TaskStats[], limit = 5): TaskStats[] {
  return [...stats]
    .filter(s => s.globalTotal > 0) // Only tasks with data
    .sort((a, b) => a.globalRate - b.globalRate)
    .slice(0, limit);
}

// Get best tasks (highest global rate)
export function getBestTasks(stats: TaskStats[], limit = 5): TaskStats[] {
  return [...stats]
    .filter(s => s.globalTotal > 0)
    .sort((a, b) => b.globalRate - a.globalRate)
    .slice(0, limit);
}

// Week navigation helpers
export function getPreviousWeek(date: Date): Date {
  return subDays(startOfWeek(date, { weekStartsOn: 1 }), 1);
}

export function getNextWeek(date: Date): Date {
  return addDays(endOfWeek(date, { weekStartsOn: 1 }), 1);
}

// Month info and navigation
export function getMonthInfo(date: Date): MonthInfo {
  const start = startOfMonth(date);
  const end = endOfMonth(date);
  const days = eachDayOfInterval({ start, end });
  return {
    year: getYear(start),
    month: date.getMonth() + 1,
    startDate: start,
    endDate: end,
    label: format(date, 'MMMM yyyy', { locale: fr }),
    days
  };
}

export function getPreviousMonth(date: Date): Date {
  return subMonths(date, 1);
}

export function getNextMonth(date: Date): Date {
  return addMonths(date, 1);
}

// Calculate month stats for a task
export function calculateTaskMonthStats(
  taskId: string,
  entries: Entry[],
  monthDates: string[]
): { completed: number; total: number; rate: number } {
  const taskEntries = entries.filter(
    e => e.taskId === taskId && monthDates.includes(e.date) && e.value !== null
  );
  const score = taskEntries.reduce((sum, e) => sum + getValueScore(e.value), 0);
  const total = taskEntries.length;
  return {
    completed: score,
    total,
    rate: total > 0 ? Math.round((score / total) * 100) : 0
  };
}

// Task stats by range
export interface TaskStatsByRange {
  taskId: string;
  taskName: string;
  successCount: number;
  partialCount: number;
  failCount: number;
  successRate: number | null; // null if no data
}

export function getTaskStatsByRange(
  tasks: Task[],
  entries: Entry[],
  range: '7d' | '30d' | 'all'
): TaskStatsByRange[] {
  const today = new Date();
  let startDate: Date | null = null;

  if (range === '7d') {
    startDate = subDays(today, 7);
  } else if (range === '30d') {
    startDate = subDays(today, 30);
  }
  // else 'all' -> startDate stays null

  const startDateStr = startDate ? formatDate(startDate) : '2000-01-01';
  const endDateStr = formatDate(today);

  // Filter entries by date range
  const filteredEntries = entries.filter(entry => {
    if (range === 'all') return true;
    return entry.date >= startDateStr && entry.date <= endDateStr;
  });

  // Calculate stats for each active task
  const stats: TaskStatsByRange[] = tasks
    .filter(t => t.active)
    .map(task => {
      const taskEntries = filteredEntries.filter(
        e => e.taskId === task.id && e.value !== null
      );

      const successCount = taskEntries.filter(e => e.value === 1).length;
      const partialCount = taskEntries.filter(e => e.value === 0.5).length;
      const failCount = taskEntries.filter(e => e.value === 0).length;

      // Score: 1 = 1, 0.5 = 0.5, 0 = 0
      const score = successCount + (partialCount * 0.5);
      const total = successCount + partialCount + failCount;

      const successRate = total > 0
        ? Math.round((score / total) * 100)
        : null;

      return {
        taskId: task.id,
        taskName: task.name,
        successCount,
        partialCount,
        failCount,
        successRate
      };
    });

  // Sort by success rate (ascending: lowest first, nulls last)
  return stats.sort((a, b) => {
    if (a.successRate === null && b.successRate === null) return 0;
    if (a.successRate === null) return 1; // nulls at the end
    if (b.successRate === null) return -1;
    return a.successRate - b.successRate; // ascending: lowest first
  });
}
