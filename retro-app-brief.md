# Brief — Application de rétrospective agile (proto)

## Objectif
Petite application web collaborative **temps réel**, accessible par lien, pour animer des rétrospectives agiles. Déployable en moins d'une journée. Proto, pas de sur-ingénierie.

## Stack imposée
- **Front** : Vite + React + TypeScript. UI en **français**. Code, noms de variables, commentaires (rares) en **anglais**.
- **Backend / temps réel / persistance** : **Supabase** (Postgres + Realtime + RLS). Pas de serveur custom.
- **Hébergement** : front sur **Vercel** (ou Netlify), base sur **Supabase** (tier gratuit).
- Pas de framework UI lourd. Tailwind CSS autorisé. Composants minimalistes.

## Périmètre v1 (strict)
Formats de rétro supportés dès la v1 :
1. **Mad / Sad / Glad** — 3 colonnes.
2. **Speedboat** — colonnes : *Vent (ce qui pousse)*, *Ancres (ce qui freine)*, *Rochers (risques)*, *Île (objectif)*. (Garde une structure de colonnes paramétrable par type pour pouvoir ajouter d'autres formats ensuite.)

Fonctionnalités v1 :
- Ajout de cartes dans une colonne.
- Affichage temps réel des cartes de tous les participants.
- **Votes** sur les cartes (1 clic = +1, possibilité de retirer son vote ; limite de votes par user configurable, défaut 5).
- Affichage du **nom sur les cartes activable/désactivable** par l'animateur à la création (option booléenne `show_names`). Si désactivé, cartes anonymes.
- Export du résultat par l'animateur en fin de rétro : **Markdown** et **PDF**.

Hors périmètre v1 (à ne pas implémenter) : regroupement de cartes, timer, édition de carte après création (simple suppression de sa propre carte suffit), comptes utilisateurs, envoi d'emails (fait à la main).

## Modèle d'accès

### Animateur
- Une page `/create` permet de créer une rétro : choix du **type** (mad_sad_glad | speedboat), du **nombre de tokens participants** à générer, de l'option `show_names`, et d'un **titre**.
- À la création, l'app génère :
  - 1 **token animateur** (URL : `/r/{retroId}?t={facilitatorToken}` avec rôle facilitateur).
  - N **tokens participants** (1 par user attendu).
- L'animateur récupère la liste des liens participants (un lien complet par token, prêt à copier-coller pour envoi par email manuel).
- L'animateur peut, depuis la rétro : voir le board temps réel, basculer une phase si tu veux la garder simple (optionnel : phase "saisie" / "votes"), et **exporter** (MD + PDF).

### Participant
- Accède via son lien personnel `/r/{retroId}?t={token}`.
- Le token est **à usage individuel** : à la première connexion, l'app demande **le nom du participant** avant de donner accès au board. Le nom est stocké et rattaché au token.
- Si le token est invalide/inconnu → message d'erreur, pas d'accès.
- Le nom saisi est utilisé pour l'attribution des cartes (affiché seulement si `show_names = true`).

## Schéma de données (Supabase / Postgres)
- `retros` : `id (uuid)`, `title`, `type`, `show_names (bool)`, `facilitator_token`, `votes_per_user (int, default 5)`, `created_at`.
- `tokens` : `id`, `retro_id (fk)`, `token (unique)`, `role (facilitator|participant)`, `display_name (nullable)`, `claimed_at (nullable)`.
- `cards` : `id`, `retro_id (fk)`, `column_key`, `content (text)`, `author_token (fk)`, `created_at`.
- `votes` : `id`, `card_id (fk)`, `voter_token (fk)`, unique (`card_id`, `voter_token`).

## Sécurité (proto, raisonnable)
- Tokens générés aléatoirement (UUID v4 ou nanoid), non devinables.
- **RLS Supabase** : un client ne peut lire/écrire que sur le `retro_id` correspondant à un token valide passé en paramètre. Les opérations sensibles (génération de tokens, création de rétro) restreintes au flux `/create` / token facilitateur.
- Pas d'auth email/password. Le secret = le token dans l'URL.

## Temps réel
- Souscription Supabase Realtime sur `cards` et `votes` filtrée par `retro_id`.
- Mise à jour optimiste côté client, réconciliation sur événement Realtime.

## Export
- **Markdown** : titre, date, type, puis pour chaque colonne la liste des cartes (avec nom si `show_names`) triées par nombre de votes décroissant, votes affichés entre parenthèses.
- **PDF** : même contenu, généré côté client (ex. via `react-pdf` ou rendu HTML → impression). Garder simple.

## Livrables attendus de l'agent
1. Le code de l'application (front + migrations SQL Supabase / script de schéma).
2. Le fichier de configuration d'environnement (`.env.example` avec les clés Supabase).
3. **Un guide de déploiement pas à pas** (`DEPLOY.md`) couvrant :
   - création du projet Supabase, exécution du schéma SQL, récupération des clés (URL + anon key),
   - configuration des variables d'environnement,
   - déploiement du front sur Vercel,
   - test de bout en bout (créer une rétro, générer des tokens, se connecter en participant, vérifier le temps réel, exporter),
   - notes sur les limites du tier gratuit.

## Critères d'acceptation
- Deux navigateurs ouverts sur le même board voient les cartes/votes apparaître en temps réel.
- Un participant doit saisir son nom avant d'accéder au board.
- L'animateur peut générer N liens participants et les copier.
- L'option `show_names` masque correctement les auteurs quand désactivée.
- Export MD et PDF fonctionnels.
- `DEPLOY.md` permet à quelqu'un qui ne connaît pas le projet de le mettre en ligne en suivant les étapes.
