'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { DailyTasks } from '@/components/DailyTasks';
import { DayNotes } from '@/components/DayNotes';
import { DayStatsCards } from '@/components/StatsCards';
import { TaskStatsList } from '@/components/TaskStatsList';
import { MotivationCard } from '@/components/MotivationCard';
import { useAuth } from '@/components/AuthProvider';
import {
  getActiveTasks,
  getEntriesForDate,
  getEntries,
  getUserSettings,
  saveMotivationImage
} from '@/lib/data';
import type { Task, Entry } from '@/lib/db';
import {
  formatDate,
  calculateDayStats,
  getTaskStatsByRange
} from '@/lib/stats';
import { Calendar, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { getCurrentUserName } from '@/lib/users';

export default function DashboardPage() {
  const { isAuthenticated } = useAuth();
  
  const [tasks, setTasks] = useState<Task[]>([]);
  const [todayEntries, setTodayEntries] = useState<Entry[]>([]);
  const [allEntries, setAllEntries] = useState<Entry[]>([]);
  const [statsRange, setStatsRange] = useState<'7d' | '30d' | 'all'>('30d');
  const [motivationImage, setMotivationImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const today = new Date();
  const todayStr = formatDate(today);

  const loadData = useCallback(async () => {
    if (!isAuthenticated) return;
    
    setIsLoading(true);
    try {
      const [tasksData, todayData, allData, settings] = await Promise.all([
        getActiveTasks(),
        getEntriesForDate(todayStr),
        getEntries(),
        getUserSettings()
      ]);
      setTasks(tasksData);
      setTodayEntries(todayData);
      setAllEntries(allData);
      setMotivationImage(settings?.motivation_image_url || null);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, todayStr]);

  useEffect(() => {
    if (isAuthenticated) {
      loadData();
      // Refresh every 30 seconds
      const interval = setInterval(loadData, 30000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated, loadData]);

  const handleMotivationImageChange = async (url: string | null) => {
    if (!isAuthenticated) return;
    setMotivationImage(url);
    await saveMotivationImage(url);
  };

  const dayStats = calculateDayStats(todayEntries, tasks);
  const taskStats = getTaskStatsByRange(tasks, allEntries, statsRange);

  if (!isAuthenticated) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto p-4 md:p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-48" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-28 bg-muted rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">
            Bonjour {getCurrentUserName() ? `${getCurrentUserName()} ` : ''}👋
          </h1>
          <p className="text-muted-foreground mt-1">
            {format(today, "EEEE d MMMM yyyy", { locale: fr })}
          </p>
        </div>
        <Link href="/week">
          <Button variant="outline" className="gap-2">
            <Calendar className="w-4 h-4" />
            Voir la semaine
            <ArrowRight className="w-4 h-4" />
          </Button>
        </Link>
      </div>

      {/* Stats grid with Motivation image */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <DayStatsCards dayStats={dayStats} totalTasks={tasks.length} />
        
        {/* Motivation image card */}
        <MotivationCard
          imageUrl={motivationImage}
          onImageChange={handleMotivationImageChange}
        />
      </div>

      {/* Main content */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Left column */}
        <div className="space-y-6">
          <DailyTasks date={today} />
          <DayNotes date={todayStr} dateObj={today} />
        </div>

        {/* Right column */}
        <div className="space-y-6">
          <TaskStatsList
            stats={taskStats}
            range={statsRange}
            onRangeChange={setStatsRange}
          />
        </div>
      </div>
    </div>
  );
}
