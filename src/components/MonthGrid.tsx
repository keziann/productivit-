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

// Read-only cell: small colored square (green / orange / red / gray)
function MonthCell({ value }: { value: 1 | 0.5 | 0 | null }) {
  return (
    <div
      className={cn(
        'w-5 h-5 sm:w-6 sm:h-6 rounded-md shrink-0 mx-auto transition-colors',
        value === 1 && 'bg-emerald-500',
        value === 0.5 && 'bg-orange-500',
        value === 0 && 'bg-red-500',
        value === null && 'bg-muted border border-dashed border-muted-foreground/20'
      )}
      title={
        value === 1 ? 'Fait' :
        value === 0.5 ? 'Partiel' :
        value === 0 ? 'Raté' :
        'Non renseigné'
      }
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

  const getEntryValue = (taskId: string, date: string): 1 | 0.5 | 0 | null => {
    const entry = entries.find(e => e.taskId === taskId && e.date === date);
    return (entry?.value as 1 | 0.5 | 0 | null) ?? null;
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
      {/* Header: Month navigation */}
      <Card className="overflow-hidden">
        <CardContent className="p-4">
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-center gap-3">
              <Button
                variant="outline"
                size="icon"
                className="shrink-0 h-10 w-10 rounded-xl"
                onClick={goToPreviousMonth}
                aria-label="Mois précédent"
              >
                <ChevronLeft className="w-5 h-5" />
              </Button>
              <div className="flex-1 flex justify-center">
                <div className="inline-flex items-center justify-center rounded-xl bg-primary/10 px-5 py-2.5 capitalize">
                  <span className="text-sm font-bold text-primary">
                    {monthInfo.label}
                  </span>
                </div>
              </div>
              <Button
                variant="outline"
                size="icon"
                className="shrink-0 h-10 w-10 rounded-xl"
                onClick={goToNextMonth}
                aria-label="Mois suivant"
              >
                <ChevronRight className="w-5 h-5" />
              </Button>
            </div>
            <div className="flex items-center justify-center">
              <Button
                variant="outline"
                size="sm"
                className="rounded-xl h-10 px-4 gap-2"
                onClick={goToToday}
              >
                <Calendar className="w-4 h-4" />
                Aujourd&apos;hui
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Grid: read-only */}
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <p className="text-xs text-muted-foreground px-4 py-2 border-b bg-muted/30">
            Vue lecture seule. Modifiez les tâches dans la vue Semaine.
          </p>
          <div className="overflow-x-auto" style={{ WebkitOverflowScrolling: 'touch' }}>
            <table className="w-full border-collapse" style={{ minWidth: 320 }}>
              <thead>
                <tr className="border-b bg-muted/40">
                  <th
                    className="text-left p-2 font-semibold text-xs w-24 sm:w-32 sticky left-0 z-20 bg-muted/80 backdrop-blur-sm border-r"
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
                          'text-center p-1 font-medium w-5 sm:w-6',
                          dayIsToday && 'bg-primary/10'
                        )}
                        scope="col"
                        title={format(day, 'd MMM', { locale: fr })}
                      >
                        <span className={cn(
                          'text-[9px] sm:text-[10px] tabular-nums text-muted-foreground',
                          dayIsToday && 'text-primary font-bold'
                        )}>
                          {format(day, 'd')}
                        </span>
                      </th>
                    );
                  })}
                  <th
                    className="text-center p-2 font-semibold text-xs w-11 sticky right-11 z-20 bg-muted/80 backdrop-blur-sm border-l"
                    style={{ width: PERCENT_COL_WIDTH }}
                    scope="col"
                  >
                    Mois
                  </th>
                  <th
                    className="text-center p-2 font-semibold text-xs w-11 sticky right-0 z-20 bg-muted/80 backdrop-blur-sm border-l"
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
                    <td className="p-2 sticky left-0 z-10 bg-card border-r w-24 sm:w-32">
                      <div className="font-medium text-xs truncate max-w-20 sm:max-w-28" title={task.name}>
                        {task.name}
                      </div>
                      <div className="flex items-center gap-1 mt-0.5">
                        {task.category && (
                          <span className="text-[9px] text-muted-foreground truncate max-w-16">
                            {task.category}
                          </span>
                        )}
                        {task.allowPartial && (
                          <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                        )}
                      </div>
                    </td>
                    {monthInfo.days.map((day) => {
                      const dateStr = formatDate(day);
                      const value = getEntryValue(task.id, dateStr);
                      const dayIsToday = isToday(day);
                      return (
                        <td
                          key={dateStr}
                          className={cn(
                            'p-0.5 sm:p-1 w-5 sm:w-6',
                            dayIsToday && 'bg-primary/5'
                          )}
                        >
                          <div className="flex items-center justify-center py-0.5">
                            <MonthCell value={value} />
                          </div>
                        </td>
                      );
                    })}
                    <td
                      className="p-1 text-center sticky right-11 z-10 bg-card border-l"
                      style={{ width: PERCENT_COL_WIDTH }}
                    >
                      <span
                        className={cn(
                          'text-[10px] font-mono font-bold',
                          month.rate >= 70 ? 'text-emerald-600 dark:text-emerald-400' :
                          month.rate >= 40 ? 'text-orange-600 dark:text-orange-400' :
                          'text-red-600 dark:text-red-400'
                        )}
                      >
                        {month.total > 0 ? `${month.rate}%` : '—'}
                      </span>
                    </td>
                    <td
                      className="p-1 text-center sticky right-0 z-10 bg-card border-l"
                      style={{ width: PERCENT_COL_WIDTH }}
                    >
                      <span
                        className={cn(
                          'text-[10px] font-mono font-bold',
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
