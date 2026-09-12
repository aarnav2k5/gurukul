-- Run this once if schema.sql was already run. Safe to re-run.
drop policy if exists "public visitors can read resources" on public.resources;
create policy "public visitors can read resources" on public.resources for select to anon using (true);
update storage.buckets set public = true where id = 'resources';
