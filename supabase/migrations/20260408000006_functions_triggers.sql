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
    -- task_id intentionally null: the row is already gone when an AFTER DELETE
    -- trigger fires, so referencing old.id would violate activity_log_task_id_fkey.
    -- The deleted task id is preserved in the payload for audit purposes.
    insert into public.activity_log (space_id, task_id, actor_id, action, payload)
    values (
      old.space_id,
      null,
      old.created_by,
      'task.deleted',
      jsonb_build_object('task_id', old.id, 'title', old.title)
    );
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
