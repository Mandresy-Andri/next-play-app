-- Migration: 009_profile_visibility_and_team
-- 1) Let space peers read each other's basic profile (display_name, avatar)
--    so comments, assignees, and the team page show a real name instead of
--    "Member". Email stays locked up in auth.users.
-- 2) Adds invite_member_to_space RPC: the space owner can add an existing
--    user (looked up by email) to their space.

drop policy if exists "profiles: owner can select" on public.profiles;
create policy "profiles: self or space peer can select"
  on public.profiles for select
  using (
    (select auth.uid()) = id
    or exists (
      select 1
      from public.space_members me
      join public.space_members peer
        on peer.space_id = me.space_id
      where me.user_id = (select auth.uid())
        and peer.user_id = profiles.id
    )
  );

create or replace function public.invite_member_to_space(
  p_space_id uuid,
  p_email    text
)
returns public.space_members
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_caller  uuid := auth.uid();
  v_user_id uuid;
  v_member  public.space_members;
begin
  if v_caller is null then
    raise exception 'not authenticated' using errcode = '28000';
  end if;

  if not exists (
    select 1 from public.spaces
    where id = p_space_id and owner_id = v_caller
  ) then
    raise exception 'only the space owner can invite members' using errcode = '42501';
  end if;

  select id into v_user_id
  from auth.users
  where lower(email) = lower(p_email)
  limit 1;

  if v_user_id is null then
    raise exception 'no user found with email %', p_email using errcode = 'P0002';
  end if;

  insert into public.space_members (space_id, user_id, role)
  values (p_space_id, v_user_id, 'member')
  on conflict (space_id, user_id) do update set role = excluded.role
  returning * into v_member;

  return v_member;
end;
$$;

revoke all on function public.invite_member_to_space(uuid, text) from public;
grant execute on function public.invite_member_to_space(uuid, text) to authenticated;

comment on function public.invite_member_to_space(uuid, text) is
  'Adds an existing user (looked up by email in auth.users) as a member of a space. Only the space owner may call this.';
