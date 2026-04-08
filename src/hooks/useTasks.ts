import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  listTasks, createTask, updateTask, deleteTask, reorderTask,
} from '@/lib/db/tasks'
import type { Task, TaskWithLabels, TaskInsert, TaskUpdate, TaskStatus } from '@/lib/db/tasks'
import { useAuth } from '@/providers/useAuth'
import { useToast } from '@/providers/useToast'
import { useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export const taskKey = (spaceId: string) => ['tasks', spaceId] as const

export type GroupedTasks = Record<TaskStatus, TaskWithLabels[]>

/** Return tasks grouped by status column, sorted by position within each column. */
function groupByStatus(tasks: TaskWithLabels[]): GroupedTasks {
  const groups: GroupedTasks = { todo: [], in_progress: [], in_review: [], done: [] }
  for (const task of tasks) {
    const col = task.status as TaskStatus
    if (col in groups) groups[col].push(task)
  }
  return groups
}

export function useTasks(spaceId: string) {
  const query = useQuery({
    queryKey: taskKey(spaceId),
    queryFn: () => listTasks(spaceId),
    enabled: Boolean(spaceId),
  })

  const grouped: GroupedTasks = query.data ? groupByStatus(query.data) : {
    todo: [], in_progress: [], in_review: [], done: [],
  }

  return { ...query, grouped }
}

export function useCreateTask() {
  const qc = useQueryClient()
  const { user } = useAuth()
  const { toast } = useToast()

  return useMutation({
    mutationFn: (input: TaskInsert) => createTask(input),

    onMutate: async (input) => {
      const key = taskKey(input.space_id)
      await qc.cancelQueries({ queryKey: key })

      const previous = qc.getQueryData<TaskWithLabels[]>(key)

      // Optimistic temp task
      const tempTask: TaskWithLabels = {
        id: `temp-${Date.now()}`,
        title: input.title,
        description: input.description ?? null,
        status: input.status ?? 'todo',
        priority: input.priority ?? 'normal',
        position: input.position ?? 0,
        space_id: input.space_id,
        created_by: user?.id ?? '',
        assignee_id: input.assignee_id ?? null,
        due_date: input.due_date ?? null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        labels: [],
        assignee: null,
      }

      qc.setQueryData<TaskWithLabels[]>(key, old => [...(old ?? []), tempTask])
      return { previous, tempId: tempTask.id }
    },

    onSuccess: (real, input, ctx) => {
      const key = taskKey(input.space_id)
      qc.setQueryData<TaskWithLabels[]>(key, old =>
        old?.map(t => t.id === ctx?.tempId
          ? { ...real, labels: [], assignee: null }
          : t
        ) ?? []
      )
    },

    onError: (err: Error, input, ctx) => {
      if (ctx?.previous !== undefined) {
        qc.setQueryData(taskKey(input.space_id), ctx.previous)
      }
      toast({ type: 'error', message: `Failed to create task: ${err.message}` })
    },
  })
}

export function useUpdateTask() {
  const qc = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; spaceId: string; updates: TaskUpdate }) =>
      updateTask(id, updates),

    onMutate: async ({ id, spaceId, updates }) => {
      const key = taskKey(spaceId)
      await qc.cancelQueries({ queryKey: key })
      const previous = qc.getQueryData<TaskWithLabels[]>(key)

      qc.setQueryData<TaskWithLabels[]>(key, old =>
        old?.map(t => t.id === id ? { ...t, ...updates } : t) ?? []
      )
      return { previous }
    },

    onSuccess: (_data, { spaceId: sid }) => {
      // Refetch to get latest labels etc
      qc.invalidateQueries({ queryKey: taskKey(sid) })
    },

    onError: (err: Error, { spaceId: sid }, ctx) => {
      if (ctx?.previous !== undefined) {
        qc.setQueryData(taskKey(sid), ctx.previous)
      }
      toast({ type: 'error', message: `Failed to update task: ${err.message}` })
    },
  })
}

export function useDeleteTask() {
  const qc = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: ({ id }: { id: string; spaceId: string }) => deleteTask(id),

    onMutate: async ({ id, spaceId }) => {
      const key = taskKey(spaceId)
      await qc.cancelQueries({ queryKey: key })
      const previous = qc.getQueryData<TaskWithLabels[]>(key)
      qc.setQueryData<TaskWithLabels[]>(key, old => old?.filter(t => t.id !== id) ?? [])
      return { previous }
    },

    onError: (_err: Error, { spaceId: sid }, ctx) => {
      if (ctx?.previous !== undefined) {
        qc.setQueryData(taskKey(sid), ctx.previous)
      }
      toast({ type: 'error', message: `Failed to delete task.` })
    },
  })
}

export function useReorderTask() {
  const qc = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: ({
      taskId, status, position,
    }: {
      taskId: string; spaceId: string; status: string; position: number
    }) => reorderTask(taskId, status, position),

    onMutate: async ({ taskId, spaceId, status, position }) => {
      const key = taskKey(spaceId)
      await qc.cancelQueries({ queryKey: key })
      const previous = qc.getQueryData<TaskWithLabels[]>(key)

      qc.setQueryData<TaskWithLabels[]>(key, old => {
        if (!old) return old
        return old.map(t =>
          t.id === taskId ? { ...t, status, position } : t
        )
      })

      return { previous }
    },

    onError: (_err: Error, { spaceId: sid }, ctx) => {
      if (ctx?.previous !== undefined) {
        qc.setQueryData(taskKey(sid), ctx.previous)
      }
      toast({ type: 'error', message: `Could not move task — changes rolled back.` })
    },
  })
}

/** Subscribe to realtime task changes for a space. Invalidates the query on any change. */
export function useRealtimeTasks(spaceId: string) {
  const qc = useQueryClient()

  useEffect(() => {
    if (!spaceId) return

    const channel = supabase
      .channel(`tasks:${spaceId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tasks',
          filter: `space_id=eq.${spaceId}`,
        },
        () => {
          qc.invalidateQueries({ queryKey: taskKey(spaceId) })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [spaceId, qc])
}

/** Compute fractional position for drag-and-drop reordering. */
export function computePosition(
  tasks: Task[],
  destIndex: number,
  excludeId?: string
): number {
  const ordered = tasks
    .filter(t => t.id !== excludeId)
    .sort((a, b) => a.position - b.position)

  if (ordered.length === 0) return 0

  if (destIndex === 0) {
    return (ordered[0]?.position ?? 1000) - 1000
  }

  if (destIndex >= ordered.length) {
    return (ordered[ordered.length - 1]?.position ?? 0) + 1000
  }

  const before = ordered[destIndex - 1]?.position ?? 0
  const after = ordered[destIndex]?.position ?? before + 2000
  return (before + after) / 2
}
