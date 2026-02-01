/**
 * Multi-user: chaque code PIN donne accès à un espace de données isolé (user_id).
 * Les données sont filtrées par user_id dans Supabase.
 * Vercel gratuit + Supabase gratuit : largement suffisant pour 2 utilisateurs.
 */

export const USER_ID_STORAGE_KEY = 'habit_tracker_user_id';
export const USER_NAME_STORAGE_KEY = 'habit_tracker_user_name';

// Chaque user_id a ses propres tasks/entries/notes.
const PIN_TO_USER: { pin: string; userId: string; name: string }[] = [
  { pin: '0205', userId: '00000000-0000-0000-0000-000000000001', name: 'Kezyah' },
  { pin: '0606', userId: '00000000-0000-0000-0000-000000000002', name: 'Emy' },
  { pin: '1912', userId: '00000000-0000-0000-0000-000000000003', name: 'Florian' },
];

/** Retourne { userId, name } si le PIN est valide, sinon null. */
export function validatePin(pin: string): { userId: string; name: string } | null {
  const found = PIN_TO_USER.find((u) => u.pin === pin);
  return found ? { userId: found.userId, name: found.name } : null;
}

/** Prénom de l'utilisateur connecté (localStorage). */
export function getCurrentUserName(): string {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem(USER_NAME_STORAGE_KEY) || '';
}
