-- 2024-06-24_realtime_and_token_update.sql
-- 1) Allow a participant/facilitator to claim their token (set display_name).
-- 2) Enable Supabase Realtime on cards and votes so the board updates live.

-- Token claim (first connection writes display_name + claimed_at)
drop policy if exists "tokens_update" on tokens;
create policy "tokens_update" on tokens
  for update using (true) with check (true);

-- Add tables to the realtime publication (idempotent)
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'cards'
  ) then
    alter publication supabase_realtime add table cards;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'votes'
  ) then
    alter publication supabase_realtime add table votes;
  end if;
end$$;
