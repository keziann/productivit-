'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TaskToggle } from './TaskToggle';
import { useAuth } from './AuthProvider';
import {
  getActiveTasks,
  getEntriesForDate,
  saveEntry
} from '@/lib/data';
import type { Task, Entry } from '@/lib/db';
import { formatDate } from '@/lib/stats';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { ListChecks } from 'lucide-react';

interface DailyTasksProps {
  date?: Date;
}

export function DailyTasks({ date = new Date() }: DailyTasksProps) {
  const { isAuthenticated } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const dateStr = formatDate(date);

  const loadData = useCallback(async () => {
    if (!isAuthenticated) return;

    setIsLoading(true);
    try {
      const [tasksData, entriesData] = await Promise.all([
        getActiveTasks(),
        getEntriesForDate(dateStr)
      ]);
      setTasks(tasksData);
      setEntries(entriesData);
    } catch (error) {
      console.error('Error loading daily tasks:', error);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, dateStr]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleToggle = async (task: Task, currentValue: 1 | 0.5 | 0 | null) => {
    if (!isAuthenticated) return;

    let newValue: 1 | 0.5 | 0 | null;

    if (task.allowPartial) {
      // Cycle: null -> 1 -> 0.5 -> 0 -> null
      if (currentValue === null) newValue = 1;
      else if (currentValue === 1) newValue = 0.5;
      else if (currentValue === 0.5) newValue = 0;
      else newValue = null;
    } else {
      // Cycle: null -> 1 -> 0 -> null
      if (currentValue === null) newValue = 1;
      else if (currentValue === 1) newValue = 0;
      else newValue = null;
    }

    // Optimistic update
    setEntries((prev) => {
      const existing = prev.find(e => e.taskId === task.id);
      if (existing) {
        return prev.map(e =>
          e.taskId === task.id
            ? { ...e, value: newValue }
            : e
        );
      }
      return [...prev, { taskId: task.id, date: dateStr, value: newValue, updatedAt: new Date() } as Entry];
    });

    // Send to Supabase (or queue if offline)
    try {
      await saveEntry(task.id, dateStr, newValue);
    } catch (error) {
      console.error('Error updating entry:', error);
    }
  };

  const getEntryValue = (taskId: string): 1 | 0.5 | 0 | null => {
    const entry = entries.find(e => e.taskId === taskId);
    return (entry?.value as 1 | 0.5 | 0 | null) ?? null;
  };

  if (!isAuthenticated) return null;

  if (isLoading) {
    return (
      <Card className="overflow-hidden">
        <CardContent className="py-12">
          <div className="flex items-center justify-center">
            <div className="animate-pulse text-muted-foreground">Chargement...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const completedCount = entries.filter(e => e.value === 1).length;
  const partialCount = entries.filter(e => e.value === 0.5).length;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3 bg-gradient-to-r from-primary/5 to-transparent">
        <CardTitle className="text-base flex items-center justify-between">
          <span className="flex items-center gap-2">
            <ListChecks className="w-5 h-5 text-primary" />
            Tâches du jour
          </span>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="font-normal bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
              {completedCount + partialCount * 0.5}/{tasks.length}
            </Badge>
            <Badge variant="outline" className="font-normal text-xs">
              {format(date, 'EEE d MMM', { locale: fr })}
            </Badge>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {tasks.length === 0 ? (
          <div className="text-center text-muted-foreground py-12 px-4 space-y-2">
            <p className="font-medium">Aucune tâche active</p>
            <p className="text-xs">
              Allez dans l'onglet "Tâches" pour créer vos premières habitudes
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border/50">
            {tasks.map((task) => {
              const value = getEntryValue(task.id);
              return (
                <div
                  key={task.id}
                  className={cn(
                    'flex items-center gap-4 px-4 py-3 transition-colors',
                    value === 1 && 'bg-emerald-50/50 dark:bg-emerald-900/10',
                    value === 0.5 && 'bg-orange-50/50 dark:bg-orange-900/10',
                    value === 0 && 'bg-red-50/50 dark:bg-red-900/10'
                  )}
                >
                  <TaskToggle
                    value={value}
                    onChange={(newValue) => {
                      // Direct set for better UX
                      setEntries((prev) => {
                        const existing = prev.find(e => e.taskId === task.id);
                        if (existing) {
                          return prev.map(e =>
                            e.taskId === task.id ? { ...e, value: newValue } : e
                          );
                        }
                        return [...prev, { taskId: task.id, date: dateStr, value: newValue, updatedAt: new Date() } as Entry];
                      });
                      saveEntry(task.id, dateStr, newValue);
                    }}
                    size="md"
                    allowPartial={task.allowPartial}
                  />
                  <div className="flex-1 min-w-0">
                    <div className={cn(
                      'font-medium text-sm',
                      value === 1 && 'text-emerald-700 dark:text-emerald-300',
                      value === 0.5 && 'text-orange-700 dark:text-orange-300',
                      value === 0 && 'text-red-700 dark:text-red-300 line-through opacity-70'
                    )}>
                      {task.name}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      {task.category && (
                        <Badge variant="secondary" className="text-[10px] h-5 px-1.5">
                          {task.category}
                        </Badge>
                      )}
                      {task.allowPartial && (
                        <span className="text-[10px] text-orange-500 font-medium">
                          Mode 3 couleurs
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
