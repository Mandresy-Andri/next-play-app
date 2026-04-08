import { supabase } from '@/lib/supabase'
import type { Tables, TablesInsert, TablesUpdate } from '@/lib/database.types'

export type Space = Tables<'spaces'>
export type SpaceInsert = TablesInsert<'spaces'>
export type SpaceUpdate = TablesUpdate<'spaces'>

/** List all spaces where the current user is owner or member. */
export async function listSpaces(): Promise<Space[]> {
  const { data, error } = await supabase
    .from('spaces')
    .select('*')
    .order('created_at', { ascending: true })

  if (error) throw error
  return data ?? []
}

/** Create a new space owned by the current user. */
export async function createSpace(
  input: Pick<SpaceInsert, 'name' | 'color' | 'icon'>,
  ownerId: string
): Promise<Space> {
  const { data, error } = await supabase
    .from('spaces')
    .insert({ ...input, owner_id: ownerId })
    .select()
    .single()

  if (error) throw error
  return data
}

/** Update a space's name, color, or icon. */
export async function updateSpace(id: string, updates: SpaceUpdate): Promise<Space> {
  const { data, error } = await supabase
    .from('spaces')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

/** Delete a space by id. */
export async function deleteSpace(id: string): Promise<void> {
  const { error } = await supabase.from('spaces').delete().eq('id', id)
  if (error) throw error
}
