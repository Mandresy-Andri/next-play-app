import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getMyProfile, updateMyProfile, type ProfileUpdate } from '@/lib/db/profiles'
import { useAuth } from '@/providers/useAuth'
import { useToast } from '@/providers/useToast'

export const profileKey = (userId: string | undefined) => ['profile', userId] as const

export function useMyProfile() {
  const { user } = useAuth()
  return useQuery({
    queryKey: profileKey(user?.id),
    queryFn: () => (user ? getMyProfile(user.id) : Promise.resolve(null)),
    enabled: Boolean(user?.id),
    staleTime: 1000 * 60 * 5,
  })
}

export function useUpdateMyProfile() {
  const qc = useQueryClient()
  const { user } = useAuth()
  const { toast } = useToast()

  return useMutation({
    mutationFn: (updates: Pick<ProfileUpdate, 'display_name' | 'avatar_url'>) => {
      if (!user) throw new Error('Not authenticated')
      return updateMyProfile(user.id, updates)
    },
    onSuccess: (profile) => {
      qc.setQueryData(profileKey(user?.id), profile)
      // Also invalidate any member lists since display_name changed
      qc.invalidateQueries({ queryKey: ['members'] })
      qc.invalidateQueries({ queryKey: ['tasks'] })
      toast({ type: 'success', message: 'Profile updated' })
    },
    onError: (err: Error) => {
      toast({ type: 'error', message: `Failed to update profile: ${err.message}` })
    },
  })
}
