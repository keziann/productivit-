'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TaskToggleCompact } from './TaskToggle';
import { useAuth } from './AuthProvider';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import {
  fetchActiveTasks,
  fetchEntries,
  upsertEntry
} from '@/lib/data';
import type { Task, Entry } from '@/lib/db';
import {
  getWeekInfo,
  formatDate,
  getDayName,
  getPreviousWeek,
  getNextWeek,
  calculateTaskWeekStats,
  calculateTaskGlobalStats,
  type WeekInfo
} from '@/lib/stats';
import { cn } from '@/lib/utils';
import { format, isToday, isFuture } from 'date-fns';

interface WeekGridProps {
  initialDate?: Date;
}

export function WeekGrid({ initialDate = new Date() }: WeekGridProps) {
  const { user, refreshSyncStatus } = useAuth();
  const [currentDate, setCurrentDate] = useState(initialDate);
  const [weekInfo, setWeekInfo] = useState<WeekInfo>(() => getWeekInfo(initialDate));
  const [tasks, setTasks] = useState<Task[]>([]);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [allEntries, setAllEntries] = useState<Entry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load data
  const loadData = useCallback(async () => {
    if (!user) return;
    
    setIsLoading(true);
    const info = getWeekInfo(currentDate);
    setWeekInfo(info);

    const startDate = formatDate(info.startDate);
    const endDate = formatDate(info.endDate);

    try {
      const [tasksData, allEntriesData] = await Promise.all([
        fetchActiveTasks(user.id),
        fetchEntries(user.id)
      ]);

      // Filter entries for this week
      const weekEntries = allEntriesData.filter(
        e => e.date >= startDate && e.date <= endDate
      );

      setTasks(tasksData);
      setEntries(weekEntries);
      setAllEntries(allEntriesData);
    } catch (error) {
      console.error('Error loading week data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user, currentDate]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Navigation
  const goToPreviousWeek = () => setCurrentDate(getPreviousWeek(currentDate));
  const goToNextWeek = () => setCurrentDate(getNextWeek(currentDate));
  const goToToday = () => setCurrentDate(new Date());

  // Handle toggle
  const handleToggle = async (taskId: string, date: string, currentValue: 1 | 0 | null) => {
    if (!user) return;
    
    let newValue: 1 | 0 | null;
    if (currentValue === null) newValue = 1;
    else if (currentValue === 1) newValue = 0;
    else newValue = null;

    // Optimistic update
    setEntries((prev) => {
      const existing = prev.find(e => e.taskId === taskId && e.date === date);
      if (existing) {
        return prev.map(e =>
          e.taskId === taskId && e.date === date
            ? { ...e, value: newValue }
            : e
        );
      }
      return [...prev, { taskId, date, value: newValue, updatedAt: new Date() } as Entry];
    });

    setAllEntries((prev) => {
      const existing = prev.find(e => e.taskId === taskId && e.date === date);
      if (existing) {
        return prev.map(e =>
          e.taskId === taskId && e.date === date
            ? { ...e, value: newValue }
            : e
        );
      }
      return [...prev, { taskId, date, value: newValue, updatedAt: new Date() } as Entry];
    });

    try {
      await upsertEntry(user.id, taskId, date, newValue);
      await refreshSyncStatus();
    } catch (error) {
      console.error('Error updating entry:', error);
    }
  };

  // Get entry value
  const getEntryValue = (taskId: string, date: string): 1 | 0 | null => {
    const entry = entries.find(e => e.taskId === taskId && e.date === date);
    return entry?.value ?? null;
  };

  if (!user) return null;

  // Calculate week average
  const weekDates = weekInfo.days.map(d => formatDate(d));
  const weekStats = tasks.map(task => ({
    task,
    week: calculateTaskWeekStats(task.id, entries, weekDates),
    global: calculateTaskGlobalStats(task.id, allEntries)
  }));

  const totalWeekCompleted = weekStats.reduce((sum, s) => sum + s.week.completed, 0);
  const totalWeekEntries = weekStats.reduce((sum, s) => sum + s.week.total, 0);
  const weekAverage = totalWeekEntries > 0 ? Math.round((totalWeekCompleted / totalWeekEntries) * 100) : 0;

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="flex items-center justify-center">
            <div className="animate-pulse text-muted-foreground">Chargement...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with navigation */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <Button variant="outline" size="icon" onClick={goToPreviousWeek}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <div className="text-center">
                <CardTitle className="text-lg">{weekInfo.label}</CardTitle>
              </div>
              <Button variant="outline" size="icon" onClick={goToNextWeek}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" onClick={goToToday}>
                <Calendar className="w-4 h-4 mr-2" />
                Aujourd'hui
              </Button>
              <Badge variant="secondary" className="text-sm px-3 py-1">
                Moyenne: {weekAverage}%
              </Badge>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Grid */}
      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full min-w-[700px]">
            <thead>
              <tr className="border-b">
                <th className="text-left p-3 font-medium text-sm w-48">Tâche</th>
                {weekInfo.days.map((day) => {
                  const dateStr = formatDate(day);
                  const dayIsToday = isToday(day);
                  return (
                    <th
                      key={dateStr}
                      className={cn(
                        'text-center p-2 font-medium text-xs w-20',
                        dayIsToday && 'bg-emerald-50 dark:bg-emerald-950/30'
                      )}
                    >
                      <div className="uppercase tracking-wide text-muted-foreground">
                        {getDayName(day)}
                      </div>
                      <div className={cn(
                        'text-sm mt-0.5',
                        dayIsToday && 'text-emerald-600 dark:text-emerald-400 font-bold'
                      )}>
                        {format(day, 'd')}
                      </div>
                    </th>
                  );
                })}
                <th className="text-center p-2 font-medium text-xs w-20">Sem.</th>
                <th className="text-center p-2 font-medium text-xs w-20">Global</th>
              </tr>
            </thead>
            <tbody>
              {weekStats.map(({ task, week, global }) => (
                <tr key={task.id} className="border-b last:border-0 hover:bg-muted/30">
                  <td className="p-3">
                    <div className="font-medium text-sm truncate max-w-[180px]" title={task.name}>
                      {task.name}
                    </div>
                    {task.category && (
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {task.category}
                      </div>
                    )}
                  </td>
                  {weekInfo.days.map((day) => {
                    const dateStr = formatDate(day);
                    const value = getEntryValue(task.id, dateStr);
                    const dayIsToday = isToday(day);
                    const dayIsFuture = isFuture(day);

                    return (
                      <td
                        key={dateStr}
                        className={cn(
                          'p-1.5',
                          dayIsToday && 'bg-emerald-50 dark:bg-emerald-950/30'
                        )}
                      >
                        <TaskToggleCompact
                          value={value}
                          onChange={() => handleToggle(task.id, dateStr, value)}
                          disabled={dayIsFuture}
                        />
                      </td>
                    );
                  })}
                  <td className="p-2 text-center">
                    <Badge
                      variant={week.rate >= 70 ? 'default' : week.rate >= 40 ? 'secondary' : 'destructive'}
                      className={cn(
                        'text-xs font-mono',
                        week.rate >= 70 && 'bg-emerald-500 hover:bg-emerald-600'
                      )}
                    >
                      {week.total > 0 ? `${week.rate}%` : '—'}
                    </Badge>
                  </td>
                  <td className="p-2 text-center">
                    <span className={cn(
                      'text-xs font-mono',
                      global.rate >= 70 ? 'text-emerald-600 dark:text-emerald-400' :
                      global.rate >= 40 ? 'text-yellow-600 dark:text-yellow-400' :
                      'text-red-600 dark:text-red-400'
                    )}>
                      {global.total > 0 ? `${global.rate}%` : '—'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {tasks.length === 0 && (
            <div className="p-12 text-center text-muted-foreground">
              Aucune tâche active. Créez des tâches dans l'onglet "Tâches".
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
