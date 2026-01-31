'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from './AuthProvider';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { getActiveTasks, getEntries } from '@/lib/data';
import type { Task, Entry } from '@/lib/db';
import {
  getMonthInfo,
  formatDate,
  getDayName,
  getPreviousMonth,
  getNextMonth,
  calculateTaskMonthStats,
  calculateTaskGlobalStats,
  type MonthInfo
} from '@/lib/stats';
import { cn } from '@/lib/utils';
import { format, isToday } from 'date-fns';
import { fr } from 'date-fns/locale';

const PERCENT_COL_WIDTH = 44;

interface MonthGridProps {
  initialDate?: Date;
}

// Read-only cell: small colored square (green / red / gray)
function MonthCell({ value }: { value: 1 | 0 | null }) {
  return (
    <div
      className={cn(
        'w-5 h-5 sm:w-6 sm:h-6 rounded-sm shrink-0 mx-auto',
        value === 1 && 'bg-emerald-500',
        value === 0 && 'bg-red-500',
        value === null && 'bg-muted border border-dashed border-muted-foreground/30'
      )}
      title={value === 1 ? 'Fait' : value === 0 ? 'Raté' : 'Non renseigné'}
      aria-hidden
    />
  );
}

export function MonthGrid({ initialDate = new Date() }: MonthGridProps) {
  const { isAuthenticated } = useAuth();
  const [currentDate, setCurrentDate] = useState(initialDate);
  const [monthInfo, setMonthInfo] = useState<MonthInfo>(() => getMonthInfo(initialDate));
  const [tasks, setTasks] = useState<Task[]>([]);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [allEntries, setAllEntries] = useState<Entry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = useCallback(async () => {
    if (!isAuthenticated) return;

    setIsLoading(true);
    const info = getMonthInfo(currentDate);
    setMonthInfo(info);

    const startDate = formatDate(info.startDate);
    const endDate = formatDate(info.endDate);

    try {
      const [tasksData, allEntriesData] = await Promise.all([
        getActiveTasks(),
        getEntries()
      ]);

      const monthEntries = allEntriesData.filter(
        e => e.date >= startDate && e.date <= endDate
      );

      setTasks(tasksData);
      setEntries(monthEntries);
      setAllEntries(allEntriesData);
    } catch (error) {
      console.error('Error loading month data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, currentDate]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const goToPreviousMonth = () => setCurrentDate(getPreviousMonth(currentDate));
  const goToNextMonth = () => setCurrentDate(getNextMonth(currentDate));
  const goToToday = () => setCurrentDate(new Date());

  const getEntryValue = (taskId: string, date: string): 1 | 0 | null => {
    const entry = entries.find(e => e.taskId === taskId && e.date === date);
    return entry?.value ?? null;
  };

  if (!isAuthenticated) return null;

  const monthDates = monthInfo.days.map(d => formatDate(d));
  const monthStats = tasks.map(task => ({
    task,
    month: calculateTaskMonthStats(task.id, entries, monthDates),
    global: calculateTaskGlobalStats(task.id, allEntries)
  }));

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
      {/* Header: framed month selector + actions */}
      <Card className="overflow-hidden">
        <CardContent className="p-4 sm:p-5">
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-center gap-2">
              <Button
                variant="outline"
                size="icon"
                className="shrink-0 h-9 w-9 rounded-lg border-2"
                onClick={goToPreviousMonth}
                aria-label="Mois précédent"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <div className="min-w-0 flex-1 flex justify-center">
                <div className="inline-flex items-center justify-center rounded-xl border-2 border-border bg-muted/50 px-4 py-2.5 shadow-sm capitalize">
                  <span className="text-sm font-semibold text-foreground truncate">
                    {monthInfo.label}
                  </span>
                </div>
              </div>
              <Button
                variant="outline"
                size="icon"
                className="shrink-0 h-9 w-9 rounded-lg border-2"
                onClick={goToNextMonth}
                aria-label="Mois suivant"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex items-center justify-center">
              <Button
                variant="outline"
                size="sm"
                className="rounded-lg border-2 h-9 px-4 gap-2"
                onClick={goToToday}
              >
                <Calendar className="w-4 h-4" />
                Aujourd&apos;hui
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Grid: read-only, sticky left (task names) and right (percentages) */}
      <Card>
        <CardContent className="p-0">
          <p className="text-xs text-muted-foreground px-4 py-2 border-b bg-muted/20">
            Vue lecture seule. Modifiez les tâches dans la vue Semaine.
          </p>
          <div className="overflow-x-auto overflow-y-visible -mx-px" style={{ WebkitOverflowScrolling: 'touch' }}>
            <table className="w-full border-collapse" style={{ minWidth: 320 }}>
              <thead>
                <tr className="border-b bg-muted/30">
                  <th
                    className="text-left p-2 font-medium text-xs w-24 sm:w-32 shrink-0 sticky left-0 z-20 bg-muted/50 backdrop-blur-sm border-r"
                    scope="col"
                  >
                    Tâche
                  </th>
                  {monthInfo.days.map((day) => {
                    const dayIsToday = isToday(day);
                    return (
                      <th
                        key={formatDate(day)}
                        className={cn(
                          'text-center p-1 font-medium w-5 sm:w-6 shrink-0',
                          dayIsToday && 'bg-emerald-500/20 dark:bg-emerald-950/40'
                        )}
                        scope="col"
                        title={format(day, 'd MMM', { locale: fr })}
                      >
                        <span className={cn(
                          'text-[9px] sm:text-[10px] tabular-nums text-muted-foreground',
                          dayIsToday && 'text-emerald-600 dark:text-emerald-400 font-bold'
                        )}>
                          {format(day, 'd')}
                        </span>
                      </th>
                    );
                  })}
                  <th
                    className="text-center p-2 font-medium text-xs w-11 shrink-0 sticky right-[44px] z-20 bg-muted/50 backdrop-blur-sm border-l border-r"
                    style={{ width: PERCENT_COL_WIDTH }}
                    scope="col"
                  >
                    Mois
                  </th>
                  <th
                    className="text-center p-2 font-medium text-xs w-11 shrink-0 sticky right-0 z-20 bg-muted/50 backdrop-blur-sm border-l"
                    style={{ width: PERCENT_COL_WIDTH }}
                    scope="col"
                  >
                    Global
                  </th>
                </tr>
              </thead>
              <tbody>
                {monthStats.map(({ task, month, global }) => (
                  <tr key={task.id} className="border-b last:border-0 hover:bg-muted/20">
                    <td className="p-2 sticky left-0 z-10 bg-card border-r shrink-0 w-24 sm:w-32">
                      <div className="font-medium text-xs truncate max-w-[88px] sm:max-w-[120px]" title={task.name}>
                        {task.name}
                      </div>
                      {task.category && (
                        <div className="text-[10px] text-muted-foreground mt-0.5 truncate max-w-[88px] sm:max-w-[120px]">
                          {task.category}
                        </div>
                      )}
                    </td>
                    {monthInfo.days.map((day) => {
                      const dateStr = formatDate(day);
                      const value = getEntryValue(task.id, dateStr);
                      const dayIsToday = isToday(day);
                      return (
                        <td
                          key={dateStr}
                          className={cn(
                            'p-0.5 sm:p-1 shrink-0 w-5 sm:w-6',
                            dayIsToday && 'bg-emerald-500/10 dark:bg-emerald-950/30'
                          )}
                        >
                          <div className="flex items-center justify-center py-0.5">
                            <MonthCell value={value} />
                          </div>
                        </td>
                      );
                    })}
                    <td
                      className="p-1 text-center sticky right-[44px] z-10 bg-card border-l border-r shrink-0"
                      style={{ width: PERCENT_COL_WIDTH }}
                    >
                      <span
                        className={cn(
                          'text-[10px] font-mono font-medium',
                          month.rate >= 70 ? 'text-emerald-600 dark:text-emerald-400' :
                          month.rate >= 40 ? 'text-yellow-600 dark:text-yellow-400' :
                          'text-red-600 dark:text-red-400'
                        )}
                      >
                        {month.total > 0 ? `${month.rate}%` : '—'}
                      </span>
                    </td>
                    <td
                      className="p-1 text-center sticky right-0 z-10 bg-card border-l shrink-0"
                      style={{ width: PERCENT_COL_WIDTH }}
                    >
                      <span
                        className={cn(
                          'text-[10px] font-mono font-medium',
                          global.rate >= 70 ? 'text-emerald-600 dark:text-emerald-400' :
                          global.rate >= 40 ? 'text-yellow-600 dark:text-yellow-400' :
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
