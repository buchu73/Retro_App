# Guide de déploiement – Retro‑App

## Prérequis
- **Node.js** (v20 ou plus) installé localement.
- Un compte **Supabase** (plan gratuit suffit).
- Un compte **Vercel** (ou Netlify) pour héberger le front.

## 1️⃣ Créer le projet Supabase
1. Rendez‑vous sur <https://app.supabase.com> et créez un nouveau projet.
2. Dans **Settings → API**, notez :
   - `Project URL`  → `https://xxxx.supabase.co`
   - `anon public key` → clé commençant par `sb...`
3. Ouvrez **SQL Editor** et exécutez le script `supabase/migrations/2024-06-24_init.sql` (copiez‑collez le contenu du fichier).
4. Activez l’extension UUID OSSP si elle n’est pas déjà disponible :
   ```sql
   create extension if not exists "uuid-ossp";
   ```
   (Cette extension permet de générer les `uuid` utilisés dans le schéma.)

## 2️⃣ Configurer les variables d’environnement **locales**
```sh
cp .env.example .env.local   # crée un fichier utilisé par Vite en dev
# Remplacez les valeurs par celles récupérées à l'étape 1
# Exemple :
# VITE_SUPABASE_URL=https://xxxx.supabase.co
# VITE_SUPABASE_ANON_KEY=sbxxxxxxxxxxxxxxxxxxxx
```
Le fichier `.env.local` est automatiquement chargé par Vite.

## 3️⃣ Tester en local
```sh
npm install          # installe les dépendances
npm run dev          # démarre le serveur Vite (http://localhost:5173)
```
Ouvrez le lien dans votre navigateur : vous devez voir la page *Créer une rétrospective*.

## 4️⃣ Déployer sur **Vercel** (similaire sur Netlify)
1. Dans le tableau de bord Vercel, cliquez sur **New Project** → **Import Git Repository** → sélectionnez ce dépôt.
2. **Framework Preset** → choisissez *Vite* (détecté automatiquement).
3. Dans **Settings → Environment Variables**, ajoutez :
   - `VITE_SUPABASE_URL` → `<your‑project‑url>`
   - `VITE_SUPABASE_ANON_KEY` → `<your‑anon‑key>`
4. Laissez Vercel exécuter :
   ```sh
   npm install
   npm run build
   ```
   Vercel construira les assets statiques et les publiera sur un CDN.
5. Après le build, Vercel vous fournit une URL du type `https://your‑project.vercel.app`.

> **Note** : aucune étape de *build* locale n’est requise ; tout se fait dans le pipeline CI de Vercel/Netlify.

## 5️⃣ Vérification post‑déploiement (test de bout en bout)
1. Ouvrez l’URL déployée et cliquez sur **Créer une rétrospective**.
2. Remplissez le formulaire, générez les liens participants.
3. Ouvrez **deux** navigateurs :
   - Un avec le lien *facilitateur*.
   - Un autre avec un lien *participant*.
4. Le participant doit saisir son nom, puis ajouter des cartes.
5. Vérifiez que les cartes et les votes apparaissent immédiatement dans les deux fenêtres (Realtime).
6. En tant que facilitateur, cliquez sur les boutons **Export Markdown** et **Export PDF** ; les fichiers générés doivent contenir les cartes, le nombre de votes et les noms si `show_names` est activé.

## 6️⃣ Limites du tier gratuit Supabase
- **Stockage** : 500 Mo.
- **Bande passante** : 2 GB/mois.
- **Connexions simultanées** : 500.
- Pas de fonctions Edge – toutes les opérations sont côté client.
- Si les quotas sont dépassés, les requêtes seront rejetées ; surveillez l’usage depuis le tableau de bord Supabase.

---
Ce guide vous permet de **déployer l’application en moins d’une journée** sans avoir à construire les fichiers vous‑même : la plateforme d’hébergement se charge du build et du CDN.
