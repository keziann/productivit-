'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Mail, Loader2, CheckCircle2 } from 'lucide-react';
import { signInWithMagicLink } from '@/lib/auth';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      // Vérifier que les variables d'environnement sont présentes
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      
      if (!supabaseUrl || !supabaseKey) {
        setError('Configuration manquante. Vérifiez les variables d\'environnement sur Vercel.');
        setIsLoading(false);
        console.error('Variables manquantes:', { supabaseUrl: !!supabaseUrl, supabaseKey: !!supabaseKey });
        return;
      }

      const { error: authError } = await signInWithMagicLink(email.trim());

      if (authError) {
        console.error('Erreur auth:', authError);
        setError(authError.message || 'Erreur lors de l\'envoi. Vérifiez votre connexion.');
      } else {
        setIsSent(true);
      }
    } catch (err) {
      console.error('Erreur inattendue:', err);
      setError('Erreur réseau. Vérifiez votre connexion internet.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center mb-4">
            <span className="text-white font-bold text-2xl">HT</span>
          </div>
          <h1 className="text-2xl font-bold">Habit Tracker</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Suivez vos habitudes quotidiennes
          </p>
        </div>

        <Card>
          <CardHeader className="text-center">
            <CardTitle>{isSent ? 'Email envoyé !' : 'Connexion'}</CardTitle>
            <CardDescription>
              {isSent
                ? 'Vérifiez votre boîte mail pour vous connecter'
                : 'Entrez votre email pour recevoir un lien de connexion'
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isSent ? (
              <div className="flex flex-col items-center gap-4 py-4">
                <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                  <CheckCircle2 className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div className="text-center">
                  <p className="font-medium">Lien envoyé à</p>
                  <p className="text-muted-foreground text-sm">{email}</p>
                </div>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsSent(false);
                    setEmail('');
                  }}
                >
                  Utiliser un autre email
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="email"
                    placeholder="votre@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    required
                    disabled={isLoading}
                  />
                </div>

                {error && (
                  <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                    <p className="text-sm text-red-600 dark:text-red-400 text-center font-medium">{error}</p>
                    <p className="text-xs text-red-500 dark:text-red-500 mt-2 text-center">
                      Ouvre la console (F12) pour plus de détails
                    </p>
                  </div>
                )}

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Envoi en cours...
                    </>
                  ) : (
                    'Recevoir le lien de connexion'
                  )}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground mt-6">
          Pas de mot de passe nécessaire.<br />
          Un lien de connexion sera envoyé à votre email.
        </p>
      </div>
    </div>
  );
}

