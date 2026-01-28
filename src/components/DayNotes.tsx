'use client';

import { useState, useEffect, useCallback } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen, FileText } from 'lucide-react';
import { useAuth } from './AuthProvider';
import { getDayNote, saveDayNote } from '@/lib/data';
import { formatDateDisplay } from '@/lib/stats';

interface DayNotesProps {
  date: string;
  dateObj: Date;
  compact?: boolean;
}

export function DayNotes({ date, dateObj, compact = false }: DayNotesProps) {
  const { isAuthenticated } = useAuth();
  const [learnedText, setLearnedText] = useState('');
  const [notesText, setNotesText] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Load notes
  useEffect(() => {
    if (!isAuthenticated) return;
    
    getDayNote(date).then((note) => {
      if (note) {
        setLearnedText(note.learnedText);
        setNotesText(note.notesText);
      } else {
        setLearnedText('');
        setNotesText('');
      }
    }).catch(console.error);
  }, [isAuthenticated, date]);

  // Autosave with debounce
  const saveNotes = useCallback(async (learned: string, notes: string) => {
    if (!isAuthenticated) return;
    
    setIsSaving(true);
    try {
      await saveDayNote(date, learned, notes);
    } catch (error) {
      console.error('Error saving notes:', error);
    }
    setTimeout(() => setIsSaving(false), 500);
  }, [isAuthenticated, date]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (isAuthenticated && (learnedText || notesText)) {
        saveNotes(learnedText, notesText);
      }
    }, 800);

    return () => clearTimeout(timer);
  }, [learnedText, notesText, saveNotes, isAuthenticated]);

  if (!isAuthenticated) return null;

  if (compact) {
    return (
      <div className="space-y-2">
        <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          {formatDateDisplay(dateObj)}
        </div>
        <div className="grid gap-2">
          <div className="relative">
            <BookOpen className="absolute left-2 top-2 w-3 h-3 text-muted-foreground" />
            <Textarea
              value={learnedText}
              onChange={(e) => setLearnedText(e.target.value)}
              placeholder="Appris aujourd'hui..."
              className="pl-7 text-xs min-h-[60px] resize-none"
            />
          </div>
          <div className="relative">
            <FileText className="absolute left-2 top-2 w-3 h-3 text-muted-foreground" />
            <Textarea
              value={notesText}
              onChange={(e) => setNotesText(e.target.value)}
              placeholder="Notes..."
              className="pl-7 text-xs min-h-[60px] resize-none"
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center justify-between">
          <span>Notes du jour</span>
          {isSaving && (
            <span className="text-xs text-muted-foreground font-normal">
              Sauvegarde...
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="text-sm font-medium flex items-center gap-2 mb-2">
            <BookOpen className="w-4 h-4 text-emerald-500" />
            Appris aujourd'hui
          </label>
          <Textarea
            value={learnedText}
            onChange={(e) => setLearnedText(e.target.value)}
            placeholder="Qu'avez-vous appris aujourd'hui ?"
            className="min-h-[80px] resize-none"
          />
        </div>
        <div>
          <label className="text-sm font-medium flex items-center gap-2 mb-2">
            <FileText className="w-4 h-4 text-blue-500" />
            Notes & remarques
          </label>
          <Textarea
            value={notesText}
            onChange={(e) => setNotesText(e.target.value)}
            placeholder="Remarques, réflexions..."
            className="min-h-[80px] resize-none"
          />
        </div>
      </CardContent>
    </Card>
  );
}

// Week notes component
interface WeekNotesProps {
  days: { date: string; dateObj: Date }[];
}

export function WeekNotes({ days }: WeekNotesProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Notes de la semaine</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {days.map(({ date, dateObj }) => (
            <DayNotes key={date} date={date} dateObj={dateObj} compact />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
