-- 2024-06-24_init.sql
-- Supabase schema for retro‑app

create table if not exists retros (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  type text check (type in ('mad_sad_glad', 'speedboat')) not null,
  show_names boolean not null default true,
  facilitator_token uuid not null,
  votes_per_user int not null default 5,
  created_at timestamp with time zone default now()
);

create table if not exists tokens (
  id uuid default uuid_generate_v4() primary key,
  retro_id uuid references retros(id) on delete cascade,
  token uuid not null unique,
  role text check (role in ('facilitator','participant')) not null,
  display_name text,
  claimed_at timestamp with time zone
);

create table if not exists cards (
  id uuid default uuid_generate_v4() primary key,
  retro_id uuid references retros(id) on delete cascade,
  column_key text not null,
  content text not null,
  author_token uuid references tokens(token) on delete set null,
  created_at timestamp with time zone default now()
);

create table if not exists votes (
  id uuid default uuid_generate_v4() primary key,
  card_id uuid references cards(id) on delete cascade,
  voter_token uuid references tokens(token) on delete cascade,
  unique (card_id, voter_token)
);

-- Enable Row Level Security
alter table retros enable row level security;
alter table tokens enable row level security;
alter table cards enable row level security;
alter table votes enable row level security;

-- Policies for participants (read/write only to their retro)
create policy "allow read retro by token" on retros
  using (exists (select 1 from tokens where token = auth.uid() and retro_id = retros.id));

create policy "allow insert token" on tokens
  for insert with check (role = 'participant');

create policy "allow read token" on tokens
  using (token = auth.uid());

create policy "allow insert card" on cards
  for insert with check (
    auth.uid() = author_token and (
      exists (select 1 from tokens where token = auth.uid()))
  );

create policy "allow select cards" on cards
  using (exists (select 1 from tokens where token = auth.uid() and retro_id = cards.retro_id));

create policy "allow insert vote" on votes
  for insert with check (
    exists (
      select 1
      from tokens
      where token = auth.uid()
        and retro_id = (
          select retro_id
          from cards
          where id = votes.card_id
        )
    )
  );

create policy "allow select votes" on votes
  using (exists (select 1 from tokens where token = auth.uid() and retro_id = (
    select retro_id from cards where id = votes.card_id)));
