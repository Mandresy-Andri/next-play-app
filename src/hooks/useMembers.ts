import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { listMembers, inviteMemberByEmail, removeMember } from '@/lib/db/members'
import { useToast } from '@/providers/useToast'

export const membersKey = (spaceId: string) => ['members', spaceId] as const

export function useMembers(spaceId: string) {
  return useQuery({
    queryKey: membersKey(spaceId),
    queryFn: () => listMembers(spaceId),
    enabled: Boolean(spaceId),
    staleTime: 1000 * 60 * 5,
  })
}

export function useInviteMember(spaceId: string) {
  const qc = useQueryClient()
  const { toast } = useToast()
  return useMutation({
    mutationFn: (email: string) => inviteMemberByEmail(spaceId, email),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: membersKey(spaceId) })
      toast({ type: 'success', message: 'Member added to the space' })
    },
    onError: (err: Error) => {
      toast({ type: 'error', message: err.message })
    },
  })
}

export function useRemoveMember(spaceId: string) {
  const qc = useQueryClient()
  const { toast } = useToast()
  return useMutation({
    mutationFn: (userId: string) => removeMember(spaceId, userId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: membersKey(spaceId) })
      toast({ type: 'success', message: 'Member removed' })
    },
    onError: (err: Error) => {
      toast({ type: 'error', message: `Failed to remove member: ${err.message}` })
    },
  })
}
