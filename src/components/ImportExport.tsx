'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Download, Upload, AlertCircle, CheckCircle2 } from 'lucide-react';
import { exportData, importData, type ExportData } from '@/lib/db';

export function ImportExport() {
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = async () => {
    setIsExporting(true);
    setStatus(null);

    try {
      const data = await exportData();
      const json = JSON.stringify(data, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `habit-tracker-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setStatus({
        type: 'success',
        message: `Export réussi ! ${data.tasks.length} tâches, ${data.entries.length} entrées, ${data.dayNotes.length} notes.`
      });
    } catch (error) {
      setStatus({
        type: 'error',
        message: 'Erreur lors de l\'export : ' + (error as Error).message
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    setStatus(null);

    try {
      const text = await file.text();
      const data: ExportData = JSON.parse(text);

      // Validate structure
      if (!data.tasks || !data.entries || !data.dayNotes) {
        throw new Error('Format de fichier invalide');
      }

      await importData(data, true); // merge = true

      setStatus({
        type: 'success',
        message: `Import réussi ! ${data.tasks.length} tâches, ${data.entries.length} entrées, ${data.dayNotes.length} notes importées.`
      });

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      // Reload page to reflect changes
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error) {
      setStatus({
        type: 'error',
        message: 'Erreur lors de l\'import : ' + (error as Error).message
      });
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Import / Export</CardTitle>
        <CardDescription>
          Sauvegardez ou restaurez vos données au format JSON
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-3">
          <Button
            onClick={handleExport}
            disabled={isExporting}
            variant="outline"
            className="gap-2"
          >
            <Download className="w-4 h-4" />
            {isExporting ? 'Export...' : 'Exporter JSON'}
          </Button>

          <Button
            onClick={handleImportClick}
            disabled={isImporting}
            variant="outline"
            className="gap-2"
          >
            <Upload className="w-4 h-4" />
            {isImporting ? 'Import...' : 'Importer JSON'}
          </Button>

          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>

        {status && (
          <div className={`flex items-start gap-2 p-3 rounded-lg text-sm ${
            status.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-300'
              : 'bg-red-50 text-red-800 dark:bg-red-900/20 dark:text-red-300'
          }`}>
            {status.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            )}
            {status.message}
          </div>
        )}

        <p className="text-xs text-muted-foreground">
          L'import fusionne les données existantes (merge). Les tâches avec le même ID sont mises à jour.
        </p>
      </CardContent>
    </Card>
  );
}

