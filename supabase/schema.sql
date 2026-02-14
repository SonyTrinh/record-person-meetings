-- Enable UUID generation
create extension if not exists "pgcrypto";

create table if not exists public.meetings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text,
  status text not null default 'recording' check (status in ('recording', 'processing', 'completed', 'failed')),
  audio_path text,
  transcript text,
  summary text,
  started_at timestamptz,
  ended_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.meetings enable row level security;

create policy "Users can view own meetings"
on public.meetings
for select
using (auth.uid() = user_id);

create policy "Users can insert own meetings"
on public.meetings
for insert
with check (auth.uid() = user_id);

create policy "Users can update own meetings"
on public.meetings
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can delete own meetings"
on public.meetings
for delete
using (auth.uid() = user_id);

-- Keep updated_at in sync
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists meetings_updated_at on public.meetings;
create trigger meetings_updated_at
before update on public.meetings
for each row execute procedure public.touch_updated_at();

-- Storage bucket for meeting audio
insert into storage.buckets (id, name, public)
values ('meeting-audio', 'meeting-audio', false)
on conflict (id) do nothing;

create policy "Users can upload own audio"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'meeting-audio' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Users can read own audio"
on storage.objects
for select
to authenticated
using (bucket_id = 'meeting-audio' and (storage.foldername(name))[1] = auth.uid()::text);
