'use client';

import { useState } from 'react';
import { WeekGrid } from '@/components/WeekGrid';
import { WeekNotes } from '@/components/DayNotes';
import { getWeekInfo, formatDate } from '@/lib/stats';

export default function WeekPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const weekInfo = getWeekInfo(currentDate);

  const days = weekInfo.days.map(d => ({
    date: formatDate(d),
    dateObj: d
  }));

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">Vue Semaine</h1>
        <p className="text-muted-foreground mt-1">
          Cliquez sur une cellule pour marquer la tâche (✓ fait / ✗ raté / vide)
        </p>
      </div>

      <WeekGrid initialDate={currentDate} />
      
      <WeekNotes days={days} />
    </div>
  );
}

