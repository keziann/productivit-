/**
 * Multi-user: chaque code PIN donne accès à un espace de données isolé (user_id).
 * Les données sont filtrées par user_id dans Supabase.
 * Vercel gratuit + Supabase gratuit : largement suffisant pour 2 utilisateurs.
 */

export const USER_ID_STORAGE_KEY = 'habit_tracker_user_id';

// Toi = 0205, ta copine = 0606. Chaque user_id a ses propres tasks/entries/notes.
const PIN_TO_USER: { pin: string; userId: string }[] = [
  { pin: '0205', userId: '00000000-0000-0000-0000-000000000001' },
  { pin: '0606', userId: '00000000-0000-0000-0000-000000000002' },
];

/** Retourne le user_id si le PIN est valide, sinon null. */
export function validatePin(pin: string): string | null {
  const found = PIN_TO_USER.find((u) => u.pin === pin);
  return found ? found.userId : null;
}
