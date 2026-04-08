import { useQuery } from '@tanstack/react-query'
import { listMembers } from '@/lib/db/members'

export const membersKey = (spaceId: string) => ['members', spaceId] as const

export function useMembers(spaceId: string) {
  return useQuery({
    queryKey: membersKey(spaceId),
    queryFn: () => listMembers(spaceId),
    enabled: Boolean(spaceId),
    staleTime: 1000 * 60 * 5,
  })
}
