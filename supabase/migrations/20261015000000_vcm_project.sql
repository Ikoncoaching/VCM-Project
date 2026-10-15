-- ============================================================
-- The VCM Project: the whole database, in one file.
-- Run once in the Supabase SQL Editor (SETUP.md). Safe to re-run.
-- ============================================================
--
-- One person, one row of work per module, one completion per module, one
-- uploaded report per assessment, and the module videos in a private bucket.
-- Kirk is the one admin and reads everything; everyone else reads and writes
-- their own work only. Row level security is the whole boundary.

-- ---------- profiles ----------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  full_name text,
  is_admin boolean not null default false,
  created_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data ->> 'full_name', ''))
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.is_admin()
returns boolean language sql security definer stable set search_path = public as $$
  select coalesce((select is_admin from public.profiles where id = auth.uid()), false)
$$;

-- ---------- work and progress ----------
create table if not exists public.module_progress (
  user_id uuid not null references public.profiles (id) on delete cascade,
  slug text not null,
  completed_at timestamptz not null default now(),
  primary key (user_id, slug)
);

create table if not exists public.module_data (
  user_id uuid not null references public.profiles (id) on delete cascade,
  slug text not null,
  data jsonb not null default '{}',
  updated_at timestamptz not null default now(),
  primary key (user_id, slug)
);

alter table public.profiles enable row level security;
alter table public.module_progress enable row level security;
alter table public.module_data enable row level security;

drop policy if exists "profiles readable by self and admin" on public.profiles;
create policy "profiles readable by self and admin" on public.profiles
  for select using (id = auth.uid() or public.is_admin());
drop policy if exists "profiles updatable by self" on public.profiles;
create policy "profiles updatable by self" on public.profiles
  for update using (id = auth.uid()) with check (id = auth.uid());
-- a person may change their name and nothing else; is_admin is never
-- writable from the app (the fix Atlas needed on 2026-08-11, applied here
-- from the start)
revoke update on public.profiles from anon, authenticated;
grant update (full_name) on public.profiles to authenticated;

drop policy if exists "progress owner all" on public.module_progress;
create policy "progress owner all" on public.module_progress
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists "progress readable by admin" on public.module_progress;
create policy "progress readable by admin" on public.module_progress
  for select using (public.is_admin());

drop policy if exists "data owner all" on public.module_data;
create policy "data owner all" on public.module_data
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists "data readable by admin" on public.module_data;
create policy "data readable by admin" on public.module_data
  for select using (public.is_admin());

-- ---------- storage: uploaded report PDFs ----------
-- files live at reports/{user_id}/{module-slug}.pdf
insert into storage.buckets (id, name, public) values ('reports', 'reports', false)
on conflict (id) do update set public = false;

drop policy if exists "reports owner all" on storage.objects;
create policy "reports owner all" on storage.objects
  for all using (
    bucket_id = 'reports' and (storage.foldername(name))[1] = auth.uid()::text
  ) with check (
    bucket_id = 'reports' and (storage.foldername(name))[1] = auth.uid()::text
  );
drop policy if exists "reports readable by admin" on storage.objects;
create policy "reports readable by admin" on storage.objects
  for select using (bucket_id = 'reports' and public.is_admin());

-- ---------- storage: the module videos ----------
-- Private: a page asks for a signed URL and this policy answers. Everyone
-- signed in may watch; there is nothing to unlock on this site beyond
-- signing in. Uploads go through the service role (scripts/upload-media.mjs).
insert into storage.buckets (id, name, public) values ('course-media', 'course-media', false)
on conflict (id) do update set public = false;

drop policy if exists "course media for the signed in" on storage.objects;
create policy "course media for the signed in" on storage.objects
  for select using (bucket_id = 'course-media' and auth.uid() is not null);
