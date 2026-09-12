-- Run once after schema.sql. This allows only the newest teacher tab/device
-- to remain active for a teacher account.
create table if not exists public.teacher_sessions (
  user_id uuid primary key references auth.users(id) on delete cascade,
  session_id text not null,
  updated_at timestamptz not null default now()
);

alter table public.teacher_sessions enable row level security;

drop policy if exists "teachers can read own active session" on public.teacher_sessions;
drop policy if exists "teachers can create own active session" on public.teacher_sessions;
drop policy if exists "teachers can update own active session" on public.teacher_sessions;

create policy "teachers can read own active session"
  on public.teacher_sessions for select to authenticated
  using (user_id = auth.uid() and public.is_teacher());

create policy "teachers can create own active session"
  on public.teacher_sessions for insert to authenticated
  with check (user_id = auth.uid() and public.is_teacher());

create policy "teachers can update own active session"
  on public.teacher_sessions for update to authenticated
  using (user_id = auth.uid() and public.is_teacher())
  with check (user_id = auth.uid() and public.is_teacher());
