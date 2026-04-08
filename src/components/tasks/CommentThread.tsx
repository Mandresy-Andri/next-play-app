import React, { useState, useRef } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { Send, Pencil, Trash2, Check, X } from 'lucide-react'
import { cn } from '@/lib/cn'
import { NeuAvatar } from '@/components/ui/NeuAvatar'
import { NeuSkeleton } from '@/components/ui/NeuSkeleton'
import { useAuth } from '@/providers/useAuth'
import {
  useComments, useCreateComment, useUpdateComment,
  useDeleteComment, useRealtimeComments,
} from '@/hooks/useComments'
import type { CommentWithAuthor } from '@/lib/db/comments'

interface CommentThreadProps {
  taskId: string
}

function CommentBubble({
  comment,
  isOwn,
}: {
  comment: CommentWithAuthor
  isOwn: boolean
}) {
  const [editing, setEditing] = useState(false)
  const [editBody, setEditBody] = useState(comment.body)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const updateComment = useUpdateComment()
  const deleteComment = useDeleteComment()
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const authorName = comment.author?.display_name
    ?? (comment.author?.anonymous ? 'Guest' : 'Member')

  const handleSaveEdit = () => {
    if (!editBody.trim() || editBody === comment.body) {
      setEditing(false)
      setEditBody(comment.body)
      return
    }
    updateComment.mutate({ id: comment.id, body: editBody.trim(), taskId: comment.task_id })
    setEditing(false)
  }

  const handleDelete = () => {
    if (!confirmDelete) { setConfirmDelete(true); return }
    deleteComment.mutate({ id: comment.id, taskId: comment.task_id })
  }

  const startEdit = () => {
    setEditing(true)
    setTimeout(() => textareaRef.current?.focus(), 50)
  }

  return (
    <div className="flex gap-3 group">
      <NeuAvatar
        name={authorName}
        src={comment.author?.avatar_url ?? undefined}
        size="sm"
        className="shrink-0 mt-0.5"
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2 mb-1">
          <span className="text-xs font-bold text-[#1a2035]">{authorName}</span>
          <span className="text-[10px] text-[#94a3b8]">
            {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
          </span>
          {comment.updated_at !== comment.created_at && (
            <span className="text-[10px] text-[#94a3b8] italic">(edited)</span>
          )}
        </div>

        {editing ? (
          <div className="space-y-2">
            <textarea
              ref={textareaRef}
              value={editBody}
              onChange={e => setEditBody(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSaveEdit()
                if (e.key === 'Escape') { setEditing(false); setEditBody(comment.body) }
              }}
              rows={3}
              className={cn(
                'w-full px-3 py-2 rounded-xl text-sm text-[#374156]',
                'bg-[#e8ecf2] shadow-[inset_2px_2px_5px_rgba(163,177,198,0.5),inset_-2px_-2px_5px_rgba(255,255,255,0.7)]',
                'border-none outline-none resize-none leading-relaxed',
                'focus:ring-2 focus:ring-blue-400/40'
              )}
            />
            <div className="flex gap-2">
              <button
                onClick={handleSaveEdit}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-blue-500 text-white hover:bg-blue-600 transition-colors"
              >
                <Check className="w-3 h-3" /> Save
              </button>
              <button
                onClick={() => { setEditing(false); setEditBody(comment.body) }}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold text-[#64748b] hover:bg-[#e8ecf2] transition-colors"
              >
                <X className="w-3 h-3" /> Cancel
              </button>
            </div>
          </div>
        ) : (
          <div
            className={cn(
              'px-3 py-2.5 rounded-xl text-sm text-[#374156] leading-relaxed',
              'bg-[#eef1f6] shadow-[3px_3px_6px_rgba(163,177,198,0.45),-3px_-3px_6px_rgba(255,255,255,0.75)]'
            )}
          >
            {comment.body}
          </div>
        )}

        {/* Own comment actions */}
        {isOwn && !editing && (
          <div className="flex gap-2 mt-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
            <button
              onClick={startEdit}
              className="flex items-center gap-1 text-[10px] text-[#94a3b8] hover:text-[#374156] transition-colors"
              aria-label="Edit comment"
            >
              <Pencil className="w-3 h-3" /> Edit
            </button>
            <button
              onClick={handleDelete}
              className={cn(
                'flex items-center gap-1 text-[10px] transition-colors',
                confirmDelete ? 'text-red-500 font-semibold' : 'text-[#94a3b8] hover:text-red-500'
              )}
              aria-label={confirmDelete ? 'Confirm delete' : 'Delete comment'}
            >
              <Trash2 className="w-3 h-3" />
              {confirmDelete ? 'Confirm?' : 'Delete'}
            </button>
            {confirmDelete && (
              <button
                onClick={() => setConfirmDelete(false)}
                className="text-[10px] text-[#94a3b8] hover:text-[#374156] transition-colors"
              >
                Cancel
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export function CommentThread({ taskId }: CommentThreadProps) {
  const { user } = useAuth()
  const { data: comments = [], isLoading, isError } = useComments(taskId)
  const createComment = useCreateComment()
  useRealtimeComments(taskId)

  const [body, setBody] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!body.trim() || !user) return
    createComment.mutate({ taskId, body: body.trim() })
    setBody('')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      handleSubmit(e as unknown as React.FormEvent)
    }
  }

  const authorName = user?.user_metadata?.display_name
    ?? (user?.is_anonymous ? 'Guest' : 'User')

  return (
    <div className="flex flex-col gap-4">
      <h3 className="text-[10px] font-bold uppercase tracking-widest text-[#94a3b8]">
        Comments
      </h3>

      {/* Loading */}
      {isLoading && (
        <div className="flex flex-col gap-3">
          {[1, 2].map(i => (
            <div key={i} className="flex gap-3">
              <NeuSkeleton className="w-8 h-8 rounded-full shrink-0" />
              <div className="flex-1 space-y-2">
                <NeuSkeleton className="h-3 w-24 rounded" />
                <NeuSkeleton className="h-10 w-full rounded-xl" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Error */}
      {isError && (
        <p className="text-xs text-red-500 font-medium">Failed to load comments.</p>
      )}

      {/* Empty state */}
      {!isLoading && !isError && comments.length === 0 && (
        <div className="text-center py-4">
          <p className="text-xs text-[#94a3b8] font-medium">No comments yet. Be the first to add one.</p>
        </div>
      )}

      {/* Comment list */}
      {!isLoading && !isError && comments.length > 0 && (
        <div className="flex flex-col gap-4">
          {comments.map(comment => (
            <CommentBubble
              key={comment.id}
              comment={comment}
              isOwn={comment.author_id === user?.id}
            />
          ))}
        </div>
      )}

      {/* Compose form */}
      <form onSubmit={handleSubmit} className="flex gap-3 pt-2 border-t border-[#dde2ec]">
        <NeuAvatar
          name={authorName}
          src={user?.user_metadata?.avatar_url}
          size="sm"
          className="shrink-0 mt-1"
        />
        <div className="flex-1">
          <textarea
            ref={textareaRef}
            value={body}
            onChange={e => setBody(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={2}
            placeholder="Add a comment… (Ctrl+Enter to send)"
            className={cn(
              'w-full px-3 py-2 rounded-xl text-sm text-[#374156]',
              'bg-[#e8ecf2] shadow-[inset_2px_2px_5px_rgba(163,177,198,0.5),inset_-2px_-2px_5px_rgba(255,255,255,0.7)]',
              'placeholder:text-[#94a3b8]',
              'border-none outline-none resize-none leading-relaxed',
              'focus:ring-2 focus:ring-blue-400/40 transition-shadow duration-150'
            )}
            aria-label="Comment text"
          />
          <div className="flex justify-end mt-1.5">
            <button
              type="submit"
              disabled={!body.trim() || createComment.isPending}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold',
                'transition-all duration-150',
                body.trim()
                  ? 'bg-blue-500 text-white shadow-[3px_3px_6px_rgba(37,99,235,0.3)] hover:bg-blue-600'
                  : 'bg-[#e8ecf2] text-[#94a3b8] cursor-not-allowed',
              )}
            >
              <Send className="w-3 h-3" />
              Send
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}
