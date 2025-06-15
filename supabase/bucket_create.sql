
insert into storage.buckets
  (id, name, public)
values
  ('avatars', 'avatars', true)
on conflict do nothing;
