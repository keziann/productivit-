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
    <Card className="overflow-hidden">
      <CardHeader className="pb-3 bg-gradient-to-r from-primary/5 to-transparent">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <CardTitle className="text-base flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary" />
            Statistiques par tâche
          </CardTitle>

          {/* Range selector */}
          <div className="flex gap-1 bg-muted rounded-xl p-1">
            <Button
              variant={range === '7d' ? 'default' : 'ghost'}
              size="sm"
              className="h-8 px-3 text-xs rounded-lg"
              onClick={() => onRangeChange('7d')}
            >
              7j
            </Button>
            <Button
              variant={range === '30d' ? 'default' : 'ghost'}
              size="sm"
              className="h-8 px-3 text-xs rounded-lg"
              onClick={() => onRangeChange('30d')}
            >
              30j
            </Button>
            <Button
              variant={range === 'all' ? 'default' : 'ghost'}
              size="sm"
              className="h-8 px-3 text-xs rounded-lg"
              onClick={() => onRangeChange('all')}
            >
              Tout
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {stats.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            Aucune tâche active
          </p>
        ) : (
          <div className="divide-y divide-border/50">
            {stats.map((stat) => {
              const hasData = stat.successCount + stat.partialCount + stat.failCount > 0;
              const rate = stat.successRate ?? 0;

              return (
                <div
                  key={stat.taskId}
                  className="px-4 py-3 hover:bg-muted/20 transition-colors"
                >
                  {/* Task name and rate */}
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="font-medium text-sm truncate flex-1">
                      {stat.taskName}
                    </span>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {hasData ? (
                        <Badge
                          className={cn(
                            'font-mono text-xs px-2 py-0.5',
                            rate >= 70 ? 'bg-emerald-500 hover:bg-emerald-600 text-white' :
                            rate >= 40 ? 'bg-orange-500 hover:bg-orange-600 text-white' :
                            'bg-red-500 hover:bg-red-600 text-white'
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
                  <div className="flex items-center gap-3 text-xs text-muted-foreground mb-2">
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      <span className="font-medium text-emerald-600 dark:text-emerald-400">
                        {stat.successCount}
                      </span>
                    </span>
                    {stat.partialCount > 0 && (
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-orange-500" />
                        <span className="font-medium text-orange-600 dark:text-orange-400">
                          {stat.partialCount}
                        </span>
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-red-500" />
                      <span className="font-medium text-red-600 dark:text-red-400">
                        {stat.failCount}
                      </span>
                    </span>
                  </div>

                  {/* Mini progress bar */}
                  {hasData && (
                    <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className={cn(
                          'h-full transition-all duration-300 rounded-full',
                          rate >= 70 ? 'bg-emerald-500' :
                          rate >= 40 ? 'bg-orange-500' :
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
