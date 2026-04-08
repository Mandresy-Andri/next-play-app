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
  return (data ?? []) as SpaceMember[]
}
