
-- 1. Add avatar_url to profiles if not already present
alter table public.profiles
  add column if not exists avatar_url text;

-- 2. Create standups scheduling table
create table if not exists public.standups (
  id uuid primary key default gen_random_uuid(),
  created_at timestamp with time zone default now(),
  created_by uuid references profiles(id) on delete set null,
  scheduled_at date not null
);

-- 3. RLS for standups: Only admins can insert/update/delete, all members can select

-- Enable RLS
alter table public.standups enable row level security;

-- Allow all authenticated users to select
create policy "Allow view standups" on public.standups
  for select using (true);

-- Allow admins to insert/update/delete
create policy "Only admins can schedule standups"
  on public.standups
  for all
  using (
    (select role from public.profiles where id = auth.uid()) = 'admin'
  )
  with check (
    (select role from public.profiles where id = auth.uid()) = 'admin'
  );
