import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useToast } from '@/providers/useToast'
import {
  listLabels, createLabel, updateLabel, deleteLabel,
  addLabelToTask, removeLabelFromTask,
} from '@/lib/db/labels'
import type { LabelInsert, LabelUpdate } from '@/lib/db/labels'
import { taskKey } from '@/hooks/useTasks'

export const labelKey = (spaceId: string) => ['labels', spaceId] as const

export function useLabels(spaceId: string) {
  return useQuery({
    queryKey: labelKey(spaceId),
    queryFn: () => listLabels(spaceId),
    enabled: Boolean(spaceId),
  })
}

export function useCreateLabel(spaceId: string) {
  const qc = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: (input: Omit<LabelInsert, 'space_id'>) =>
      createLabel({ ...input, space_id: spaceId }),

    onSuccess: () => {
      qc.invalidateQueries({ queryKey: labelKey(spaceId) })
    },

    onError: (err: Error) => {
      toast({ type: 'error', message: `Failed to create label: ${err.message}` })
    },
  })
}

export function useUpdateLabel(spaceId: string) {
  const qc = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: LabelUpdate }) =>
      updateLabel(id, updates),

    onSuccess: () => {
      qc.invalidateQueries({ queryKey: labelKey(spaceId) })
      qc.invalidateQueries({ queryKey: taskKey(spaceId) })
    },

    onError: (err: Error) => {
      toast({ type: 'error', message: `Failed to update label: ${err.message}` })
    },
  })
}

export function useDeleteLabel(spaceId: string) {
  const qc = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: (id: string) => deleteLabel(id),

    onSuccess: () => {
      qc.invalidateQueries({ queryKey: labelKey(spaceId) })
      qc.invalidateQueries({ queryKey: taskKey(spaceId) })
    },

    onError: (err: Error) => {
      toast({ type: 'error', message: `Failed to delete label: ${err.message}` })
    },
  })
}

export function useAddTaskLabel(spaceId: string) {
  const qc = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: ({ taskId, labelId }: { taskId: string; labelId: string }) =>
      addLabelToTask(taskId, labelId),

    onSuccess: () => {
      qc.invalidateQueries({ queryKey: taskKey(spaceId) })
    },

    onError: (err: Error) => {
      toast({ type: 'error', message: `Failed to add label: ${err.message}` })
    },
  })
}

export function useRemoveTaskLabel(spaceId: string) {
  const qc = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: ({ taskId, labelId }: { taskId: string; labelId: string }) =>
      removeLabelFromTask(taskId, labelId),

    onSuccess: () => {
      qc.invalidateQueries({ queryKey: taskKey(spaceId) })
    },

    onError: (err: Error) => {
      toast({ type: 'error', message: `Failed to remove label: ${err.message}` })
    },
  })
}
