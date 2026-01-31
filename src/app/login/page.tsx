'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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

  const   checkPin = (fullPin: string) => {
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
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-xs">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center mb-4 shadow-lg">
            <span className="text-white font-bold text-3xl">HT</span>
          </div>
          <h1 className="text-2xl font-bold">Habit Tracker</h1>
        </div>

        <Card>
          <CardHeader className="text-center pb-2">
            <div className="flex justify-center mb-2">
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                <Lock className="w-6 h-6 text-muted-foreground" />
              </div>
            </div>
            <CardTitle className="text-lg">Entrez votre code</CardTitle>
          </CardHeader>
          <CardContent>
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
                  className={`w-14 h-14 text-center text-2xl font-bold ${
                    error ? 'border-red-500 animate-shake' : ''
                  }`}
                  disabled={isLoading}
                  autoFocus={index === 0}
                />
              ))}
            </div>

            {isLoading && (
              <div className="flex justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-emerald-500" />
              </div>
            )}

            {error && (
              <p className="text-sm text-red-500 text-center font-medium">
                Code incorrect
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
