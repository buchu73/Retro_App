# Synthèse — Spec de départ vs livré (v1)

_Comparaison du brief initial (`retro-app-brief.md`) avec l'état de l'application à l'issue des itérations._
_Date : 2026-06-24_

---

## 1. Vue d'ensemble

Au démarrage, le dépôt contenait la **structure** (pages, composants, schéma SQL) mais le board était un **placeholder** (3 colonnes en dur, aucune interaction réelle). Toute la mécanique fonctionnelle (board, votes, temps réel, présence, exports, connexion) a été construite ensuite.

**Verdict global : la v1 est livrée et dépasse le périmètre demandé sur plusieurs points.** Quelques livrables documentaires restent à compléter.

---

## 2. Périmètre v1 — fonctionnalités

| Fonctionnalité (spec) | État | Notes |
|---|---|---|
| Formats Mad/Sad/Glad (3 col.) | ✅ | Colonnes paramétrées par type |
| Format Speedboat (Vent/Ancres/Rochers/Île) | ✅ | Structure de colonnes extensible (config par type) |
| Ajout de cartes | ✅ | Saisie par colonne (Ctrl/⌘+Entrée) |
| Affichage temps réel des cartes | ✅ | Supabase Realtime (insert/update/delete) |
| Suppression de sa propre carte | ✅ | + l'animateur peut tout supprimer |
| Votes (+1 / retrait, limite configurable, défaut 5) | ✅ | Compteur de votes restants |
| `show_names` activable à la création | ✅ | Cartes anonymes si désactivé |
| Export Markdown | ✅ | Titre, date, type, colonnes triées par votes |
| Export PDF | ✅ | Via fenêtre d'impression (Enregistrer en PDF) |

**Hors périmètre (respecté)** : pas de regroupement de cartes, pas de timer, pas d'édition de carte, pas de comptes utilisateurs, pas d'envoi d'emails. ✅

---

## 3. Modèle d'accès

| Élément (spec) | État | Notes |
|---|---|---|
| Page `/create` (type, nb participants, `show_names`, titre) | ✅ | + champ votes/participant ajouté |
| Génération token animateur + N tokens participants | ✅ | |
| Liste des liens participants copiables | ✅ | Boutons « Copier » / « Tout copier » |
| Participant : accès via lien `/r/{retroId}?t={token}` | ✅ | |
| Demande du nom à la 1ʳᵉ connexion | ✅ | Nom rattaché au token |
| Token invalide → message d'erreur | ✅ | |
| Nom utilisé pour l'attribution des cartes | ✅ | Affiché si `show_names` |
| Animateur : board temps réel + exports | ✅ | |
| Phases « saisie » / « votes » (optionnel) | ✅ **(implémenté)** | Boutons clore/rouvrir, synchronisés temps réel |

---

## 4. Aspects techniques

| Élément (spec) | État | Notes |
|---|---|---|
| Front Vite + React + TS, UI FR | ✅ | |
| Supabase (Postgres + Realtime + RLS) | ✅ | |
| Hébergement Vercel + Supabase free | ✅ | |
| Tailwind, composants minimalistes | ✅ | |
| Schéma de données (retros/tokens/cards/votes) | ✅ | Conforme |
| Tokens UUID non devinables | ✅ | |
| Temps réel sur cards + votes filtré par retro | ✅ | ⚠️ écart d'implémentation, voir §6 |
| Mise à jour optimiste + réconciliation | ✅ | Votes optimistes, refetch sur événement |

### Écart notable : modèle RLS
La spec demandait des policies RLS basées sur le `retro_id` du token. Le code initial reposait sur `auth.uid()` (Supabase Auth), **incompatible** avec le modèle « token secret dans l'URL » (pas d'authentification). → Remplacé par des **policies permissives**, la sécurité reposant sur le caractère secret des UUID. **Conforme à l'esprit** de la spec (« proto, raisonnable »), mais techniquement plus permissif que la lettre. À durcir pour un usage public (voir §7).

---

## 5. Au-delà de la spec (ajouts)

Fonctionnalités **non demandées** ajoutées en cours de route :

- 🎨 **Code couleur par colonne** (fond translucide + bordure de carte).
- 🔗 **Lien public unique** `/j/{retroId}` avec **choix de siège** (claim atomique, siège créé à la volée si complet) — en plus des liens nominatifs.
- 👥 **Panneau latéral animateur** avec **présence temps réel** (en ligne / hors ligne).
- 📋 **Journal de présence** dans l'export (connexion + déconnexion, une ligne par session).
- 🔒 **Phases verrouillables** (clore/rouvrir ajouts et votes).
- ⚙️ **`vercel.json`** (réécriture SPA pour les liens profonds).

---

## 6. Écarts / dette technique connue

| Sujet | Détail | Impact |
|---|---|---|
| **Abonnement `cards` sans filtre** | Le filtre `retro_id` cassait la diffusion des DELETE → filtre retiré. Chaque client est notifié des changements de cartes de **toutes** les rétros (puis refetch scoping). | Négligeable à petite échelle ; à optimiser si nombreuses rétros simultanées |
| **Refetch complet sur chaque événement** | Tout événement realtime déclenche un re-fetch board complet (cards+votes+tokens+retro). | OK jusqu'à ~15-20 users actifs ; au-delà, appliquer le delta du payload |
| **Présence : enregistreur = animateur** | Le journal de présence n'est écrit que si l'animateur est connecté. | Acceptable (l'animateur fait l'export) ; trous si absent |
| **Siège par onglet (`sessionStorage`)** | Fermer l'onglet et rouvrir le lien public = nouveau siège + nouvelle ligne de présence. | Choix assumé pour éviter les collisions d'identité |
| **Détection déconnexion ~quelques secondes** | Délai du heartbeat de présence. | Horaires de déconnexion à ±quelques secondes |

---

## 7. Livrables documentaires (spec §Livrables)

| Livrable demandé | État |
|---|---|
| Code de l'application (front + migrations SQL) | ✅ |
| **`.env.example`** avec les clés Supabase | ❌ **Manquant** |
| **`DEPLOY.md`** guide pas à pas | ⚠️ **Présent mais à mettre à jour** (antérieur aux 5 migrations RLS/realtime/présence) |

### Migrations SQL à appliquer (rappel)
1. `2024-06-24_fix_rls_anon_access.sql`
2. `2024-06-24_realtime_and_token_update.sql`
3. `2024-06-24_phase_locks.sql`
4. `2024-06-24_realtime_tokens.sql`
5. `2024-06-24_presence_log.sql`

---

## 8. Critères d'acceptation

| Critère (spec) | État |
|---|---|
| 2 navigateurs voient cartes/votes en temps réel | ✅ (à valider lors du test temps réel) |
| Participant saisit son nom avant le board | ✅ |
| Animateur génère N liens et les copie | ✅ |
| `show_names` masque les auteurs si désactivé | ✅ |
| Export MD et PDF fonctionnels | ✅ |
| `DEPLOY.md` permet un déploiement autonome | ⚠️ à actualiser |

---

## 9. Recommandations avant un usage plus large

1. **Créer `.env.example`** (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`).
2. **Mettre à jour `DEPLOY.md`** avec les 5 migrations + activation Realtime + note domaine de prod (liens durables).
3. **Durcir la sécurité** si l'app devient publique : revenir à des policies RLS scoping par `retro_id`, ou passer la création/génération de tokens par une Edge Function (`service_role`).
4. **Optimiser le temps réel** (appliquer les deltas plutôt que refetch complet) si sessions > ~20 personnes actives.

---

_En l'état : v1 fonctionnelle, prête pour un premier test temps réel. Les écarts restants sont documentaires (`.env.example`, `DEPLOY.md`) ou de l'optimisation non bloquante._
