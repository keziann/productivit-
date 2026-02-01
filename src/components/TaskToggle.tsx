'use client';

import { cn } from '@/lib/utils';
import { Check, X, Minus } from 'lucide-react';

interface TaskToggleProps {
  value: 1 | 0.5 | 0 | null;
  onChange: (value: 1 | 0.5 | 0 | null) => void;
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  allowPartial?: boolean; // Si true, permet la valeur 0.5 (orange)
}

export function TaskToggle({ value, onChange, size = 'md', disabled = false, allowPartial = false }: TaskToggleProps) {
  const handleClick = () => {
    if (disabled) return;

    if (allowPartial) {
      // Cycle: null -> 1 -> 0.5 -> 0 -> null
      if (value === null) onChange(1);
      else if (value === 1) onChange(0.5);
      else if (value === 0.5) onChange(0);
      else onChange(null);
    } else {
      // Cycle: null -> 1 -> 0 -> null
      if (value === null) onChange(1);
      else if (value === 1) onChange(0);
      else onChange(null);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  };

  const sizeClasses = {
    sm: 'w-9 h-9',
    md: 'w-11 h-11',
    lg: 'w-14 h-14'
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      disabled={disabled}
      className={cn(
        'rounded-xl flex items-center justify-center transition-all duration-200 font-medium',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary',
        'active:scale-90 touch-manipulation',
        sizeClasses[size],
        {
          // Null state - empty
          'bg-muted hover:bg-muted/80 border-2 border-dashed border-muted-foreground/20': value === null,
          // Success state - green
          'bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/25': value === 1,
          // Partial state - orange
          'bg-orange-500 hover:bg-orange-600 text-white shadow-lg shadow-orange-500/25': value === 0.5,
          // Failed state - red
          'bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/25': value === 0,
          'opacity-50 cursor-not-allowed': disabled
        }
      )}
      aria-label={
        value === 1 ? 'Fait' :
        value === 0.5 ? 'Partiel' :
        value === 0 ? 'Raté' :
        'Non renseigné'
      }
    >
      {value === 1 && <Check className={iconSizes[size]} strokeWidth={3} />}
      {value === 0.5 && <Minus className={iconSizes[size]} strokeWidth={3} />}
      {value === 0 && <X className={iconSizes[size]} strokeWidth={3} />}
    </button>
  );
}

// Compact version for the week grid
interface TaskToggleCompactProps {
  value: 1 | 0.5 | 0 | null;
  onChange: () => void;
  disabled?: boolean;
  allowPartial?: boolean;
}

export function TaskToggleCompact({ value, onChange, disabled = false }: TaskToggleCompactProps) {
  return (
    <button
      type="button"
      onClick={onChange}
      disabled={disabled}
      className={cn(
        'w-full h-11 rounded-lg flex items-center justify-center transition-all duration-150',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary',
        'active:scale-95 touch-manipulation',
        {
          'bg-muted/60 hover:bg-muted': value === null,
          'bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm': value === 1,
          'bg-orange-500 hover:bg-orange-600 text-white shadow-sm': value === 0.5,
          'bg-red-500 hover:bg-red-600 text-white shadow-sm': value === 0,
          'opacity-50 cursor-not-allowed': disabled
        }
      )}
    >
      {value === 1 && <Check className="w-4 h-4" strokeWidth={3} />}
      {value === 0.5 && <Minus className="w-4 h-4" strokeWidth={3} />}
      {value === 0 && <X className="w-4 h-4" strokeWidth={3} />}
    </button>
  );
}
