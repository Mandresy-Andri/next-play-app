import { supabase } from '@/lib/supabase'
import type { Tables } from '@/lib/database.types'

export type SpaceMember = Tables<'space_members'> & {
  profile: {
    id: string
    display_name: string | null
    avatar_url: string | null
    anonymous: boolean
  }
}

/** List all members of a space, including their profile data. */
export async function listMembers(spaceId: string): Promise<SpaceMember[]> {
  const { data, error } = await supabase
    .from('space_members')
    .select(`
      *,
      profile:profiles(id, display_name, avatar_url, anonymous)
    `)
    .eq('space_id', spaceId)
    .order('joined_at', { ascending: true })

  if (error) throw error
  return (data ?? []) as unknown as SpaceMember[]
}

/** Invite an existing user to a space by email. Server-side RPC
 *  enforces that the caller is the space owner. */
export async function inviteMemberByEmail(spaceId: string, email: string) {
  const { data, error } = await supabase.rpc('invite_member_to_space', {
    p_space_id: spaceId,
    p_email: email,
  })
  if (error) throw error
  return data
}

/** Remove a member from a space (owner only — enforced by RLS). */
export async function removeMember(spaceId: string, userId: string) {
  const { error } = await supabase
    .from('space_members')
    .delete()
    .eq('space_id', spaceId)
    .eq('user_id', userId)
  if (error) throw error
}
