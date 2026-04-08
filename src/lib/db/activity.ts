import { supabase } from '@/lib/supabase'
import type { Tables } from '@/lib/database.types'

export type ActivityLog = Tables<'activity_log'>

export type ActivityWithActor = ActivityLog & {
  actor: { id: string; display_name: string | null; avatar_url: string | null } | null
}

export async function listTaskActivity(taskId: string): Promise<ActivityWithActor[]> {
  const { data, error } = await supabase
    .from('activity_log')
    .select('*, actor:profiles!activity_log_actor_id_fkey(id, display_name, avatar_url)')
    .eq('task_id', taskId)
    .order('created_at', { ascending: true })

  if (error) throw error
  return (data ?? []) as unknown as ActivityWithActor[]
}

export async function listSpaceActivity(spaceId: string, limit = 20): Promise<ActivityWithActor[]> {
  const { data, error } = await supabase
    .from('activity_log')
    .select('*, actor:profiles!activity_log_actor_id_fkey(id, display_name, avatar_url)')
    .eq('space_id', spaceId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw error
  return (data ?? []) as unknown as ActivityWithActor[]
}
