import { supabase } from '@/lib/supabase'
import type { Tables, TablesInsert } from '@/lib/database.types'

export type Comment = Tables<'comments'>
export type CommentInsert = TablesInsert<'comments'>

export type CommentWithAuthor = Comment & {
  author: { id: string; display_name: string | null; avatar_url: string | null; anonymous: boolean } | null
}

export async function listComments(taskId: string): Promise<CommentWithAuthor[]> {
  const { data, error } = await supabase
    .from('comments')
    .select('*, author:profiles!comments_author_id_fkey(id, display_name, avatar_url, anonymous)')
    .eq('task_id', taskId)
    .order('created_at', { ascending: true })

  if (error) throw error
  return (data ?? []) as unknown as CommentWithAuthor[]
}

export async function createComment(input: CommentInsert): Promise<CommentWithAuthor> {
  const { data, error } = await supabase
    .from('comments')
    .insert(input)
    .select('*, author:profiles!comments_author_id_fkey(id, display_name, avatar_url, anonymous)')
    .single()

  if (error) throw error
  return data as unknown as CommentWithAuthor
}

export async function updateComment(id: string, body: string): Promise<Comment> {
  const { data, error } = await supabase
    .from('comments')
    .update({ body, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteComment(id: string): Promise<void> {
  const { error } = await supabase.from('comments').delete().eq('id', id)
  if (error) throw error
}
