-- Run this in your Supabase project → SQL Editor

-- 1. Create the photos table
create table if not exists photos (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  url text not null,
  votes integer not null default 0,
  sort_order integer not null default 0,
  created_at timestamptz default now()
);

-- If you already ran the old setup SQL, just add the new column:
-- alter table photos add column if not exists sort_order integer not null default 0;

-- 2. Enable Row Level Security
alter table photos enable row level security;

-- 3. Allow anyone to read photos (public vote page)
create policy "Public read"
  on photos for select
  using (true);

-- 4. Allow anyone to increment votes (voters)
create policy "Public vote"
  on photos for update
  using (true)
  with check (true);

-- 5. Allow anyone to insert (admin upload)
create policy "Public insert"
  on photos for insert
  with check (true);

-- 6. Allow anyone to delete (admin)
create policy "Public delete"
  on photos for delete
  using (true);

-- 7. Enable realtime for live results
alter publication supabase_realtime add table photos;
