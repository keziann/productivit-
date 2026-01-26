'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { TaskStatsByRange } from '@/lib/stats';

interface TaskStatsListProps {
  stats: TaskStatsByRange[];
  range: '7d' | '30d' | 'all';
  onRangeChange: (range: '7d' | '30d' | 'all') => void;
}

export function TaskStatsList({ stats, range, onRangeChange }: TaskStatsListProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <CardTitle className="text-base flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Statistiques par tâche
          </CardTitle>
          
          {/* Range selector */}
          <div className="flex gap-1 bg-muted rounded-lg p-1">
            <Button
              variant={range === '7d' ? 'default' : 'ghost'}
              size="sm"
              className="h-7 px-3 text-xs"
              onClick={() => onRangeChange('7d')}
            >
              7j
            </Button>
            <Button
              variant={range === '30d' ? 'default' : 'ghost'}
              size="sm"
              className="h-7 px-3 text-xs"
              onClick={() => onRangeChange('30d')}
            >
              30j
            </Button>
            <Button
              variant={range === 'all' ? 'default' : 'ghost'}
              size="sm"
              className="h-7 px-3 text-xs"
              onClick={() => onRangeChange('all')}
            >
              Tout
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {stats.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            Aucune tâche active
          </p>
        ) : (
          <div className="space-y-3">
            {stats.map((stat) => {
              const hasData = stat.successCount + stat.failCount > 0;
              const rate = stat.successRate ?? 0;
              
              return (
                <div
                  key={stat.taskId}
                  className="space-y-2 p-3 rounded-lg border bg-card hover:bg-muted/30 transition-colors"
                >
                  {/* Task name and rate */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium text-sm truncate flex-1">
                      {stat.taskName}
                    </span>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {hasData ? (
                        <Badge
                          variant="secondary"
                          className={cn(
                            'font-mono text-xs',
                            rate >= 70 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                            rate >= 40 ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                            'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                          )}
                        >
                          {rate}%
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground font-mono">—</span>
                      )}
                    </div>
                  </div>

                  {/* Stats row */}
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span>
                      <span className="font-medium text-emerald-600 dark:text-emerald-400">
                        Réussites: {stat.successCount}
                      </span>
                    </span>
                    <span>
                      <span className="font-medium text-red-600 dark:text-red-400">
                        Échecs: {stat.failCount}
                      </span>
                    </span>
                  </div>

                  {/* Mini progress bar */}
                  {hasData && (
                    <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className={cn(
                          'h-full transition-all duration-300',
                          rate >= 70 ? 'bg-emerald-500' :
                          rate >= 40 ? 'bg-yellow-500' :
                          'bg-red-500'
                        )}
                        style={{ width: `${rate}%` }}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

