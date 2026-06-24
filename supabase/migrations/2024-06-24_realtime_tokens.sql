-- 2024-06-24_realtime_tokens.sql
-- Add `tokens` to the realtime publication so the facilitator's connected
-- panel updates live as participants claim their seats.

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'tokens'
  ) then
    alter publication supabase_realtime add table tokens;
  end if;
end$$;
