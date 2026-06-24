-- 2024-06-24_add_participant_token_policy.sql
-- Restrict token inserts to participants when retro_id exists

create policy "allow participant token insert" on tokens
  for insert
  with check (
    exists (
      select 1 from retros where id = retro_id
    )
    and role = 'participant'
  );
