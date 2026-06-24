-- 2024-06-24_presence_log.sql
-- Persisted connection sessions for the export (connect + disconnect times).
-- One row per session; reconnecting produces a new row.

create table if not exists presence_log (
  id uuid default uuid_generate_v4() primary key,
  retro_id uuid references retros(id) on delete cascade,
  token uuid not null,
  display_name text,
  connected_at timestamptz not null default now(),
  disconnected_at timestamptz
);

create index if not exists presence_log_retro_idx on presence_log (retro_id);

alter table presence_log enable row level security;

drop policy if exists "presence_log_insert" on presence_log;
drop policy if exists "presence_log_update" on presence_log;
drop policy if exists "presence_log_select" on presence_log;

create policy "presence_log_insert" on presence_log for insert with check (true);
create policy "presence_log_update" on presence_log for update using (true) with check (true);
create policy "presence_log_select" on presence_log for select using (true);
