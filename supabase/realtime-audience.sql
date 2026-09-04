-- Run once in Supabase SQL Editor.
-- This protects teacher names while anonymous students use a public channel.
create policy "teachers can receive teacher presence"
on realtime.messages for select to authenticated
using (realtime.topic() = 'presence:teachers' and public.is_teacher());

create policy "teachers can publish teacher presence"
on realtime.messages for insert to authenticated
with check (realtime.topic() = 'presence:teachers' and public.is_teacher());
