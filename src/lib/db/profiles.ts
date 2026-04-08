import { supabase } from '@/lib/supabase'
import type { Tables, TablesUpdate } from '@/lib/database.types'

export type Profile = Tables<'profiles'>
export type ProfileUpdate = TablesUpdate<'profiles'>

/** Fetch the signed-in user's profile row. */
export async function getMyProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle()

  if (error) throw error
  return data
}

/** Update the signed-in user's profile. */
export async function updateMyProfile(
  userId: string,
  updates: Pick<ProfileUpdate, 'display_name' | 'avatar_url'>
): Promise<Profile> {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single()

  if (error) throw error
  return data
}
