# 📊 Habit Tracker

Une application web PWA pour suivre vos habitudes quotidiennes avec synchronisation cloud via Supabase.

![Next.js](https://img.shields.io/badge/Next.js-15-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![Supabase](https://img.shields.io/badge/Supabase-Cloud-3ecf8e)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-4-38bdf8)

## ✨ Fonctionnalités

- **Dashboard** : Vue d'ensemble avec score du jour, image motivante, et statut de sync
- **Vue Semaine** : Grille type spreadsheet pour voir et éditer 7 jours
- **Toggle rapide** : Un clic = ✓ (fait) / ✗ (raté) / vide (non renseigné)
- **Notes journalières** : "Appris aujourd'hui" et "Remarques"
- **Statistiques** : Taux de réussite par tâche (7j / 30j / Tout)
- **Gestion des tâches** : Créer, modifier, archiver, réordonner
- **Sync cloud** : Supabase avec mode hors-ligne
- **Auth** : Magic link par email (sans mot de passe)
- **PWA** : Installable sur iPhone via "Ajouter à l'écran d'accueil"
- **Mode sombre/clair**

## 🚀 Installation

### 1. Cloner et installer

```bash
cd habit-tracker
npm install
```

### 2. Configurer Supabase

1. Créer un projet sur [supabase.com](https://supabase.com)
2. Dans le SQL Editor, exécuter le contenu de `supabase/schema.sql`
3. Dans **Settings > API**, copier :
   - Project URL
   - anon public key

### 3. Variables d'environnement

Créer un fichier `.env.local` à la racine :

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

### 4. Configurer l'authentification

Dans Supabase **Authentication > URL Configuration** :
- Site URL : `http://localhost:3000` (dev) ou votre URL Vercel
- Redirect URLs : ajouter `http://localhost:3000/auth/callback` et `https://your-app.vercel.app/auth/callback`

### 5. Lancer l'app

```bash
# Développement
npm run dev

# Production
npm run build
npm start
```

## 📱 Installation sur iPhone (PWA)

1. Déployer sur Vercel (ou autre)
2. Ouvrir l'URL dans Safari sur iPhone
3. Appuyer sur le bouton Partager (carré avec flèche)
4. Sélectionner "Sur l'écran d'accueil"
5. L'app apparaît comme une application native !

## 🔄 Synchronisation

### Comment ça marche

1. **Online** : Les données sont envoyées directement à Supabase
2. **Offline** : Les données sont stockées localement dans une "outbox"
3. **Retour réseau** : L'outbox est vidée automatiquement vers Supabase

### Carte "Sync" sur le Dashboard

- **Statut** : OK / Hors ligne / Erreur
- **En attente** : Nombre d'actions non synchronisées
- **Dernière sync** : Timestamp du dernier succès
- **Forcer sync** : Bouton pour déclencher manuellement

## 📁 Structure

```
src/
├── app/
│   ├── page.tsx           # Dashboard
│   ├── week/page.tsx      # Vue semaine
│   ├── tasks/page.tsx     # Gestion tâches
│   ├── settings/page.tsx  # Réglages
│   ├── login/page.tsx     # Page de connexion
│   └── auth/callback/     # Callback magic link
├── components/
│   ├── AuthProvider.tsx   # Context auth + sync
│   ├── Navbar.tsx         # Navigation
│   ├── WeekGrid.tsx       # Grille semaine
│   ├── TaskToggle.tsx     # Bouton toggle
│   ├── DailyTasks.tsx     # Tâches du jour
│   ├── DayNotes.tsx       # Notes journalières
│   ├── TaskList.tsx       # CRUD tâches
│   ├── TaskStatsList.tsx  # Stats par tâche
│   ├── SyncCard.tsx       # Carte sync status
│   ├── MotivationCard.tsx # Carte image motivante
│   └── ImportExport.tsx   # Export/Import JSON
└── lib/
    ├── supabaseClient.ts  # Client Supabase
    ├── auth.ts            # Helpers auth
    ├── data.ts            # CRUD Supabase
    ├── outbox.ts          # Queue offline
    ├── sync.ts            # Flush outbox
    ├── stats.ts           # Calculs statistiques
    └── db.ts              # Types (legacy)
```

## 🗃️ Base de données Supabase

### Tables

- **tasks** : Tâches/habitudes
- **entries** : Entrées quotidiennes (1/0/null par tâche/jour)
- **day_notes** : Notes du jour
- **user_settings** : Paramètres utilisateur (image motivante)

### RLS (Row Level Security)

Chaque table a des policies qui vérifient `auth.uid() = user_id`, garantissant que chaque utilisateur ne voit que ses propres données.

## 🔐 Authentification

- **Magic Link** : Connexion par email sans mot de passe
- L'utilisateur entre son email
- Reçoit un lien de connexion
- Clique sur le lien → connecté !

## 📤 Export/Import

Dans **Réglages** :
- **Exporter JSON** : Télécharge toutes vos données
- **Importer JSON** : Fusionne avec les données existantes

## 🚀 Déploiement Vercel

1. Push sur GitHub
2. Importer dans Vercel
3. Ajouter les variables d'environnement
4. Déployer !

N'oubliez pas d'ajouter l'URL de callback dans Supabase.

## 📄 Licence

MIT
