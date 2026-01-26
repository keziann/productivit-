'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Cloud, CloudOff, RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { SyncStatus } from '@/lib/outbox';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

interface SyncCardProps {
  syncStatus: SyncStatus;
  onForceSync: () => Promise<void>;
  isLoading?: boolean;
}

export function SyncCard({ syncStatus, onForceSync, isLoading = false }: SyncCardProps) {
  const { isOnline, pendingCount, lastSyncAt, error } = syncStatus;

  const getStatusIcon = () => {
    if (!isOnline) return <CloudOff className="w-4 h-4 text-yellow-500" />;
    if (error) return <AlertCircle className="w-4 h-4 text-red-500" />;
    if (pendingCount > 0) return <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />;
    return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
  };

  const getStatusText = () => {
    if (!isOnline) return 'Hors ligne';
    if (error) return 'Erreur';
    if (pendingCount > 0) return 'Synchronisation...';
    return 'Synchronisé';
  };

  const getStatusColor = () => {
    if (!isOnline) return 'text-yellow-600 dark:text-yellow-400';
    if (error) return 'text-red-600 dark:text-red-400';
    if (pendingCount > 0) return 'text-blue-600 dark:text-blue-400';
    return 'text-emerald-600 dark:text-emerald-400';
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
          <Cloud className="w-4 h-4" />
          Sync
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Status */}
        <div className="flex items-center gap-2">
          {getStatusIcon()}
          <span className={cn('text-sm font-medium', getStatusColor())}>
            {getStatusText()}
          </span>
        </div>

        {/* Pending count */}
        {pendingCount > 0 && (
          <p className="text-xs text-muted-foreground">
            {pendingCount} action{pendingCount > 1 ? 's' : ''} en attente
          </p>
        )}

        {/* Last sync */}
        {lastSyncAt && (
          <p className="text-xs text-muted-foreground">
            Dernière sync: {formatDistanceToNow(lastSyncAt, { addSuffix: true, locale: fr })}
          </p>
        )}

        {/* Offline warning */}
        {!isOnline && (
          <p className="text-xs text-yellow-600 dark:text-yellow-400">
            Les changements seront synchronisés au retour du réseau
          </p>
        )}

        {/* Error message */}
        {error && (
          <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
        )}

        {/* Force sync button */}
        <Button
          variant="outline"
          size="sm"
          onClick={onForceSync}
          disabled={!isOnline || isLoading}
          className="w-full text-xs h-8"
        >
          {isLoading ? (
            <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
          ) : (
            <RefreshCw className="w-3 h-3 mr-1" />
          )}
          Forcer la sync
        </Button>
      </CardContent>
    </Card>
  );
}

