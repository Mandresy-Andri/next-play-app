import { supabase } from '@/lib/supabase'
import type { Tables, TablesInsert, TablesUpdate } from '@/lib/database.types'

export type Label = Tables<'labels'>
export type LabelInsert = TablesInsert<'labels'>
export type LabelUpdate = TablesUpdate<'labels'>

export async function listLabels(spaceId: string): Promise<Label[]> {
  const { data, error } = await supabase
    .from('labels')
    .select('*')
    .eq('space_id', spaceId)
    .order('created_at', { ascending: true })

  if (error) throw error
  return data ?? []
}

export async function createLabel(input: LabelInsert): Promise<Label> {
  const { data, error } = await supabase
    .from('labels')
    .insert(input)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateLabel(id: string, updates: LabelUpdate): Promise<Label> {
  const { data, error } = await supabase
    .from('labels')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteLabel(id: string): Promise<void> {
  const { error } = await supabase.from('labels').delete().eq('id', id)
  if (error) throw error
}

export async function addLabelToTask(taskId: string, labelId: string): Promise<void> {
  const { error } = await supabase
    .from('task_labels')
    .insert({ task_id: taskId, label_id: labelId })

  if (error && error.code !== '23505') throw error // ignore duplicate key
}

export async function removeLabelFromTask(taskId: string, labelId: string): Promise<void> {
  const { error } = await supabase
    .from('task_labels')
    .delete()
    .eq('task_id', taskId)
    .eq('label_id', labelId)

  if (error) throw error
}
