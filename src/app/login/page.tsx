'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Loader2, Lock } from 'lucide-react';
import { validatePin, USER_ID_STORAGE_KEY, USER_NAME_STORAGE_KEY } from '@/lib/users';

export default function LoginPage() {
  const [pin, setPin] = useState(['', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(false);
  const inputRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null)
  ];
  const router = useRouter();

  // Check if already authenticated
  useEffect(() => {
    const isAuth = localStorage.getItem('habit-tracker-auth');
    if (isAuth === 'true') {
      router.push('/');
    }
  }, [router]);

  const handlePinChange = (index: number, value: string) => {
    // Only allow digits
    if (value && !/^\d$/.test(value)) return;

    const newPin = [...pin];
    newPin[index] = value;
    setPin(newPin);
    setError(false);

    // Auto-focus next input
    if (value && index < 3) {
      inputRefs[index + 1].current?.focus();
    }

    // Check PIN when complete
    if (index === 3 && value) {
      const fullPin = newPin.join('');
      checkPin(fullPin);
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    // Handle backspace
    if (e.key === 'Backspace' && !pin[index] && index > 0) {
      inputRefs[index - 1].current?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').slice(0, 4);
    if (/^\d{1,4}$/.test(pastedData)) {
      const newPin = pastedData.split('').concat(['', '', '', '']).slice(0, 4);
      setPin(newPin);
      if (pastedData.length === 4) {
        checkPin(pastedData);
      } else {
        inputRefs[pastedData.length]?.current?.focus();
      }
    }
  };

  const checkPin = (fullPin: string) => {
    setIsLoading(true);

    setTimeout(() => {
      const result = validatePin(fullPin);
      if (result) {
        localStorage.setItem('habit-tracker-auth', 'true');
        localStorage.setItem(USER_ID_STORAGE_KEY, result.userId);
        localStorage.setItem(USER_NAME_STORAGE_KEY, result.name);
        router.push('/');
      } else {
        setError(true);
        setPin(['', '', '', '']);
        inputRefs[0].current?.focus();
        setIsLoading(false);
      }
    }, 300);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted/30 p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center mb-10">
          <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center mb-6 shadow-2xl shadow-emerald-500/30">
            <span className="text-white font-bold text-4xl">HT</span>
          </div>
          <h1 className="text-3xl font-bold">Habit Tracker</h1>
          <p className="text-muted-foreground mt-2">Suivez vos habitudes quotidiennes</p>
        </div>

        <Card className="border-0 shadow-2xl shadow-black/5 dark:shadow-black/20">
          <CardContent className="pt-8 pb-8 px-6">
            <div className="flex justify-center mb-6">
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-colors ${
                error ? 'bg-red-100 dark:bg-red-900/30' : 'bg-muted'
              }`}>
                <Lock className={`w-8 h-8 ${error ? 'text-red-500' : 'text-muted-foreground'}`} />
              </div>
            </div>

            <h2 className="text-xl font-semibold text-center mb-6">Entrez votre code</h2>

            <div className="flex justify-center gap-3 mb-6" onPaste={handlePaste}>
              {pin.map((digit, index) => (
                <Input
                  key={index}
                  ref={inputRefs[index]}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handlePinChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  className={`w-14 h-16 text-center text-2xl font-bold rounded-xl border-2 transition-all ${
                    error
                      ? 'border-red-500 bg-red-50 dark:bg-red-900/20 animate-shake'
                      : digit
                        ? 'border-primary bg-primary/5'
                        : 'border-border'
                  }`}
                  disabled={isLoading}
                  autoFocus={index === 0}
                />
              ))}
            </div>

            <div className="h-8 flex items-center justify-center">
              {isLoading && (
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              )}

              {error && !isLoading && (
                <p className="text-sm text-red-500 font-medium">
                  Code incorrect
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground mt-6">
          Vos données sont sécurisées et synchronisées
        </p>
      </div>
    </div>
  );
}
