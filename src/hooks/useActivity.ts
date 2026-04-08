import { useQuery } from '@tanstack/react-query'
import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { listTaskActivity, listSpaceActivity } from '@/lib/db/activity'

export const taskActivityKey = (taskId: string) => ['activity', 'task', taskId] as const
export const spaceActivityKey = (spaceId: string) => ['activity', 'space', spaceId] as const

export function useTaskActivity(taskId: string) {
  return useQuery({
    queryKey: taskActivityKey(taskId),
    queryFn: () => listTaskActivity(taskId),
    enabled: Boolean(taskId),
  })
}

export function useSpaceActivity(spaceId: string, limit = 20) {
  return useQuery({
    queryKey: [...spaceActivityKey(spaceId), limit],
    queryFn: () => listSpaceActivity(spaceId, limit),
    enabled: Boolean(spaceId),
  })
}

export function useRealtimeActivity(spaceId: string) {
  const qc = useQueryClient()

  useEffect(() => {
    if (!spaceId) return

    const channel = supabase
      .channel(`activity:${spaceId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'activity_log', filter: `space_id=eq.${spaceId}` },
        () => {
          qc.invalidateQueries({ queryKey: spaceActivityKey(spaceId) })
          // Also invalidate task-specific activity for any open task panels
          qc.invalidateQueries({ queryKey: ['activity', 'task'] })
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [spaceId, qc])
}
