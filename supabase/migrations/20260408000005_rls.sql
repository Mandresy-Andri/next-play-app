-- Migration: 005_rls
-- Enables RLS on every user-facing table and defines tight policies.
-- All policies use (select auth.uid()) — wrapping in SELECT caches the call once
-- per query rather than re-evaluating per row (RLS performance best practice).
-- Default-deny is automatic once RLS is enabled; we only add ALLOW policies.

-- ============================================================
-- Helper: is_space_member
-- ============================================================
-- security definer so it bypasses RLS on space_members and avoids the classic
-- infinite-recursion trap where a space_members policy selects from space_members.
-- Marked stable so the planner can cache per-statement.
create or replace function public.is_space_member(p_space_id uuid)
returns boolean
language sql
security definer
stable
set search_path = ''
as $$
  select exists (
    select 1 from public.space_members
    where space_id = p_space_id
      and user_id  = auth.uid()
  );
$$;

comment on function public.is_space_member(uuid) is
  'Returns true if the current auth.uid() is a member of the given space. Used by RLS policies to avoid recursive self-reference on space_members.';

-- ============================================================
-- profiles
-- ============================================================
alter table public.profiles enable row level security;

-- Users can read their own profile only
create policy "profiles: owner can select"
  on public.profiles for select
  using ((select auth.uid()) = id);

-- Users can update their own profile only
create policy "profiles: owner can update"
  on public.profiles for update
  using ((select auth.uid()) = id);

-- INSERT is handled exclusively by the handle_new_user() security-definer trigger;
-- no direct INSERT policy needed for the client.

-- ============================================================
-- spaces
-- ============================================================
alter table public.spaces enable row level security;

-- Members (including owner) can read a space
create policy "spaces: members can select"
  on public.spaces for select
  using (public.is_space_member(id));

-- Any authenticated user can create a space (they become owner via trigger)
create policy "spaces: authenticated can insert"
  on public.spaces for insert
  with check ((select auth.uid()) = owner_id);

-- Only the owner can update a space
create policy "spaces: owner can update"
  on public.spaces for update
  using ((select auth.uid()) = owner_id);

-- Only the owner can delete a space
create policy "spaces: owner can delete"
  on public.spaces for delete
  using ((select auth.uid()) = owner_id);

-- ============================================================
-- space_members
-- ============================================================
alter table public.space_members enable row level security;

-- Members can read the membership list for spaces they belong to.
-- Uses the is_space_member security-definer helper to avoid infinite recursion
-- (a plain EXISTS on space_members from within a space_members policy recurses).
create policy "space_members: members can select"
  on public.space_members for select
  using (public.is_space_member(space_id));

-- Only the space owner can add members
create policy "space_members: owner can insert"
  on public.space_members for insert
  with check (
    exists (
      select 1 from public.spaces s
      where s.id = space_members.space_id
        and s.owner_id = (select auth.uid())
    )
  );

-- Only the space owner can remove members (but not themselves — enforced in app)
create policy "space_members: owner can delete"
  on public.space_members for delete
  using (
    exists (
      select 1 from public.spaces s
      where s.id = space_members.space_id
        and s.owner_id = (select auth.uid())
    )
  );

-- ============================================================
-- tasks
-- ============================================================
alter table public.tasks enable row level security;

-- Members of the space can read tasks in that space
create policy "tasks: space members can select"
  on public.tasks for select
  using (public.is_space_member(space_id));

-- Members of the space can create tasks in it
create policy "tasks: space members can insert"
  on public.tasks for insert
  with check (
    (select auth.uid()) = created_by
    and public.is_space_member(space_id)
  );

-- Members of the space can update tasks (drag-and-drop status, edit)
create policy "tasks: space members can update"
  on public.tasks for update
  using (public.is_space_member(space_id));

-- Only the task creator or space owner can delete a task
create policy "tasks: creator or owner can delete"
  on public.tasks for delete
  using (
    (select auth.uid()) = created_by
    or exists (
      select 1 from public.spaces s
      where s.id = tasks.space_id
        and s.owner_id = (select auth.uid())
    )
  );

-- ============================================================
-- labels
-- ============================================================
alter table public.labels enable row level security;

-- Space members can read labels for their spaces
create policy "labels: space members can select"
  on public.labels for select
  using (public.is_space_member(space_id));

-- Space members can create labels in their spaces
create policy "labels: space members can insert"
  on public.labels for insert
  with check (public.is_space_member(space_id));

-- Space members can update labels
create policy "labels: space members can update"
  on public.labels for update
  using (public.is_space_member(space_id));

-- Only space owner can delete labels
create policy "labels: space owner can delete"
  on public.labels for delete
  using (
    exists (
      select 1 from public.spaces s
      where s.id = labels.space_id
        and s.owner_id = (select auth.uid())
    )
  );

-- ============================================================
-- task_labels
-- ============================================================
alter table public.task_labels enable row level security;

-- Space members can read task_labels for tasks in their spaces
create policy "task_labels: space members can select"
  on public.task_labels for select
  using (
    exists (
      select 1 from public.tasks t
      join public.space_members sm on sm.space_id = t.space_id
      where t.id = task_labels.task_id
        and sm.user_id = (select auth.uid())
    )
  );

-- Space members can assign labels to tasks
create policy "task_labels: space members can insert"
  on public.task_labels for insert
  with check (
    exists (
      select 1 from public.tasks t
      join public.space_members sm on sm.space_id = t.space_id
      where t.id = task_labels.task_id
        and sm.user_id = (select auth.uid())
    )
  );

-- Space members can remove labels from tasks
create policy "task_labels: space members can delete"
  on public.task_labels for delete
  using (
    exists (
      select 1 from public.tasks t
      join public.space_members sm on sm.space_id = t.space_id
      where t.id = task_labels.task_id
        and sm.user_id = (select auth.uid())
    )
  );

-- ============================================================
-- comments
-- ============================================================
alter table public.comments enable row level security;

-- Space members can read all comments on tasks in their spaces
create policy "comments: space members can select"
  on public.comments for select
  using (
    exists (
      select 1 from public.tasks t
      join public.space_members sm on sm.space_id = t.space_id
      where t.id = comments.task_id
        and sm.user_id = (select auth.uid())
    )
  );

-- Space members can add comments
create policy "comments: space members can insert"
  on public.comments for insert
  with check (
    (select auth.uid()) = author_id
    and exists (
      select 1 from public.tasks t
      join public.space_members sm on sm.space_id = t.space_id
      where t.id = comments.task_id
        and sm.user_id = (select auth.uid())
    )
  );

-- Only the comment author can update their own comment
create policy "comments: author can update"
  on public.comments for update
  using ((select auth.uid()) = author_id);

-- Author or space owner can delete a comment
create policy "comments: author or owner can delete"
  on public.comments for delete
  using (
    (select auth.uid()) = author_id
    or exists (
      select 1 from public.tasks t
      join public.spaces s on s.id = t.space_id
      where t.id = comments.task_id
        and s.owner_id = (select auth.uid())
    )
  );

-- ============================================================
-- activity_log
-- ============================================================
alter table public.activity_log enable row level security;

-- Space members can read the activity log for their spaces
create policy "activity_log: space members can select"
  on public.activity_log for select
  using (public.is_space_member(space_id));

-- INSERT is controlled by the activity trigger (security definer).
-- No direct client INSERT policy — the log is append-only via trigger.
-- No UPDATE or DELETE policies — the log is immutable from the client.
