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
