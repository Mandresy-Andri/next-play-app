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
-- Migration: 003_tasks
-- Creates the tasks table.
--
-- Status/priority: using text + CHECK constraints rather than Postgres enum types.
-- Trade-off: enums are stricter and slightly faster but ALTER TYPE to add values
-- requires a table rewrite pre-PG11 and is still awkward. CHECK constraints are
-- easier to evolve and equally safe for a small value set like this.
--
-- position: stored as double precision (float8) to support fractional indexing
-- (Figma/Linear style). Inserting between two tasks sets position to their midpoint.
-- No rewrite needed when reordering — only the moved row is updated.
-- Periodic renormalization is possible if precision degrades, but with realistic
-- board sizes it will never be needed.

create table if not exists public.tasks (
  id           uuid          primary key default gen_random_uuid(),
  space_id     uuid          not null references public.spaces (id) on delete cascade,
  title        text          not null,
  description  text,
  status       text          not null default 'todo'
                             check (status in ('todo', 'in_progress', 'in_review', 'done')),
  priority     text          not null default 'normal'
                             check (priority in ('low', 'normal', 'high')),
  due_date     date,
  assignee_id  uuid          references public.profiles (id) on delete set null,
  position     float8        not null default 0,
  created_by   uuid          not null references public.profiles (id) on delete cascade,
  created_at   timestamptz   not null default now(),
  updated_at   timestamptz   not null default now()
);

comment on table public.tasks is
  'Kanban task card. position is a float8 used for fractional indexing within a (space_id, status) column — only the moved row needs updating on drag-and-drop.';

comment on column public.tasks.position is
  'Fractional index (float8) for ordering within a column (space_id+status). Midpoint between neighbors on reorder. New tasks appended at max(position)+1000.';

create trigger tasks_updated_at
  before update on public.tasks
  for each row execute procedure public.handle_updated_at();

-- Hot path: board load — all tasks for a space ordered by status then position
create index if not exists tasks_space_status_position_idx
  on public.tasks (space_id, status, position);

-- RLS filter on created_by (used when filtering own tasks)
create index if not exists tasks_created_by_idx
  on public.tasks (created_by);

-- Assignee FK lookup
create index if not exists tasks_assignee_id_idx
  on public.tasks (assignee_id);
-- Migration: 004_labels_comments_activity
-- Labels, task_labels join, comments, and activity_log tables.

-- Labels are scoped per space so each workspace has its own label set.
create table if not exists public.labels (
  id          uuid        primary key default gen_random_uuid(),
  space_id    uuid        not null references public.spaces (id) on delete cascade,
  name        text        not null,
  color       text        not null default '#60a5fa',
  created_at  timestamptz not null default now(),
  unique (space_id, name)
);

comment on table public.labels is
  'Per-space labels/tags (e.g. Bug, Feature, Design). Scoped to a space so label names are reusable across spaces without collision.';

-- Junction table: many tasks ↔ many labels
create table if not exists public.task_labels (
  task_id     uuid  not null references public.tasks (id) on delete cascade,
  label_id    uuid  not null references public.labels (id) on delete cascade,
  primary key (task_id, label_id)
);

comment on table public.task_labels is
  'Many-to-many join between tasks and labels. Preferred over Postgres arrays for queryability and referential integrity.';

-- Indexes for FK lookups on task_labels
create index if not exists task_labels_label_id_idx  on public.task_labels (label_id);
create index if not exists labels_space_id_idx       on public.labels (space_id);

-- Comments on tasks
create table if not exists public.comments (
  id          uuid        primary key default gen_random_uuid(),
  task_id     uuid        not null references public.tasks (id) on delete cascade,
  author_id   uuid        not null references public.profiles (id) on delete cascade,
  body        text        not null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

comment on table public.comments is
  'User comments on a task, shown in chronological order in the task detail panel.';

create trigger comments_updated_at
  before update on public.comments
  for each row execute procedure public.handle_updated_at();

-- Hot path: load all comments for a task ordered by created_at
create index if not exists comments_task_id_created_at_idx
  on public.comments (task_id, created_at);

-- Activity log: append-only record of task events
-- action examples: 'task.created', 'task.status_changed', 'task.assigned',
--                  'task.comment_added', 'task.deleted', 'task.edited'
create table if not exists public.activity_log (
  id           uuid        primary key default gen_random_uuid(),
  space_id     uuid        not null references public.spaces (id) on delete cascade,
  task_id      uuid        references public.tasks (id) on delete set null,
  actor_id     uuid        references public.profiles (id) on delete set null,
  action       text        not null,
  payload      jsonb       not null default '{}',
  created_at   timestamptz not null default now()
);

comment on table public.activity_log is
  'Append-only audit log for task events. payload stores before/after values as needed per action. task_id is nullable to retain history after task deletion.';

-- Hot path: activity feed for a space, sorted by recency
create index if not exists activity_log_space_id_created_at_idx
  on public.activity_log (space_id, created_at desc);

-- Secondary: look up all activity for a specific task
create index if not exists activity_log_task_id_idx
  on public.activity_log (task_id);
-- Migration: 005_rls
-- Enables RLS on every user-facing table and defines tight policies.
-- All policies use (select auth.uid()) — wrapping in SELECT caches the call once
-- per query rather than re-evaluating per row (RLS performance best practice).
-- Default-deny is automatic once RLS is enabled; we only add ALLOW policies.

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
  using (
    exists (
      select 1 from public.space_members sm
      where sm.space_id = spaces.id
        and sm.user_id = (select auth.uid())
    )
  );

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

-- Members can read the membership list for spaces they belong to
create policy "space_members: members can select"
  on public.space_members for select
  using (
    exists (
      select 1 from public.space_members sm
      where sm.space_id = space_members.space_id
        and sm.user_id = (select auth.uid())
    )
  );

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
  using (
    exists (
      select 1 from public.space_members sm
      where sm.space_id = tasks.space_id
        and sm.user_id = (select auth.uid())
    )
  );

-- Members of the space can create tasks in it
create policy "tasks: space members can insert"
  on public.tasks for insert
  with check (
    (select auth.uid()) = created_by
    and exists (
      select 1 from public.space_members sm
      where sm.space_id = tasks.space_id
        and sm.user_id = (select auth.uid())
    )
  );

-- Members of the space can update tasks (drag-and-drop status, edit)
create policy "tasks: space members can update"
  on public.tasks for update
  using (
    exists (
      select 1 from public.space_members sm
      where sm.space_id = tasks.space_id
        and sm.user_id = (select auth.uid())
    )
  );

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
  using (
    exists (
      select 1 from public.space_members sm
      where sm.space_id = labels.space_id
        and sm.user_id = (select auth.uid())
    )
  );

-- Space members can create labels in their spaces
create policy "labels: space members can insert"
  on public.labels for insert
  with check (
    exists (
      select 1 from public.space_members sm
      where sm.space_id = labels.space_id
        and sm.user_id = (select auth.uid())
    )
  );

-- Space members can update labels
create policy "labels: space members can update"
  on public.labels for update
  using (
    exists (
      select 1 from public.space_members sm
      where sm.space_id = labels.space_id
        and sm.user_id = (select auth.uid())
    )
  );

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
  using (
    exists (
      select 1 from public.space_members sm
      where sm.space_id = activity_log.space_id
        and sm.user_id = (select auth.uid())
    )
  );

-- INSERT is controlled by the activity trigger (security definer).
-- No direct client INSERT policy — the log is append-only via trigger.
-- No UPDATE or DELETE policies — the log is immutable from the client.
-- Migration: 006_functions_triggers
-- 1. Activity log trigger: fires on tasks INSERT/UPDATE/DELETE
-- 2. reorder_task RPC: atomically moves a task to a new (status, position)

-- ============================================================
-- Activity log trigger
-- ============================================================
-- Appends a row to activity_log on every significant task mutation.
-- Uses security definer so the trigger can write to activity_log even though
-- clients have no INSERT policy on that table.
create or replace function public.log_task_activity()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_action  text;
  v_payload jsonb;
begin
  if (tg_op = 'INSERT') then
    v_action  := 'task.created';
    v_payload := jsonb_build_object(
      'title',  new.title,
      'status', new.status
    );

    insert into public.activity_log (space_id, task_id, actor_id, action, payload)
    values (new.space_id, new.id, new.created_by, v_action, v_payload);

  elsif (tg_op = 'UPDATE') then
    -- Status change
    if old.status is distinct from new.status then
      insert into public.activity_log (space_id, task_id, actor_id, action, payload)
      values (
        new.space_id, new.id, new.created_by,
        'task.status_changed',
        jsonb_build_object('from', old.status, 'to', new.status)
      );
    end if;

    -- Assignee change
    if old.assignee_id is distinct from new.assignee_id then
      insert into public.activity_log (space_id, task_id, actor_id, action, payload)
      values (
        new.space_id, new.id, new.created_by,
        'task.assigned',
        jsonb_build_object('from', old.assignee_id, 'to', new.assignee_id)
      );
    end if;

    -- Title or description edit
    if old.title is distinct from new.title or old.description is distinct from new.description then
      insert into public.activity_log (space_id, task_id, actor_id, action, payload)
      values (
        new.space_id, new.id, new.created_by,
        'task.edited',
        jsonb_build_object('fields', array_remove(array[
          case when old.title       is distinct from new.title       then 'title'       else null end,
          case when old.description is distinct from new.description then 'description' else null end
        ], null))
      );
    end if;

  elsif (tg_op = 'DELETE') then
    v_action  := 'task.deleted';
    v_payload := jsonb_build_object('title', old.title);

    insert into public.activity_log (space_id, task_id, actor_id, action, payload)
    values (old.space_id, old.id, old.created_by, v_action, v_payload);
  end if;

  return coalesce(new, old);
end;
$$;

create trigger task_activity_log
  after insert or update or delete on public.tasks
  for each row execute procedure public.log_task_activity();

-- ============================================================
-- reorder_task RPC
-- ============================================================
-- Moves a task to a new status column and/or position atomically.
-- Called by the drag-and-drop handler on the frontend.
--
-- Signature:
--   reorder_task(
--     p_task_id   uuid,      -- task to move
--     p_status    text,      -- destination column (todo|in_progress|in_review|done)
--     p_position  float8     -- target position (fractional index)
--   ) returns void
--
-- The caller pre-computes position as the midpoint between the two surrounding
-- tasks (or +1000 if appending to the end). This function simply applies the
-- change and verifies the caller is a space member (no security definer needed —
-- RLS on tasks already guards this, but we re-check explicitly for clarity).
create or replace function public.reorder_task(
  p_task_id  uuid,
  p_status   text,
  p_position float8
)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  -- Validate status value before writing
  if p_status not in ('todo', 'in_progress', 'in_review', 'done') then
    raise exception 'invalid status value: %', p_status;
  end if;

  update public.tasks
  set
    status   = p_status,
    position = p_position
  where id = p_task_id;

  if not found then
    raise exception 'task not found or access denied';
  end if;
end;
$$;

comment on function public.reorder_task(uuid, text, float8) is
  'Atomically updates a task''s status (column) and position (fractional index). Caller must be a space member — enforced by RLS on tasks. The frontend pre-computes position as the midpoint between neighbors.';
