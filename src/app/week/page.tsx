'use client';

import { useState } from 'react';
import { WeekGrid } from '@/components/WeekGrid';
import { MonthGrid } from '@/components/MonthGrid';
import { WeekNotes } from '@/components/DayNotes';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { getWeekInfo, formatDate } from '@/lib/stats';
import { CalendarDays, Calendar } from 'lucide-react';

export default function WeekPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<'week' | 'month'>('week');

  const weekInfo = getWeekInfo(currentDate);
  const days = weekInfo.days.map(d => ({
    date: formatDate(d),
    dateObj: d
  }));

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">Semaine / Mois</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          {view === 'week'
            ? 'Cliquez sur une cellule pour marquer la tâche (✓ fait / ✗ raté / vide).'
            : 'Vue lecture seule du mois. Modifiez les tâches dans l’onglet Semaine.'}
        </p>
      </div>

      <Tabs value={view} onValueChange={(v) => setView(v as 'week' | 'month')} className="w-full">
        <TabsList className="grid w-full max-w-xs grid-cols-2 rounded-xl border-2 p-1 bg-muted/50">
          <TabsTrigger value="week" className="gap-2 rounded-lg data-[state=active]:shadow-sm">
            <CalendarDays className="w-4 h-4" />
            Semaine
          </TabsTrigger>
          <TabsTrigger value="month" className="gap-2 rounded-lg data-[state=active]:shadow-sm">
            <Calendar className="w-4 h-4" />
            Mois
          </TabsTrigger>
        </TabsList>

        <TabsContent value="week" className="mt-6 space-y-6">
          <WeekGrid initialDate={currentDate} />
          <WeekNotes days={days} />
        </TabsContent>

        <TabsContent value="month" className="mt-6">
          <MonthGrid initialDate={currentDate} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
