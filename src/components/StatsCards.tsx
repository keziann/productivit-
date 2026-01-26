'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Target, CheckCircle2, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatsCardsProps {
  dayStats: {
    completed: number;
    total: number;
    rate: number;
    filled: number;
    fillRate: number;
  };
  totalTasks: number;
}

export function DayStatsCards({ dayStats, totalTasks }: StatsCardsProps) {
  return (
    <>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            Complétées
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {dayStats.completed}/{dayStats.total}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            tâches réussies
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <Target className="w-4 h-4 text-blue-500" />
            Score
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className={cn(
            'text-2xl font-bold',
            dayStats.rate >= 70 ? 'text-emerald-600' :
            dayStats.rate >= 40 ? 'text-yellow-600' :
            'text-red-600'
          )}>
            {dayStats.rate}%
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            taux de réussite
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-purple-500" />
            Complétion
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {dayStats.filled}/{totalTasks}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            cases remplies ({dayStats.fillRate}%)
          </p>
        </CardContent>
      </Card>
    </>
  );
}
