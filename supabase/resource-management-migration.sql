-- Run once after schema.sql. Adds persistent editing, soft-delete/restore,
-- duplicate detection metadata, and file-size display support.
alter table public.resources
  add column if not exists file_size bigint,
  add column if not exists marking_scheme_size bigint,
  add column if not exists updated_at timestamptz not null default now(),
  add column if not exists deleted_at timestamptz;

create index if not exists resources_active_browse_idx
  on public.resources (class_level, subject, chapter, category)
  where deleted_at is null;

drop policy if exists "students and teachers can read resources" on public.resources;
drop policy if exists "public visitors can read resources" on public.resources;

create policy "students and teachers can read resources"
  on public.resources for select to authenticated
  using (deleted_at is null or owner_id = auth.uid());

create policy "public visitors can read resources"
  on public.resources for select to anon
  using (deleted_at is null);
