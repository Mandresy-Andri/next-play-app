-- Migration: 001_profiles
-- Creates the public.profiles table mirroring auth.users.
-- Tracks anonymous flag, display_name, avatar_url.
-- A trigger auto-inserts a row whenever a new auth user is created.

create table if not exists public.profiles (
  id            uuid        primary key references auth.users (id) on delete cascade,
  display_name  text,
  avatar_url    text,
  anonymous     boolean     not null default false,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

comment on table public.profiles is
  'Public profile for every auth user. anonymous=true means the account was created via anonymous sign-in and has not yet been upgraded to a permanent account. The id is stable across identity linking (linkIdentity), so upgrading a guest never changes the row — only anonymous flips to false.';

-- Keep updated_at current automatically
create or replace function public.handle_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute procedure public.handle_updated_at();

-- Auto-create a profile row when a new auth user is inserted.
-- Reads is_anonymous from auth.users directly (Supabase sets this field).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name, avatar_url, anonymous)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', new.raw_user_meta_data->>'full_name'),
    new.raw_user_meta_data->>'avatar_url',
    coalesce(new.is_anonymous, false)
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Sync anonymous flag when a guest upgrades (identity linked, is_anonymous flipped to false)
create or replace function public.handle_user_updated()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.profiles
  set
    anonymous    = coalesce(new.is_anonymous, false),
    display_name = coalesce(new.raw_user_meta_data->>'display_name', new.raw_user_meta_data->>'full_name', display_name),
    avatar_url   = coalesce(new.raw_user_meta_data->>'avatar_url', avatar_url),
    updated_at   = now()
  where id = new.id;
  return new;
end;
$$;

create trigger on_auth_user_updated
  after update on auth.users
  for each row execute procedure public.handle_user_updated();
