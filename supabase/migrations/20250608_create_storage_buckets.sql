-- Create buckets for cafe images and user avatars
insert into storage.buckets (id, name, public)
values
  ('cafes', 'cafes', false),
  ('avatars', 'avatars', false)
  on conflict (id) do nothing;

-- Enable RLS on objects table
alter table storage.objects enable row level security;

-- Policies for cafe images
create policy "cafes_read" on storage.objects
  for select using (bucket_id = 'cafes');
create policy "cafes_insert" on storage.objects
  for insert with check (bucket_id = 'cafes' and owner = auth.uid());
create policy "cafes_update" on storage.objects
  for update using (bucket_id = 'cafes' and owner = auth.uid());
create policy "cafes_delete" on storage.objects
  for delete using (bucket_id = 'cafes' and owner = auth.uid());

-- Policies for user avatars
create policy "avatars_read" on storage.objects
  for select using (bucket_id = 'avatars');
create policy "avatars_insert" on storage.objects
  for insert with check (bucket_id = 'avatars' and owner = auth.uid());
create policy "avatars_update" on storage.objects
  for update using (bucket_id = 'avatars' and owner = auth.uid());
create policy "avatars_delete" on storage.objects
  for delete using (bucket_id = 'avatars' and owner = auth.uid());
