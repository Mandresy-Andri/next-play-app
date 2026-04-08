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
