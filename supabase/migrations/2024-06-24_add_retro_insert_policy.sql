-- 2024-06-24_add_retro_insert_policy.sql
-- Allow insertion of a new retro (prototype: permissive). Replace with stricter check later if desired.

create policy "allow insert retro" on retros
  for insert
  with check (true);
