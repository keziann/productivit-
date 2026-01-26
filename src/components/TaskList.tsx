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
  GripVertical
} from 'lucide-react';
import { useAuth } from './AuthProvider';
import {
  fetchTasks,
  upsertTask,
  deleteTaskRemote
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
  const { user, refreshSyncStatus } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showArchived, setShowArchived] = useState(false);
  const [newTaskName, setNewTaskName] = useState('');
  const [newTaskCategory, setNewTaskCategory] = useState('');
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [editName, setEditName] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  // Load tasks
  const loadTasks = useCallback(async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const data = await fetchTasks(user.id);
      setTasks(data);
    } catch (error) {
      console.error('Error loading tasks:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  // Add task
  const handleAddTask = async () => {
    if (!user || !newTaskName.trim()) return;
    
    const newTask: Task = {
      id: crypto.randomUUID(),
      name: newTaskName.trim(),
      category: newTaskCategory || undefined,
      active: true,
      schedule: 'daily',
      order: tasks.length,
      createdAt: new Date()
    };

    // Optimistic update
    setTasks(prev => [...prev, newTask]);
    setNewTaskName('');
    setNewTaskCategory('');
    setIsAddDialogOpen(false);

    try {
      await upsertTask(user.id, newTask);
      await refreshSyncStatus();
    } catch (error) {
      console.error('Error adding task:', error);
      loadTasks(); // Reload on error
    }
  };

  // Update task
  const handleUpdateTask = async () => {
    if (!user || !editingTask || !editName.trim()) return;

    const updatedTask = {
      ...editingTask,
      name: editName.trim(),
      category: editCategory || undefined
    };

    // Optimistic update
    setTasks(prev => prev.map(t => t.id === editingTask.id ? updatedTask : t));
    setEditingTask(null);

    try {
      await upsertTask(user.id, updatedTask);
      await refreshSyncStatus();
    } catch (error) {
      console.error('Error updating task:', error);
      loadTasks();
    }
  };

  // Archive/unarchive task
  const handleToggleArchive = async (task: Task) => {
    if (!user) return;

    const updatedTask = { ...task, active: !task.active };
    
    // Optimistic update
    setTasks(prev => prev.map(t => t.id === task.id ? updatedTask : t));

    try {
      await upsertTask(user.id, updatedTask);
      await refreshSyncStatus();
    } catch (error) {
      console.error('Error toggling archive:', error);
      loadTasks();
    }
  };

  // Delete task
  const handleDeleteTask = async (taskId: string) => {
    if (!user || !confirm('Supprimer cette tâche et toutes ses entrées ?')) return;

    // Optimistic update
    setTasks(prev => prev.filter(t => t.id !== taskId));

    try {
      await deleteTaskRemote(user.id, taskId);
      await refreshSyncStatus();
    } catch (error) {
      console.error('Error deleting task:', error);
      loadTasks();
    }
  };

  // Reorder tasks
  const handleMoveTask = async (taskId: string, direction: 'up' | 'down') => {
    if (!user) return;
    
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
        await upsertTask(user.id, task);
      }
      await refreshSyncStatus();
    } catch (error) {
      console.error('Error reordering tasks:', error);
      loadTasks();
    }
  };

  if (!user) return null;

  const activeTasks = tasks.filter(t => t.active);
  const archivedTasks = tasks.filter(t => !t.active);

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
      {/* Add task dialog */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Tâches actives ({activeTasks.length})</CardTitle>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-2">
                  <Plus className="w-4 h-4" />
                  Nouvelle tâche
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Nouvelle tâche</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Nom</label>
                    <Input
                      value={newTaskName}
                      onChange={(e) => setNewTaskName(e.target.value)}
                      placeholder="Ex: Méditation 10 min"
                      onKeyDown={(e) => e.key === 'Enter' && handleAddTask()}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Catégorie (optionnel)</label>
                    <div className="flex flex-wrap gap-2">
                      {CATEGORIES.map((cat) => (
                        <Badge
                          key={cat}
                          variant={newTaskCategory === cat ? 'default' : 'outline'}
                          className="cursor-pointer"
                          onClick={() => setNewTaskCategory(newTaskCategory === cat ? '' : cat)}
                        >
                          {cat}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button variant="outline">Annuler</Button>
                  </DialogClose>
                  <Button onClick={handleAddTask} disabled={!newTaskName.trim()}>
                    Ajouter
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {activeTasks.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Aucune tâche. Cliquez sur "Nouvelle tâche" pour commencer.
            </p>
          ) : (
            <div className="space-y-2">
              {activeTasks.map((task, index) => (
                <div
                  key={task.id}
                  className="flex items-center gap-2 p-3 rounded-lg border bg-card hover:bg-muted/30 transition-colors group"
                >
                  <GripVertical className="w-4 h-4 text-muted-foreground/50" />
                  
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm">{task.name}</div>
                    {task.category && (
                      <Badge variant="secondary" className="text-xs mt-1">
                        {task.category}
                      </Badge>
                    )}
                  </div>

                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleMoveTask(task.id, 'up')}
                      disabled={index === 0}
                    >
                      <ChevronUp className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
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
                          className="h-8 w-8"
                          onClick={() => {
                            setEditingTask(task);
                            setEditName(task.name);
                            setEditCategory(task.category || '');
                          }}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Modifier la tâche</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div>
                            <label className="text-sm font-medium mb-2 block">Nom</label>
                            <Input
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                            />
                          </div>
                          <div>
                            <label className="text-sm font-medium mb-2 block">Catégorie</label>
                            <div className="flex flex-wrap gap-2">
                              {CATEGORIES.map((cat) => (
                                <Badge
                                  key={cat}
                                  variant={editCategory === cat ? 'default' : 'outline'}
                                  className="cursor-pointer"
                                  onClick={() => setEditCategory(editCategory === cat ? '' : cat)}
                                >
                                  {cat}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                        <DialogFooter>
                          <DialogClose asChild>
                            <Button variant="outline">Annuler</Button>
                          </DialogClose>
                          <DialogClose asChild>
                            <Button onClick={handleUpdateTask}>Enregistrer</Button>
                          </DialogClose>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>

                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
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
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg text-muted-foreground">
                Archivées ({archivedTasks.length})
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowArchived(!showArchived)}
              >
                {showArchived ? 'Masquer' : 'Afficher'}
              </Button>
            </div>
          </CardHeader>
          {showArchived && (
            <CardContent>
              <div className="space-y-2">
                {archivedTasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center gap-2 p-3 rounded-lg border bg-muted/30 opacity-60 hover:opacity-100 transition-opacity group"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm">{task.name}</div>
                      {task.category && (
                        <Badge variant="outline" className="text-xs mt-1">
                          {task.category}
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleToggleArchive(task)}
                      >
                        <ArchiveRestore className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-red-500 hover:text-red-600"
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
