'use client';

import { TaskList } from '@/components/TaskList';

export default function TasksPage() {
  return (
    <div className="max-w-3xl mx-auto p-4 md:p-6 space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">Gestion des tâches</h1>
        <p className="text-muted-foreground mt-1">
          Créez, modifiez et organisez vos habitudes quotidiennes
        </p>
      </div>

      <TaskList />
    </div>
  );
}

