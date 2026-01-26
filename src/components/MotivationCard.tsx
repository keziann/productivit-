'use client';

import { useState, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ImagePlus, X, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MotivationCardProps {
  imageUrl: string | null;
  onImageChange: (url: string | null) => Promise<void>;
}

export function MotivationCard({ imageUrl, onImageChange }: MotivationCardProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(imageUrl);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Veuillez sélectionner une image');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('L\'image doit faire moins de 5 Mo');
      return;
    }

    setIsLoading(true);

    try {
      // Convert to base64 for local storage (simple approach)
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result as string;
        setPreviewUrl(base64);
        await onImageChange(base64);
        setIsLoading(false);
      };
      reader.onerror = () => {
        setIsLoading(false);
        alert('Erreur lors du chargement de l\'image');
      };
      reader.readAsDataURL(file);
    } catch (error) {
      setIsLoading(false);
      console.error('Error uploading image:', error);
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemove = async () => {
    setIsLoading(true);
    try {
      setPreviewUrl(null);
      await onImageChange(null);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0 relative aspect-square">
        {previewUrl ? (
          <>
            <img
              src={previewUrl}
              alt="Image de motivation"
              className="w-full h-full object-cover"
            />
            <Button
              variant="destructive"
              size="icon"
              className="absolute top-2 right-2 w-7 h-7 opacity-80 hover:opacity-100"
              onClick={handleRemove}
              disabled={isLoading}
            >
              <X className="w-4 h-4" />
            </Button>
          </>
        ) : (
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading}
            className={cn(
              'w-full h-full flex flex-col items-center justify-center gap-2',
              'bg-muted/50 hover:bg-muted transition-colors',
              'text-muted-foreground hover:text-foreground',
              'cursor-pointer'
            )}
          >
            {isLoading ? (
              <Loader2 className="w-8 h-8 animate-spin" />
            ) : (
              <>
                <ImagePlus className="w-8 h-8" />
                <span className="text-xs font-medium">Ajouter une image</span>
                <span className="text-[10px]">motivante</span>
              </>
            )}
          </button>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />

        {isLoading && previewUrl && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-white animate-spin" />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

