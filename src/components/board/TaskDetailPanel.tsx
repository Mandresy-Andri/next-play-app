import React, { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Trash2, Calendar, Flag, User, Tag, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/cn'
import { NeuIconButton, NeuAvatar } from '@/components/ui'
import { useUpdateTask, useDeleteTask } from '@/hooks/useTasks'
import { useMembers } from '@/hooks/useMembers'
import { CommentThread } from '@/components/tasks/CommentThread'
import { ActivityFeed } from '@/components/tasks/ActivityFeed'
import { LabelPicker } from '@/components/tasks/LabelPicker'
import { displayNameOf } from '@/lib/displayName'
import type { TaskWithLabels, TaskStatus, TaskPriority } from '@/lib/db/tasks'

interface TaskDetailPanelProps {
  task: TaskWithLabels | null
  spaceId: string
  onClose: () => void
}

const STATUS_OPTIONS: { value: TaskStatus; label: string; color: string }[] = [
  { value: 'todo',        label: 'To Do',      color: '#64748b' },
  { value: 'in_progress', label: 'In Progress', color: '#3b82f6' },
  { value: 'in_review',   label: 'In Review',   color: '#f59e0b' },
  { value: 'done',        label: 'Done',        color: '#10b981' },
]

const PRIORITY_OPTIONS: { value: TaskPriority; label: string; color: string; dot: string }[] = [
  { value: 'low',    label: 'Low',    color: 'text-slate-500',  dot: 'bg-slate-400' },
  { value: 'normal', label: 'Normal', color: 'text-blue-500',   dot: 'bg-blue-400' },
  { value: 'high',   label: 'High',   color: 'text-rose-500',   dot: 'bg-rose-500' },
]

function SelectField<T extends string>({
  label, icon, value, options, onChange,
}: {
  label: string
  icon: React.ReactNode
  value: T
  options: { value: T; label: string; color?: string; dot?: string }[]
  onChange: (v: T) => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const current = options.find(o => o.value === value)

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div ref={ref} className="relative">
      <p className="text-[10px] font-bold uppercase tracking-widest text-[#94a3b8] mb-1.5 flex items-center gap-1.5">
        {icon}{label}
      </p>
      <button
        onClick={() => setOpen(v => !v)}
        className={cn(
          'flex items-center gap-2 w-full px-3 py-2 rounded-xl text-sm font-semibold text-[#374156]',
          'bg-[#e8ecf2] shadow-[inset_2px_2px_5px_rgba(163,177,198,0.5),inset_-2px_-2px_5px_rgba(255,255,255,0.7)]',
          'hover:shadow-[inset_3px_3px_6px_rgba(163,177,198,0.55),inset_-3px_-3px_6px_rgba(255,255,255,0.75)]',
          'transition-shadow duration-150 focus-visible:outline-2 focus-visible:outline-blue-400'
        )}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        {current?.dot && (
          <span className={cn('w-2 h-2 rounded-full shrink-0', current.dot)} aria-hidden="true" />
        )}
        {current?.color && !current.dot && (
          <span
            className="w-2 h-2 rounded-full shrink-0"
            style={{ background: current.color }}
            aria-hidden="true"
          />
        )}
        <span className="flex-1 text-left">{current?.label}</span>
        <ChevronDown className={cn('w-3.5 h-3.5 text-[#94a3b8] transition-transform duration-150', open && 'rotate-180')} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.ul
            initial={{ opacity: 0, y: -4, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className={cn(
              'absolute left-0 right-0 mt-1.5 z-20 py-1.5 rounded-xl overflow-hidden',
              'bg-[#eef1f6] shadow-[6px_6px_16px_rgba(163,177,198,0.55),-4px_-4px_10px_rgba(255,255,255,0.85)]'
            )}
            role="listbox"
          >
            {options.map(opt => (
              <li
                key={opt.value}
                role="option"
                aria-selected={opt.value === value}
                onClick={() => { onChange(opt.value); setOpen(false) }}
                className={cn(
                  'flex items-center gap-2.5 px-3 py-2 text-sm font-medium cursor-pointer',
                  'transition-colors duration-100',
                  opt.value === value
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-[#374156] hover:bg-[#e8ecf2]'
                )}
              >
                {opt.dot && <span className={cn('w-2 h-2 rounded-full shrink-0', opt.dot)} />}
                {opt.color && !opt.dot && (
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ background: opt.color }} />
                )}
                {opt.label}
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  )
}

export function TaskDetailPanel({ task, spaceId, onClose }: TaskDetailPanelProps) {
  const updateTask = useUpdateTask()
  const deleteTask = useDeleteTask()
  const { data: members = [] } = useMembers(spaceId)

  const [title, setTitle] = useState(task?.title ?? '')
  const [description, setDescription] = useState(task?.description ?? '')
  const [confirmDelete, setConfirmDelete] = useState(false)

  // Sync local state when task changes
  useEffect(() => {
    setTimeout(() => {
      setTitle(task?.title ?? '')
      setDescription(task?.description ?? '')
      setConfirmDelete(false)
    }, 0)
  }, [task?.id, task?.title, task?.description])

  // Escape key to close
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  const saveField = useCallback((updates: Parameters<typeof updateTask.mutate>[0]['updates']) => {
    if (!task) return
    updateTask.mutate({ id: task.id, spaceId, updates })
  }, [task, spaceId, updateTask])

  const debouncedSave = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleTitleBlur = () => {
    if (!task || title.trim() === task.title) return
    if (title.trim()) saveField({ title: title.trim() })
    else setTitle(task.title) // revert empty
  }

  const handleDescBlur = () => {
    if (!task || description === (task.description ?? '')) return
    saveField({ description: description || null })
  }

  const handleDescChange = (v: string) => {
    setDescription(v)
    if (debouncedSave.current) clearTimeout(debouncedSave.current)
    debouncedSave.current = setTimeout(() => {
      if (!task) return
      saveField({ description: v || null })
    }, 1200)
  }

  const handleDelete = () => {
    if (!task) return
    if (!confirmDelete) { setConfirmDelete(true); return }
    deleteTask.mutate({ id: task.id, spaceId })
    onClose()
  }

  return (
    <AnimatePresence>
      {task && (
        <>
          {/* Backdrop — subtle, board stays visible */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-30 bg-[#1a2035]/10"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Slide-over panel */}
          <motion.aside
            initial={{ x: '100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.25, 0.46, 0.45, 0.94] }}
            className={cn(
              'fixed right-0 top-0 bottom-0 z-40',
              'w-full sm:w-[400px] lg:w-[440px]',
              'bg-[#eef1f6]',
              'shadow-[-12px_0_32px_rgba(163,177,198,0.4)]',
              'flex flex-col overflow-hidden'
            )}
            aria-label="Task details"
            role="complementary"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#dde2ec] shrink-0">
              <h2 className="text-xs font-bold uppercase tracking-widest text-[#94a3b8]">
                Task Details
              </h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleDelete}
                  className={cn(
                    'flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold',
                    'transition-all duration-150',
                    confirmDelete
                      ? 'bg-red-500 text-white shadow-[3px_3px_6px_rgba(239,68,68,0.3)]'
                      : 'text-[#94a3b8] hover:text-red-500 hover:bg-red-50'
                  )}
                  aria-label={confirmDelete ? 'Confirm delete task' : 'Delete task'}
                >
                  <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                  {confirmDelete ? 'Confirm' : 'Delete'}
                </button>
                <NeuIconButton icon={<X />} label="Close panel" size="sm" variant="ghost" onClick={onClose} />
              </div>
            </div>

            {/* Scrollable body */}
            <div className="flex-1 overflow-y-auto px-5 py-5 flex flex-col gap-5">

              {/* Title */}
              <div>
                <textarea
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  onBlur={handleTitleBlur}
                  rows={2}
                  className={cn(
                    'w-full bg-transparent text-lg font-bold text-[#1a2035]',
                    'resize-none border-none outline-none leading-snug',
                    'placeholder:text-[#94a3b8]',
                    'focus:ring-0'
                  )}
                  placeholder="Task title…"
                  aria-label="Task title"
                />
              </div>

              {/* Status + Priority */}
              <div className="grid grid-cols-2 gap-3">
                <SelectField
                  label="Status"
                  icon={<Tag className="w-3 h-3" />}
                  value={task.status as TaskStatus}
                  options={STATUS_OPTIONS}
                  onChange={v => saveField({ status: v })}
                />
                <SelectField
                  label="Priority"
                  icon={<Flag className="w-3 h-3" />}
                  value={(task.priority as TaskPriority) ?? 'normal'}
                  options={PRIORITY_OPTIONS}
                  onChange={v => saveField({ priority: v })}
                />
              </div>

              {/* Due Date */}
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-[#94a3b8] mb-1.5 flex items-center gap-1.5">
                  <Calendar className="w-3 h-3" />Due Date
                </p>
                <input
                  type="date"
                  value={task.due_date ?? ''}
                  onChange={e => saveField({ due_date: e.target.value || null })}
                  className={cn(
                    'w-full px-3 py-2 rounded-xl text-sm font-semibold text-[#374156]',
                    'bg-[#e8ecf2] shadow-[inset_2px_2px_5px_rgba(163,177,198,0.5),inset_-2px_-2px_5px_rgba(255,255,255,0.7)]',
                    'border-none outline-none',
                    'focus:ring-2 focus:ring-blue-400/40',
                    'transition-shadow duration-150'
                  )}
                  aria-label="Due date"
                />
              </div>

              {/* Assignee */}
              {members.length > 0 && (
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[#94a3b8] mb-1.5 flex items-center gap-1.5">
                    <User className="w-3 h-3" />Assignee
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => saveField({ assignee_id: null })}
                      className={cn(
                        'flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold',
                        'transition-all duration-150',
                        !task.assignee_id
                          ? 'bg-[#e0e5ed] text-[#1a2035] shadow-[inset_2px_2px_4px_rgba(163,177,198,0.45),inset_-2px_-2px_4px_rgba(255,255,255,0.7)]'
                          : 'text-[#64748b] hover:bg-[#e8ecf2]'
                      )}
                    >
                      Unassigned
                    </button>
                    {members.map(m => {
                      const name = displayNameOf({
                        displayName: m.profile?.display_name,
                        isAnonymous: m.profile?.anonymous,
                        fallback: 'Teammate',
                      })
                      return (
                        <button
                          key={m.user_id}
                          onClick={() => saveField({ assignee_id: m.user_id })}
                          className={cn(
                            'flex items-center gap-1.5 px-2 py-1.5 rounded-xl text-xs font-semibold',
                            'transition-all duration-150',
                            task.assignee_id === m.user_id
                              ? 'bg-blue-100 text-blue-700 shadow-[inset_2px_2px_4px_rgba(96,165,250,0.2),inset_-2px_-2px_4px_rgba(255,255,255,0.8)]'
                              : 'text-[#374156] hover:bg-[#e8ecf2]'
                          )}
                        >
                          <NeuAvatar
                            name={name}
                            src={m.profile?.avatar_url ?? undefined}
                            size="xs"
                          />
                          {name}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Description */}
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-[#94a3b8] mb-1.5">
                  Description
                </p>
                <textarea
                  value={description}
                  onChange={e => handleDescChange(e.target.value)}
                  onBlur={handleDescBlur}
                  rows={5}
                  placeholder="Add a description…"
                  className={cn(
                    'w-full px-3 py-2.5 rounded-xl text-sm font-medium text-[#374156]',
                    'bg-[#e8ecf2] shadow-[inset_2px_2px_5px_rgba(163,177,198,0.5),inset_-2px_-2px_5px_rgba(255,255,255,0.7)]',
                    'placeholder:text-[#94a3b8]',
                    'resize-y border-none outline-none leading-relaxed',
                    'focus:ring-2 focus:ring-blue-400/40',
                    'transition-shadow duration-150'
                  )}
                  aria-label="Task description"
                />
              </div>

              {/* Labels — editable picker */}
              <LabelPicker
                taskId={task.id}
                spaceId={spaceId}
                currentLabels={task.labels}
              />

              {/* Comments thread */}
              <div data-slot="comments">
                <CommentThread taskId={task.id} />
              </div>

              {/* Activity feed */}
              <div data-slot="activity">
                <ActivityFeed taskId={task.id} />
              </div>
            </div>

            {/* Metadata footer */}
            <div className="border-t border-[#dde2ec] px-5 py-3 shrink-0">
              <p className="text-[11px] text-[#94a3b8] font-medium">
                Created {new Date(task.created_at).toLocaleDateString(undefined, {
                  month: 'short', day: 'numeric', year: 'numeric'
                })}
              </p>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}
