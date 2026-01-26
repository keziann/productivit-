'use client';

import { useRouter } from 'next/navigation';
import { ImportExport } from '@/components/ImportExport';
import { SyncCard } from '@/components/SyncCard';
import { useAuth } from '@/components/AuthProvider';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Database, Info, LogOut, User } from 'lucide-react';
import { signOut } from '@/lib/auth';

export default function SettingsPage() {
  const { user, syncStatus, forceSync } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await signOut();
    router.push('/login');
  };

  if (!user) {
    return null;
  }

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-6 space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">Réglages</h1>
        <p className="text-muted-foreground mt-1">
          Gérez votre compte et vos données
        </p>
      </div>

      {/* Account card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Compte
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">{user.email}</p>
              <p className="text-sm text-muted-foreground">Connecté via magic link</p>
            </div>
            <Button variant="outline" onClick={handleLogout} className="gap-2">
              <LogOut className="w-4 h-4" />
              Déconnexion
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Sync card */}
      <SyncCard
        syncStatus={syncStatus}
        onForceSync={forceSync}
      />

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
                Elles sont synchronisées automatiquement entre tous vos appareils.
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="font-medium text-sm">Caractéristiques :</h4>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">Sync automatique</Badge>
              <Badge variant="secondary">Multi-appareils</Badge>
              <Badge variant="secondary">Mode hors-ligne</Badge>
              <Badge variant="secondary">Données chiffrées</Badge>
            </div>
          </div>

          <div className="pt-2 text-xs text-muted-foreground">
            ✅ Les modifications sont sauvegardées en temps réel.
            En cas de perte de connexion, elles seront synchronisées automatiquement au retour du réseau.
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
