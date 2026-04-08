-- Migration: 008_owner_defaults
-- Default owner_id / created_by to auth.uid() so the client never has to pass it.
-- This sidesteps any race where a stale React user.id is sent in the insert body
-- while the actual PostgREST request carries a different auth.uid() (e.g. just
-- after email confirmation or token refresh), which caused the
-- "new row violates row-level security policy" error on space creation.

alter table public.spaces
  alter column owner_id set default auth.uid();

alter table public.tasks
  alter column created_by set default auth.uid();

-- Add a WITH CHECK clause to the profile-update policy so updates aren't
-- silently dropped when a user edits their own display_name / avatar_url.
drop policy if exists "profiles: owner can update" on public.profiles;
create policy "profiles: owner can update"
  on public.profiles for update
  using      ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);
