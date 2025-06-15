
-- 1. Create a user profiles table with a 1:1 relation to auth.users.
create table public.profiles (
  id uuid not null primary key references auth.users(id) on delete cascade,
  name text,
  email text unique,
  role text default 'member', -- 'admin' or 'member'
  created_at timestamp with time zone default now()
);

-- 2. Automatically create a profile for every new user (on sign up)
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'name', ''),
    'member' -- Default role
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 3. Enable Row Level Security (RLS) for the profiles table
alter table public.profiles enable row level security;

-- 4. Allow users to select/insert/update their own profile
create policy "Users can view their profile" on public.profiles
  for select using (auth.uid() = id);

create policy "Users can update their profile" on public.profiles
  for update using (auth.uid() = id);

create policy "Users can insert their profile" on public.profiles
  for insert with check (auth.uid() = id);

-- 5. Allow admins to select/update any profile
-- (Optional, enable this policy after implementing admin role logic)
