-- 2024-06-24_fix_rls_anon_access.sql
-- Fix RLS so the create-retro flow works with anonymous access.
--
-- Context:
-- The app uses the Supabase anon key WITHOUT Supabase Auth. Security relies on
-- unguessable UUID tokens stored in the `tokens` table, not on authenticated
-- sessions. The original policies were written against `auth.uid()`, which is
-- always NULL here, so every insert/select was rejected by RLS (e.g.
-- "new row violates row-level security policy for table retros").
--
-- This migration replaces the auth.uid()-based policies with permissive ones.
-- Security then depends solely on the secrecy of the UUID tokens — acceptable
-- for a prototype. Harden later (Supabase Auth, or an Edge Function using the
-- service_role key for creation) if the app becomes public.

-- RETROS
drop policy if exists "allow read retro by token" on retros;
drop policy if exists "allow insert retro" on retros;
create policy "retros_insert" on retros for insert with check (true);
create policy "retros_select" on retros for select using (true);

-- TOKENS
drop policy if exists "allow insert token" on tokens;
drop policy if exists "allow participant token insert" on tokens;
drop policy if exists "allow read token" on tokens;
create policy "tokens_insert" on tokens for insert with check (true);
create policy "tokens_select" on tokens for select using (true);

-- CARDS
drop policy if exists "allow insert card" on cards;
drop policy if exists "allow select cards" on cards;
create policy "cards_insert" on cards for insert with check (true);
create policy "cards_select" on cards for select using (true);
create policy "cards_update" on cards for update using (true);
create policy "cards_delete" on cards for delete using (true);

-- VOTES
drop policy if exists "allow insert vote" on votes;
drop policy if exists "allow select votes" on votes;
create policy "votes_insert" on votes for insert with check (true);
create policy "votes_select" on votes for select using (true);
create policy "votes_delete" on votes for delete using (true);
