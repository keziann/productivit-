'use client';

import { ImportExport } from '@/components/ImportExport';
import { useAuth } from '@/components/AuthProvider';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Database, Info, LogOut, User } from 'lucide-react';

export default function SettingsPage() {
  const { isAuthenticated, logout } = useAuth();

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-6 space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">Réglages</h1>
        <p className="text-muted-foreground mt-1">
          Gérez vos données
        </p>
      </div>

      {/* Account card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Session
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Connecté</p>
              <p className="text-sm text-muted-foreground">Session active</p>
            </div>
            <Button variant="outline" onClick={logout} className="gap-2">
              <LogOut className="w-4 h-4" />
              Déconnexion
            </Button>
          </div>
        </CardContent>
      </Card>

      <ImportExport />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5" />
            Stockage cloud
          </CardTitle>
          <CardDescription>
            Vos données sont synchronisées avec Supabase
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
            <Info className="w-5 h-5 text-blue-500 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium">Supabase Cloud</p>
              <p className="text-muted-foreground mt-1">
                Vos données sont stockées de manière sécurisée dans le cloud.
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="font-medium text-sm">Caractéristiques :</h4>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">Sync automatique</Badge>
              <Badge variant="secondary">Mode hors-ligne</Badge>
              <Badge variant="secondary">Données persistantes</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>À propos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            <strong>Habit Tracker</strong> est une application pour suivre
            vos habitudes quotidiennes.
          </p>
          <p>
            Stack : Next.js, TypeScript, TailwindCSS, shadcn/ui, Supabase
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
