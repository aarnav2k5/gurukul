-- Run this once in Supabase SQL Editor if schema.sql was already run.
drop policy if exists "teachers can upload resources" on storage.objects;
drop policy if exists "teachers can delete resources" on storage.objects;
create policy "teachers can upload resources" on storage.objects for insert to authenticated
with check (bucket_id = 'resources' and public.is_teacher() and (storage.foldername(name))[1] = (select auth.uid()::text));
create policy "teachers can delete resources" on storage.objects for delete to authenticated
using (bucket_id = 'resources' and public.is_teacher() and (storage.foldername(name))[1] = (select auth.uid()::text));
