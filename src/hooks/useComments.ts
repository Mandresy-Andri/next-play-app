import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/providers/useAuth'
import { useToast } from '@/providers/useToast'
import {
  listComments, createComment, updateComment, deleteComment,
} from '@/lib/db/comments'
import type { CommentWithAuthor } from '@/lib/db/comments'

export const commentKey = (taskId: string) => ['comments', taskId] as const

export function useComments(taskId: string) {
  return useQuery({
    queryKey: commentKey(taskId),
    queryFn: () => listComments(taskId),
    enabled: Boolean(taskId),
  })
}

export function useCreateComment() {
  const qc = useQueryClient()
  const { user } = useAuth()
  const { toast } = useToast()

  return useMutation({
    mutationFn: ({ taskId, body }: { taskId: string; body: string }) =>
      createComment({ task_id: taskId, author_id: user!.id, body }),

    onMutate: async ({ taskId, body }) => {
      const key = commentKey(taskId)
      await qc.cancelQueries({ queryKey: key })
      const previous = qc.getQueryData<CommentWithAuthor[]>(key)

      const optimistic: CommentWithAuthor = {
        id: `temp-${Date.now()}`,
        task_id: taskId,
        author_id: user!.id,
        body,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        author: {
          id: user!.id,
          display_name: user?.user_metadata?.display_name ?? null,
          avatar_url: user?.user_metadata?.avatar_url ?? null,
          anonymous: user?.is_anonymous ?? false,
        },
      }

      qc.setQueryData<CommentWithAuthor[]>(key, old => [...(old ?? []), optimistic])
      return { previous, taskId }
    },

    onSuccess: (_data, { taskId }) => {
      qc.invalidateQueries({ queryKey: commentKey(taskId) })
    },

    onError: (_err: Error, { taskId }, ctx) => {
      if (ctx?.previous !== undefined) {
        qc.setQueryData(commentKey(taskId), ctx.previous)
      }
      toast({ type: 'error', message: 'Failed to post comment.' })
    },
  })
}

export function useUpdateComment() {
  const qc = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: string; taskId: string }) =>
      updateComment(id, body),

    onMutate: async ({ id, body, taskId }) => {
      const key = commentKey(taskId)
      await qc.cancelQueries({ queryKey: key })
      const previous = qc.getQueryData<CommentWithAuthor[]>(key)

      qc.setQueryData<CommentWithAuthor[]>(key, old =>
        old?.map(c => c.id === id ? { ...c, body, updated_at: new Date().toISOString() } : c) ?? []
      )
      return { previous, taskId }
    },

    onError: (_err: Error, { taskId }, ctx) => {
      if (ctx?.previous !== undefined) {
        qc.setQueryData(commentKey(taskId), ctx.previous)
      }
      toast({ type: 'error', message: 'Failed to update comment.' })
    },
  })
}

export function useDeleteComment() {
  const qc = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: ({ id }: { id: string; taskId: string }) => deleteComment(id),

    onMutate: async ({ id, taskId }) => {
      const key = commentKey(taskId)
      await qc.cancelQueries({ queryKey: key })
      const previous = qc.getQueryData<CommentWithAuthor[]>(key)
      qc.setQueryData<CommentWithAuthor[]>(key, old => old?.filter(c => c.id !== id) ?? [])
      return { previous, taskId }
    },

    onError: (_err: Error, { taskId }, ctx) => {
      if (ctx?.previous !== undefined) {
        qc.setQueryData(commentKey(taskId), ctx.previous)
      }
      toast({ type: 'error', message: 'Failed to delete comment.' })
    },
  })
}

export function useRealtimeComments(taskId: string) {
  const qc = useQueryClient()

  useEffect(() => {
    if (!taskId) return

    const channel = supabase
      .channel(`comments:${taskId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'comments', filter: `task_id=eq.${taskId}` },
        () => { qc.invalidateQueries({ queryKey: commentKey(taskId) }) }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [taskId, qc])
}
