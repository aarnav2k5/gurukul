-- Run this once in Supabase SQL Editor.
create extension if not exists pgcrypto;

create type public.app_role as enum ('teacher', 'student');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  role public.app_role not null default 'student',
  created_at timestamptz not null default now()
);

create table public.resources (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 200),
  category text not null check (category in ('notes','pyqs','papers')),
  class_level text not null default '',
  subject text not null default '',
  chapter text not null default '',
  year integer,
  marks integer,
  file_name text not null,
  file_path text not null unique,
  marking_scheme_name text,
  marking_scheme_path text,
  file_size bigint,
  marking_scheme_size bigint,
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.resources enable row level security;

create or replace function public.is_teacher() returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'teacher');
$$;

create policy "users can read their profile" on public.profiles for select to authenticated using (id = auth.uid());
create policy "students and teachers can read resources" on public.resources for select to authenticated using (true);
create policy "public visitors can read resources" on public.resources for select to anon using (true);
create policy "teachers can create resources" on public.resources for insert to authenticated with check (public.is_teacher() and owner_id = auth.uid());
create policy "teachers can update their resources" on public.resources for update to authenticated using (public.is_teacher() and owner_id = auth.uid()) with check (public.is_teacher() and owner_id = auth.uid());
create policy "teachers can delete their resources" on public.resources for delete to authenticated using (public.is_teacher() and owner_id = auth.uid());

insert into storage.buckets (id, name, public) values ('resources', 'resources', true) on conflict (id) do update set public = true;
create policy "signed-in users can download resources" on storage.objects for select to authenticated using (bucket_id = 'resources');
create policy "teachers can upload resources" on storage.objects for insert to authenticated with check (bucket_id = 'resources' and public.is_teacher() and (storage.foldername(name))[1] = (select auth.uid()::text));
create policy "teachers can delete resources" on storage.objects for delete to authenticated using (bucket_id = 'resources' and public.is_teacher() and (storage.foldername(name))[1] = (select auth.uid()::text));

create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path = public as $$
begin insert into public.profiles (id, full_name) values (new.id, coalesce(new.raw_user_meta_data->>'full_name','')); return new; end;
$$;
create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();

-- After creating the teacher account, promote it once:
-- update public.profiles set role = 'teacher' where id = 'TEACHER_USER_UUID';
