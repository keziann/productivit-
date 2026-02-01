'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose
} from '@/components/ui/dialog';
import {
  Plus,
  Pencil,
  Trash2,
  Archive,
  ArchiveRestore,
  ChevronUp,
  ChevronDown,
  GripVertical,
  Palette
} from 'lucide-react';
import { useAuth } from './AuthProvider';
import {
  getTasks,
  saveTask,
  removeTask
} from '@/lib/data';
import type { Task } from '@/lib/db';
import { cn } from '@/lib/utils';

const CATEGORIES = [
  'Santé',
  'Sommeil',
  'Travail',
  'Sport',
  'Bien-être',
  'Apprentissage',
  'Organisation',
  'Autre'
];

export function TaskList() {
  const { isAuthenticated } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showArchived, setShowArchived] = useState(false);
  const [newTaskName, setNewTaskName] = useState('');
  const [newTaskCategory, setNewTaskCategory] = useState('');
  const [newTaskAllowPartial, setNewTaskAllowPartial] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [editName, setEditName] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editAllowPartial, setEditAllowPartial] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  // Load tasks
  const loadTasks = useCallback(async () => {
    if (!isAuthenticated) return;

    setIsLoading(true);
    try {
      const data = await getTasks();
      setTasks(data);
    } catch (error) {
      console.error('Error loading tasks:', error);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  // Add task
  const handleAddTask = async () => {
    if (!isAuthenticated || !newTaskName.trim()) return;

    const newTask: Task = {
      id: crypto.randomUUID(),
      name: newTaskName.trim(),
      category: newTaskCategory || undefined,
      active: true,
      schedule: 'daily',
      order: tasks.length,
      allowPartial: newTaskAllowPartial,
      createdAt: new Date()
    };

    // Optimistic update
    setTasks(prev => [...prev, newTask]);
    setNewTaskName('');
    setNewTaskCategory('');
    setNewTaskAllowPartial(false);
    setIsAddDialogOpen(false);

    try {
      await saveTask(newTask);
    } catch (error) {
      console.error('Error adding task:', error);
      loadTasks(); // Reload on error
    }
  };

  // Update task
  const handleUpdateTask = async () => {
    if (!isAuthenticated || !editingTask || !editName.trim()) return;

    const updatedTask = {
      ...editingTask,
      name: editName.trim(),
      category: editCategory || undefined,
      allowPartial: editAllowPartial
    };

    // Optimistic update
    setTasks(prev => prev.map(t => t.id === editingTask.id ? updatedTask : t));
    setEditingTask(null);

    try {
      await saveTask(updatedTask);
    } catch (error) {
      console.error('Error updating task:', error);
      loadTasks();
    }
  };

  // Archive/unarchive task
  const handleToggleArchive = async (task: Task) => {
    if (!isAuthenticated) return;

    const updatedTask = { ...task, active: !task.active };

    // Optimistic update
    setTasks(prev => prev.map(t => t.id === task.id ? updatedTask : t));

    try {
      await saveTask(updatedTask);
    } catch (error) {
      console.error('Error toggling archive:', error);
      loadTasks();
    }
  };

  // Delete task
  const handleDeleteTask = async (taskId: string) => {
    if (!isAuthenticated || !confirm('Supprimer cette tâche et toutes ses entrées ?')) return;

    // Optimistic update
    setTasks(prev => prev.filter(t => t.id !== taskId));

    try {
      await removeTask(taskId);
    } catch (error) {
      console.error('Error deleting task:', error);
      loadTasks();
    }
  };

  // Reorder tasks
  const handleMoveTask = async (taskId: string, direction: 'up' | 'down') => {
    if (!isAuthenticated) return;

    const activeTasks = tasks.filter(t => t.active);
    const currentIndex = activeTasks.findIndex(t => t.id === taskId);
    if (currentIndex === -1) return;

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= activeTasks.length) return;

    const newOrder = [...activeTasks];
    [newOrder[currentIndex], newOrder[newIndex]] = [newOrder[newIndex], newOrder[currentIndex]];

    // Update order values
    const updatedTasks = newOrder.map((t, i) => ({ ...t, order: i }));

    // Optimistic update
    const archivedTasks = tasks.filter(t => !t.active);
    setTasks([...updatedTasks, ...archivedTasks]);

    try {
      // Update all tasks with new order
      for (const task of updatedTasks) {
        await saveTask(task);
      }
    } catch (error) {
      console.error('Error reordering tasks:', error);
      loadTasks();
    }
  };

  if (!isAuthenticated) return null;

  const activeTasks = tasks.filter(t => t.active);
  const archivedTasks = tasks.filter(t => !t.active);

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
      {/* Add task dialog */}
      <Card className="overflow-hidden">
        <CardHeader className="pb-3 bg-gradient-to-r from-primary/5 to-transparent">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Tâches actives ({activeTasks.length})</CardTitle>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-2 rounded-xl h-10">
                  <Plus className="w-4 h-4" />
                  Nouvelle tâche
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Nouvelle tâche</DialogTitle>
                </DialogHeader>
                <div className="space-y-5 py-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Nom</label>
                    <Input
                      value={newTaskName}
                      onChange={(e) => setNewTaskName(e.target.value)}
                      placeholder="Ex: Méditation 10 min"
                      onKeyDown={(e) => e.key === 'Enter' && handleAddTask()}
                      className="h-11 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Catégorie (optionnel)</label>
                    <div className="flex flex-wrap gap-2">
                      {CATEGORIES.map((cat) => (
                        <Badge
                          key={cat}
                          variant={newTaskCategory === cat ? 'default' : 'outline'}
                          className="cursor-pointer h-8 px-3 text-sm rounded-lg"
                          onClick={() => setNewTaskCategory(newTaskCategory === cat ? '' : cat)}
                        >
                          {cat}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div>
                    <button
                      type="button"
                      onClick={() => setNewTaskAllowPartial(!newTaskAllowPartial)}
                      className={cn(
                        'w-full flex items-center gap-3 p-4 rounded-xl border-2 transition-all',
                        newTaskAllowPartial
                          ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20'
                          : 'border-border hover:border-muted-foreground/30'
                      )}
                    >
                      <div className={cn(
                        'w-10 h-10 rounded-xl flex items-center justify-center',
                        newTaskAllowPartial ? 'bg-orange-500 text-white' : 'bg-muted'
                      )}>
                        <Palette className="w-5 h-5" />
                      </div>
                      <div className="flex-1 text-left">
                        <div className="font-medium text-sm">Mode 3 couleurs</div>
                        <div className="text-xs text-muted-foreground">
                          Ajoute une option orange pour "fait mais pas top"
                        </div>
                      </div>
                      <div className={cn(
                        'w-6 h-6 rounded-full border-2 flex items-center justify-center',
                        newTaskAllowPartial ? 'border-orange-500 bg-orange-500' : 'border-muted-foreground/30'
                      )}>
                        {newTaskAllowPartial && (
                          <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                    </button>
                  </div>
                </div>
                <DialogFooter className="gap-2">
                  <DialogClose asChild>
                    <Button variant="outline" className="rounded-xl">Annuler</Button>
                  </DialogClose>
                  <Button onClick={handleAddTask} disabled={!newTaskName.trim()} className="rounded-xl">
                    Ajouter
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {activeTasks.length === 0 ? (
            <p className="text-center text-muted-foreground py-12">
              Aucune tâche. Cliquez sur "Nouvelle tâche" pour commencer.
            </p>
          ) : (
            <div className="divide-y divide-border/50">
              {activeTasks.map((task, index) => (
                <div
                  key={task.id}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors group"
                >
                  <GripVertical className="w-4 h-4 text-muted-foreground/40 shrink-0" />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{task.name}</span>
                      {task.allowPartial && (
                        <span className="w-2 h-2 rounded-full bg-orange-500 shrink-0" title="Mode 3 couleurs" />
                      )}
                    </div>
                    {task.category && (
                      <Badge variant="secondary" className="text-[10px] h-5 px-1.5 mt-1">
                        {task.category}
                      </Badge>
                    )}
                  </div>

                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 md:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 rounded-xl"
                      onClick={() => handleMoveTask(task.id, 'up')}
                      disabled={index === 0}
                    >
                      <ChevronUp className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 rounded-xl"
                      onClick={() => handleMoveTask(task.id, 'down')}
                      disabled={index === activeTasks.length - 1}
                    >
                      <ChevronDown className="w-4 h-4" />
                    </Button>

                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9 rounded-xl"
                          onClick={() => {
                            setEditingTask(task);
                            setEditName(task.name);
                            setEditCategory(task.category || '');
                            setEditAllowPartial(task.allowPartial || false);
                          }}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                          <DialogTitle>Modifier la tâche</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-5 py-4">
                          <div>
                            <label className="text-sm font-medium mb-2 block">Nom</label>
                            <Input
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                              className="h-11 rounded-xl"
                            />
                          </div>
                          <div>
                            <label className="text-sm font-medium mb-2 block">Catégorie</label>
                            <div className="flex flex-wrap gap-2">
                              {CATEGORIES.map((cat) => (
                                <Badge
                                  key={cat}
                                  variant={editCategory === cat ? 'default' : 'outline'}
                                  className="cursor-pointer h-8 px-3 text-sm rounded-lg"
                                  onClick={() => setEditCategory(editCategory === cat ? '' : cat)}
                                >
                                  {cat}
                                </Badge>
                              ))}
                            </div>
                          </div>
                          <div>
                            <button
                              type="button"
                              onClick={() => setEditAllowPartial(!editAllowPartial)}
                              className={cn(
                                'w-full flex items-center gap-3 p-4 rounded-xl border-2 transition-all',
                                editAllowPartial
                                  ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20'
                                  : 'border-border hover:border-muted-foreground/30'
                              )}
                            >
                              <div className={cn(
                                'w-10 h-10 rounded-xl flex items-center justify-center',
                                editAllowPartial ? 'bg-orange-500 text-white' : 'bg-muted'
                              )}>
                                <Palette className="w-5 h-5" />
                              </div>
                              <div className="flex-1 text-left">
                                <div className="font-medium text-sm">Mode 3 couleurs</div>
                                <div className="text-xs text-muted-foreground">
                                  Ajoute une option orange pour "fait mais pas top"
                                </div>
                              </div>
                              <div className={cn(
                                'w-6 h-6 rounded-full border-2 flex items-center justify-center',
                                editAllowPartial ? 'border-orange-500 bg-orange-500' : 'border-muted-foreground/30'
                              )}>
                                {editAllowPartial && (
                                  <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                  </svg>
                                )}
                              </div>
                            </button>
                          </div>
                        </div>
                        <DialogFooter className="gap-2">
                          <DialogClose asChild>
                            <Button variant="outline" className="rounded-xl">Annuler</Button>
                          </DialogClose>
                          <DialogClose asChild>
                            <Button onClick={handleUpdateTask} className="rounded-xl">Enregistrer</Button>
                          </DialogClose>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>

                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 rounded-xl"
                      onClick={() => handleToggleArchive(task)}
                    >
                      <Archive className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Archived tasks */}
      {archivedTasks.length > 0 && (
        <Card className="overflow-hidden">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg text-muted-foreground">
                Archivées ({archivedTasks.length})
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                className="rounded-xl"
                onClick={() => setShowArchived(!showArchived)}
              >
                {showArchived ? 'Masquer' : 'Afficher'}
              </Button>
            </div>
          </CardHeader>
          {showArchived && (
            <CardContent className="p-0">
              <div className="divide-y divide-border/50">
                {archivedTasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center gap-3 px-4 py-3 opacity-60 hover:opacity-100 transition-opacity group"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm">{task.name}</div>
                      {task.category && (
                        <Badge variant="outline" className="text-[10px] h-5 px-1.5 mt-1">
                          {task.category}
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 rounded-xl"
                        onClick={() => handleToggleArchive(task)}
                      >
                        <ArchiveRestore className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 rounded-xl text-red-500 hover:text-red-600"
                        onClick={() => handleDeleteTask(task.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          )}
        </Card>
      )}
    </div>
  );
}
