'use client';

import { cn } from '@/lib/utils';
import { Check, X } from 'lucide-react';

interface TaskToggleProps {
  value: 1 | 0 | null;
  onChange: (value: 1 | 0 | null) => void;
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
}

export function TaskToggle({ value, onChange, size = 'md', disabled = false }: TaskToggleProps) {
  const handleClick = () => {
    if (disabled) return;
    // Cycle: null -> 1 -> 0 -> null
    if (value === null) onChange(1);
    else if (value === 1) onChange(0);
    else onChange(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  };

  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12'
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
        'rounded-lg flex items-center justify-center transition-all duration-200 font-medium',
        'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500',
        'active:scale-95',
        sizeClasses[size],
        {
          // Null state - empty
          'bg-secondary hover:bg-secondary/80 border-2 border-dashed border-muted-foreground/30': value === null,
          // Success state - green
          'bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm shadow-emerald-500/30': value === 1,
          // Failed state - red
          'bg-red-500 hover:bg-red-600 text-white shadow-sm shadow-red-500/30': value === 0,
          'opacity-50 cursor-not-allowed': disabled
        }
      )}
      aria-label={value === 1 ? 'Fait' : value === 0 ? 'Raté' : 'Non renseigné'}
    >
      {value === 1 && <Check className={iconSizes[size]} strokeWidth={3} />}
      {value === 0 && <X className={iconSizes[size]} strokeWidth={3} />}
    </button>
  );
}

// Compact version for the week grid
export function TaskToggleCompact({ value, onChange, disabled = false }: Omit<TaskToggleProps, 'size'>) {
  const handleClick = () => {
    if (disabled) return;
    if (value === null) onChange(1);
    else if (value === 1) onChange(0);
    else onChange(null);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled}
      className={cn(
        'w-full h-10 rounded-md flex items-center justify-center transition-all duration-150',
        'focus:outline-none focus:ring-2 focus:ring-inset focus:ring-emerald-500',
        'active:scale-95',
        {
          'bg-muted hover:bg-muted/80': value === null,
          'bg-emerald-500 hover:bg-emerald-600 text-white': value === 1,
          'bg-red-500 hover:bg-red-600 text-white': value === 0,
          'opacity-50 cursor-not-allowed': disabled
        }
      )}
    >
      {value === 1 && <Check className="w-4 h-4" strokeWidth={3} />}
      {value === 0 && <X className="w-4 h-4" strokeWidth={3} />}
    </button>
  );
}

