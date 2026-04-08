-- Migration: 002_spaces
-- Creates spaces (user-owned boards) and space_members (team access).
-- owner_id is denormalized for fast ownership checks without joining space_members.
-- space_members is the source of truth for all membership including the owner.

create table if not exists public.spaces (
  id          uuid        primary key default gen_random_uuid(),
  owner_id    uuid        not null references public.profiles (id) on delete cascade,
  name        text        not null,
  color       text        not null default '#60a5fa',  -- light-blue default
  icon        text,                                     -- emoji or icon name
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

comment on table public.spaces is
  'A workspace board owned by a user. One user can have many spaces (Work, Personal, …). color/icon are purely cosmetic metadata for the UI.';

create trigger spaces_updated_at
  before update on public.spaces
  for each row execute procedure public.handle_updated_at();

-- space_members: explicit membership table for the team-members advanced feature.
-- role: 'owner' | 'member' — owner is auto-inserted by trigger below.
create table if not exists public.space_members (
  space_id    uuid        not null references public.spaces (id) on delete cascade,
  user_id     uuid        not null references public.profiles (id) on delete cascade,
  role        text        not null default 'member'
                          check (role in ('owner', 'member')),
  joined_at   timestamptz not null default now(),
  primary key (space_id, user_id)
);

comment on table public.space_members is
  'Membership table for spaces. The space owner is always present here with role=owner. Additional members can be added for the team-members feature.';

-- Auto-add owner as a member when a space is created
create or replace function public.handle_new_space()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.space_members (space_id, user_id, role)
  values (new.id, new.owner_id, 'owner')
  on conflict do nothing;
  return new;
end;
$$;

create trigger on_space_created
  after insert on public.spaces
  for each row execute procedure public.handle_new_space();

-- Auto-create a default "Personal" space for every new user
create or replace function public.handle_new_user_space()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.spaces (owner_id, name, color, icon)
  values (new.id, 'Personal', '#60a5fa', '🏠');
  return new;
end;
$$;

create trigger on_profile_created_space
  after insert on public.profiles
  for each row execute procedure public.handle_new_user_space();

-- Indexes: membership lookups and owner FK
create index if not exists spaces_owner_id_idx         on public.spaces (owner_id);
create index if not exists space_members_user_id_idx   on public.space_members (user_id);
create index if not exists space_members_space_id_idx  on public.space_members (space_id);
