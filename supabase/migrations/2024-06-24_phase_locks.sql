-- 2024-06-24_phase_locks.sql
-- Facilitator phase controls: lock card creation and/or voting.

alter table retros
  add column if not exists cards_locked boolean not null default false;
alter table retros
  add column if not exists votes_locked boolean not null default false;

-- Allow the facilitator (anon, prototype) to update retro flags.
drop policy if exists "retros_update" on retros;
create policy "retros_update" on retros
  for update using (true) with check (true);

-- Realtime for the retro row so participants see lock changes live.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'retros'
  ) then
    alter publication supabase_realtime add table retros;
  end if;
end$$;
