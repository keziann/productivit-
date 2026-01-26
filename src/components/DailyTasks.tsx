'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TaskToggle } from './TaskToggle';
import { useAuth } from './AuthProvider';
import {
  fetchActiveTasks,
  fetchEntriesForDate,
  upsertEntry
} from '@/lib/data';
import type { Task, Entry } from '@/lib/db';
import { formatDate } from '@/lib/stats';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface DailyTasksProps {
  date?: Date;
}

export function DailyTasks({ date = new Date() }: DailyTasksProps) {
  const { user, refreshSyncStatus } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const dateStr = formatDate(date);

  const loadData = useCallback(async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const [tasksData, entriesData] = await Promise.all([
        fetchActiveTasks(user.id),
        fetchEntriesForDate(user.id, dateStr)
      ]);
      setTasks(tasksData);
      setEntries(entriesData);
    } catch (error) {
      console.error('Error loading daily tasks:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user, dateStr]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleToggle = async (taskId: string, currentValue: 1 | 0 | null) => {
    if (!user) return;
    
    let newValue: 1 | 0 | null;
    if (currentValue === null) newValue = 1;
    else if (currentValue === 1) newValue = 0;
    else newValue = null;

    // Optimistic update
    setEntries((prev) => {
      const existing = prev.find(e => e.taskId === taskId);
      if (existing) {
        return prev.map(e =>
          e.taskId === taskId
            ? { ...e, value: newValue }
            : e
        );
      }
      return [...prev, { taskId, date: dateStr, value: newValue, updatedAt: new Date() } as Entry];
    });

    // Send to Supabase (or queue if offline)
    try {
      await upsertEntry(user.id, taskId, dateStr, newValue);
      await refreshSyncStatus();
    } catch (error) {
      console.error('Error updating entry:', error);
    }
  };

  const getEntryValue = (taskId: string): 1 | 0 | null => {
    const entry = entries.find(e => e.taskId === taskId);
    return entry?.value ?? null;
  };

  if (!user) return null;

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="flex items-center justify-center">
            <div className="animate-pulse text-muted-foreground">Chargement...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center justify-between">
          <span>Tâches du jour</span>
          <Badge variant="outline" className="font-normal">
            {format(date, 'EEEE d MMMM', { locale: fr })}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {tasks.length === 0 ? (
          <div className="text-center text-muted-foreground py-8 space-y-2">
            <p className="font-medium">Aucune tâche active</p>
            <p className="text-xs">
              Allez dans l'onglet "Tâches" pour créer vos premières habitudes
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {tasks.map((task) => {
              const value = getEntryValue(task.id);
              return (
                <div
                  key={task.id}
                  className={cn(
                    'flex items-center gap-3 p-3 rounded-lg transition-colors',
                    value === 1 && 'bg-emerald-50 dark:bg-emerald-900/20',
                    value === 0 && 'bg-red-50 dark:bg-red-900/20',
                    value === null && 'bg-muted/30'
                  )}
                >
                  <TaskToggle
                    value={value}
                    onChange={() => handleToggle(task.id, value)}
                    size="md"
                  />
                  <div className="flex-1 min-w-0">
                    <div className={cn(
                      'font-medium text-sm',
                      value === 1 && 'text-emerald-700 dark:text-emerald-300',
                      value === 0 && 'text-red-700 dark:text-red-300 line-through opacity-60'
                    )}>
                      {task.name}
                    </div>
                    {task.category && (
                      <Badge variant="secondary" className="text-xs mt-1">
                        {task.category}
                      </Badge>
                    )}
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
