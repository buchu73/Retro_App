# Retro_App

Application web collaborative **temps réel** pour animer des rétrospectives agiles, accessible par simple lien. Proto déployable en moins d'une journée.

- **Front** : Vite + React + TypeScript + Tailwind (UI en français)
- **Backend** : Supabase (Postgres + Realtime + RLS) — pas de serveur custom
- **Hébergement** : Vercel (front) + Supabase (base, tier gratuit)

---

## Fonctionnalités

- **Deux formats** : Mad / Sad / Glad et Speedboat (Vent / Ancres / Rochers / Île). Colonnes paramétrables par type.
- **Cartes** : ajout par colonne, suppression de sa propre carte (l'animateur peut tout supprimer).
- **Votes** : +1 / retrait, limite par participant configurable (défaut 5), compteur de votes restants.
- **Temps réel** : cartes, votes et phases synchronisés entre tous les participants (Supabase Realtime).
- **Noms** : affichage des auteurs activable/désactivable à la création (`show_names`).
- **Animation** : clore/rouvrir les ajouts et les votes, panneau de présence live (en ligne / hors ligne).
- **Connexion** : liens nominatifs **ou** lien public unique avec choix de siège.
- **Export** : Markdown et PDF (réservés à l'animateur), avec journal de présence (connexion / déconnexion).

---

## Modèle d'accès

- **Animateur** : crée la rétro via `/create`, récupère son lien `/r/{retroId}?t={token}` et les liens participants.
- **Participant (lien nominatif)** : `/r/{retroId}?t={token}`, saisit son nom à la première connexion.
- **Participant (lien public)** : `/j/{retroId}`, saisit son nom et prend un siège disponible.

La sécurité repose sur le caractère **secret des tokens UUID** dans l'URL (pas d'authentification par compte). Proto — voir les recommandations dans `SYNTHESE_SPEC.md` pour un usage public.

---

## Installation locale

```bash
npm install
npm run dev      # http://localhost:5173
```

### Variables d'environnement

Créer un fichier `.env` à la racine :

```
VITE_SUPABASE_URL=https://<votre-projet>.supabase.co
VITE_SUPABASE_ANON_KEY=<votre-clé-anon>
```

(Clés disponibles dans Supabase → Project Settings → API.)

---

## Base de données (Supabase)

Exécuter, dans **Supabase → SQL Editor**, les scripts de `supabase/migrations/` dans l'ordre :

1. `2024-06-24_init.sql` — schéma (retros, tokens, cards, votes)
2. `2024-06-24_add_participants.sql`
3. `2024-06-24_fix_rls_anon_access.sql` — policies RLS (accès anonyme par token)
4. `2024-06-24_realtime_and_token_update.sql` — claim du nom + realtime cards/votes
5. `2024-06-24_phase_locks.sql` — phases clore/rouvrir
6. `2024-06-24_realtime_tokens.sql` — présence live des connectés
7. `2024-06-24_presence_log.sql` — journal de présence pour l'export

> Vérifier ensuite que **Realtime** est activé sur `cards`, `votes`, `retros`, `tokens` (Database → Replication, publication `supabase_realtime`).

---

## Build & déploiement

```bash
npm run build    # génère dist/
```

Déploiement sur Vercel (framework détecté automatiquement). Le fichier `vercel.json` réécrit les routes vers `index.html` (nécessaire pour les liens profonds `/r/:id`, `/j/:id`).

Guide pas à pas : voir `DEPLOY.md`.

> ⚠️ Générer les liens de rétro depuis le **domaine de production** (ex. `mon-projet.vercel.app`), pas depuis une URL de déploiement à hash : ces dernières sont protégées par le login Vercel et ne sont pas durables.

---

## Structure

```
src/
  pages/        CreateRetro · RetroBoard · JoinRetro
  components/   Column · Card
  services/     supabase.ts (accès données + realtime + présence)
  lib/          export.ts (Markdown / PDF)
  types.ts      types + config des colonnes par format
supabase/migrations/   scripts SQL
```

---

## Limites connues (proto)

- Sécurité RLS permissive (token secret) — à durcir pour un usage public.
- Refetch complet du board à chaque événement temps réel (OK jusqu'à ~15-20 participants actifs).
- Journal de présence enregistré uniquement si l'animateur est connecté.

Détails et recommandations : `SYNTHESE_SPEC.md`.
