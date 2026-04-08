import { supabase } from '@/lib/supabase'
import type { Tables, TablesInsert, TablesUpdate } from '@/lib/database.types'

export type Task = Tables<'tasks'>
export type TaskInsert = TablesInsert<'tasks'>
export type TaskUpdate = TablesUpdate<'tasks'>

export type TaskStatus = 'todo' | 'in_progress' | 'in_review' | 'done'
export type TaskPriority = 'low' | 'normal' | 'high'

export type TaskWithLabels = Task & {
  labels: Array<{ id: string; name: string; color: string }>
  assignee: { id: string; display_name: string | null; avatar_url: string | null } | null
}

/** Fetch all tasks for a space, with labels and assignee. Ordered by position. */
export async function listTasks(spaceId: string): Promise<TaskWithLabels[]> {
  const { data, error } = await supabase
    .from('tasks')
    .select(`
      *,
      assignee:profiles!tasks_assignee_id_fkey(id, display_name, avatar_url),
      labels:task_labels(label:labels(id, name, color))
    `)
    .eq('space_id', spaceId)
    .order('position', { ascending: true })

  if (error) throw error

  // Flatten the nested join shape from Supabase
  return ((data as any) ?? []).map((row: any) => ({
    ...row,
    assignee: row.assignee ?? null,
    labels: ((row.labels ?? []) as Array<{ label: { id: string; name: string; color: string } | null }>)
      .flatMap((tl: any) => (tl.label ? [tl.label] : [])),
  })) as TaskWithLabels[]
}

/** Create a new task. */
export async function createTask(input: TaskInsert): Promise<Task> {
  const { data, error } = await supabase
    .from('tasks')
    .insert(input)
    .select()
    .single()

  if (error) throw error
  return data
}

/** Update a task's fields. */
export async function updateTask(id: string, updates: TaskUpdate): Promise<Task> {
  const { data, error } = await supabase
    .from('tasks')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

/** Delete a task. */
export async function deleteTask(id: string): Promise<void> {
  const { error } = await supabase.from('tasks').delete().eq('id', id)
  if (error) throw error
}

/** Atomically reorder a task via the Postgres RPC. */
export async function reorderTask(
  taskId: string,
  status: string,
  position: number
): Promise<void> {
  const { error } = await supabase.rpc('reorder_task', {
    p_task_id: taskId,
    p_status: status,
    p_position: position,
  })
  if (error) throw error
}
