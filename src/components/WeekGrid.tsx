'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TaskToggleCompact } from './TaskToggle';
import { useAuth } from './AuthProvider';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import {
  getActiveTasks,
  getEntries,
  saveEntry
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

const STICKY_LEFT_Z = 10;
const STICKY_RIGHT_Z = 10;
const PERCENT_COL_WIDTH = 48;

interface WeekGridProps {
  initialDate?: Date;
}

export function WeekGrid({ initialDate = new Date() }: WeekGridProps) {
  const { isAuthenticated } = useAuth();
  const [currentDate, setCurrentDate] = useState(initialDate);
  const [weekInfo, setWeekInfo] = useState<WeekInfo>(() => getWeekInfo(initialDate));
  const [tasks, setTasks] = useState<Task[]>([]);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [allEntries, setAllEntries] = useState<Entry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = useCallback(async () => {
    if (!isAuthenticated) return;

    setIsLoading(true);
    const info = getWeekInfo(currentDate);
    setWeekInfo(info);

    const startDate = formatDate(info.startDate);
    const endDate = formatDate(info.endDate);

    try {
      const [tasksData, allEntriesData] = await Promise.all([
        getActiveTasks(),
        getEntries()
      ]);

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
  }, [isAuthenticated, currentDate]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const goToPreviousWeek = () => setCurrentDate(getPreviousWeek(currentDate));
  const goToNextWeek = () => setCurrentDate(getNextWeek(currentDate));
  const goToToday = () => setCurrentDate(new Date());

  const handleToggle = async (task: Task, date: string, currentValue: 1 | 0.5 | 0 | null) => {
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

    setEntries((prev) => {
      const existing = prev.find(e => e.taskId === task.id && e.date === date);
      if (existing) {
        return prev.map(e =>
          e.taskId === task.id && e.date === date
            ? { ...e, value: newValue }
            : e
        );
      }
      return [...prev, { taskId: task.id, date, value: newValue, updatedAt: new Date() } as Entry];
    });

    setAllEntries((prev) => {
      const existing = prev.find(e => e.taskId === task.id && e.date === date);
      if (existing) {
        return prev.map(e =>
          e.taskId === task.id && e.date === date
            ? { ...e, value: newValue }
            : e
        );
      }
      return [...prev, { taskId: task.id, date, value: newValue, updatedAt: new Date() } as Entry];
    });

    try {
      await saveEntry(task.id, date, newValue);
    } catch (error) {
      console.error('Error updating entry:', error);
    }
  };

  const getEntryValue = (taskId: string, date: string): 1 | 0.5 | 0 | null => {
    const entry = entries.find(e => e.taskId === taskId && e.date === date);
    return (entry?.value as 1 | 0.5 | 0 | null) ?? null;
  };

  if (!isAuthenticated) return null;

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
      <Card className="overflow-hidden">
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
      {/* Header: Week navigation */}
      <Card className="overflow-hidden">
        <CardContent className="p-4">
          <div className="flex flex-col gap-4">
            {/* Week selector */}
            <div className="flex items-center justify-center gap-3">
              <Button
                variant="outline"
                size="icon"
                className="shrink-0 h-10 w-10 rounded-xl"
                onClick={goToPreviousWeek}
                aria-label="Semaine précédente"
              >
                <ChevronLeft className="w-5 h-5" />
              </Button>
              <div className="flex-1 flex justify-center">
                <div className="inline-flex items-center justify-center rounded-xl bg-primary/10 px-5 py-2.5">
                  <span className="text-sm font-bold tabular-nums text-primary">
                    {weekInfo.label}
                  </span>
                </div>
              </div>
              <Button
                variant="outline"
                size="icon"
                className="shrink-0 h-10 w-10 rounded-xl"
                onClick={goToNextWeek}
                aria-label="Semaine suivante"
              >
                <ChevronRight className="w-5 h-5" />
              </Button>
            </div>

            {/* Today + Average */}
            <div className="flex items-center justify-center gap-3 flex-wrap">
              <Button
                variant="outline"
                size="sm"
                className="rounded-xl h-10 px-4 gap-2"
                onClick={goToToday}
              >
                <Calendar className="w-4 h-4" />
                Aujourd&apos;hui
              </Button>
              <div className={cn(
                'rounded-xl px-4 py-2',
                weekAverage >= 70 ? 'bg-emerald-100 dark:bg-emerald-900/30' :
                weekAverage >= 40 ? 'bg-orange-100 dark:bg-orange-900/30' :
                'bg-red-100 dark:bg-red-900/30'
              )}>
                <span className="text-sm font-medium text-muted-foreground">Moyenne </span>
                <span className={cn(
                  'text-sm font-bold tabular-nums',
                  weekAverage >= 70 ? 'text-emerald-600 dark:text-emerald-400' :
                  weekAverage >= 40 ? 'text-orange-600 dark:text-orange-400' :
                  'text-red-600 dark:text-red-400'
                )}>
                  {weekAverage}%
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Grid */}
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto" style={{ WebkitOverflowScrolling: 'touch' }}>
            <table className="w-full border-collapse" style={{ minWidth: 520 }}>
              <thead>
                <tr className="border-b bg-muted/40">
                  <th
                    className="text-left p-3 font-semibold text-xs w-28 sm:w-36 sticky left-0 z-20 bg-muted/80 backdrop-blur-sm border-r"
                    scope="col"
                  >
                    Tâche
                  </th>
                  {weekInfo.days.map((day) => {
                    const dateStr = formatDate(day);
                    const dayIsToday = isToday(day);
                    return (
                      <th
                        key={dateStr}
                        className={cn(
                          'text-center p-2 font-medium text-xs w-12 sm:w-14',
                          dayIsToday && 'bg-primary/10'
                        )}
                        scope="col"
                      >
                        <div className="uppercase tracking-wide text-muted-foreground text-[10px]">
                          {getDayName(day)}
                        </div>
                        <div
                          className={cn(
                            'text-sm font-bold mt-0.5 tabular-nums',
                            dayIsToday && 'text-primary'
                          )}
                        >
                          {format(day, 'd')}
                        </div>
                      </th>
                    );
                  })}
                  <th
                    className="text-center p-2 font-semibold text-xs w-12 sticky right-12 z-20 bg-muted/80 backdrop-blur-sm border-l"
                    style={{ width: PERCENT_COL_WIDTH }}
                    scope="col"
                  >
                    Sem.
                  </th>
                  <th
                    className="text-center p-2 font-semibold text-xs w-12 sticky right-0 z-20 bg-muted/80 backdrop-blur-sm border-l"
                    style={{ width: PERCENT_COL_WIDTH }}
                    scope="col"
                  >
                    Global
                  </th>
                </tr>
              </thead>
              <tbody>
                {weekStats.map(({ task, week, global }) => (
                  <tr key={task.id} className="border-b last:border-0 hover:bg-muted/20">
                    <td className="p-3 sticky left-0 z-10 bg-card border-r w-28 sm:w-36">
                      <div className="font-medium text-sm truncate max-w-24 sm:max-w-32" title={task.name}>
                        {task.name}
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        {task.category && (
                          <span className="text-[10px] text-muted-foreground truncate max-w-16">
                            {task.category}
                          </span>
                        )}
                        {task.allowPartial && (
                          <span className="w-2 h-2 rounded-full bg-orange-500" title="Mode 3 couleurs" />
                        )}
                      </div>
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
                            'p-1.5 w-12 sm:w-14',
                            dayIsToday && 'bg-primary/5'
                          )}
                        >
                          <TaskToggleCompact
                            value={value}
                            onChange={() => handleToggle(task, dateStr, value)}
                            disabled={dayIsFuture}
                            allowPartial={task.allowPartial}
                          />
                        </td>
                      );
                    })}
                    <td
                      className="p-2 text-center sticky right-12 z-10 bg-card border-l"
                      style={{ width: PERCENT_COL_WIDTH }}
                    >
                      <Badge
                        className={cn(
                          'text-[10px] font-mono px-2 py-0.5',
                          week.rate >= 70 ? 'bg-emerald-500 hover:bg-emerald-600 text-white' :
                          week.rate >= 40 ? 'bg-orange-500 hover:bg-orange-600 text-white' :
                          week.total > 0 ? 'bg-red-500 hover:bg-red-600 text-white' :
                          'bg-muted text-muted-foreground'
                        )}
                      >
                        {week.total > 0 ? `${week.rate}%` : '—'}
                      </Badge>
                    </td>
                    <td
                      className="p-2 text-center sticky right-0 z-10 bg-card border-l"
                      style={{ width: PERCENT_COL_WIDTH }}
                    >
                      <span
                        className={cn(
                          'text-xs font-mono font-bold',
                          global.rate >= 70 ? 'text-emerald-600 dark:text-emerald-400' :
                          global.rate >= 40 ? 'text-orange-600 dark:text-orange-400' :
                          'text-red-600 dark:text-red-400'
                        )}
                      >
                        {global.total > 0 ? `${global.rate}%` : '—'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {tasks.length === 0 && (
            <div className="p-12 text-center text-muted-foreground text-sm">
              Aucune tâche active. Créez des tâches dans l&apos;onglet &quot;Tâches&quot;.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
