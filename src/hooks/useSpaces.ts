import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { listSpaces, createSpace, updateSpace, deleteSpace } from '@/lib/db/spaces'
import type { Space, SpaceUpdate } from '@/lib/db/spaces'
import { useAuth } from '@/providers/useAuth'
import { useToast } from '@/providers/useToast'

export const SPACES_KEY = ['spaces'] as const

export function useSpaces() {
  return useQuery({
    queryKey: SPACES_KEY,
    queryFn: listSpaces,
    staleTime: 1000 * 60, // 1 min
  })
}

export function useCreateSpace() {
  const qc = useQueryClient()
  const { user } = useAuth()
  const { toast } = useToast()

  return useMutation({
    mutationFn: (input: { name: string; color: string; icon?: string | null }) => {
      if (!user) throw new Error('Not authenticated')
      return createSpace(input, user.id)
    },
    onSuccess: (newSpace) => {
      qc.setQueryData<Space[]>(SPACES_KEY, old => [...(old ?? []), newSpace])
    },
    onError: (err: Error) => {
      toast({ type: 'error', message: `Failed to create space: ${err.message}` })
    },
  })
}

export function useUpdateSpace() {
  const qc = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: SpaceUpdate }) =>
      updateSpace(id, updates),
    onSuccess: (updated) => {
      qc.setQueryData<Space[]>(SPACES_KEY, old =>
        old?.map(s => (s.id === updated.id ? updated : s)) ?? []
      )
    },
    onError: (err: Error) => {
      toast({ type: 'error', message: `Failed to update space: ${err.message}` })
    },
  })
}

export function useDeleteSpace() {
  const qc = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: (id: string) => deleteSpace(id),
    onSuccess: (_data, id) => {
      qc.setQueryData<Space[]>(SPACES_KEY, old => old?.filter(s => s.id !== id) ?? [])
    },
    onError: (err: Error) => {
      toast({ type: 'error', message: `Failed to delete space: ${err.message}` })
    },
  })
}
