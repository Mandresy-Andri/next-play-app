import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, X, Flag, Calendar } from 'lucide-react'
import { cn } from '@/lib/cn'
import { NeuButton, NeuIconButton } from '@/components/ui'
import { useCreateTask } from '@/hooks/useTasks'
import { useAuth } from '@/providers/useAuth'
import type { TaskStatus, TaskPriority } from '@/lib/db/tasks'

interface NewTaskModalProps {
  open: boolean
  onClose: () => void
  spaceId: string
  defaultStatus?: TaskStatus
  defaultPosition?: number
}

const PRIORITY_OPTIONS: { value: TaskPriority; label: string; dot: string }[] = [
  { value: 'low',    label: 'Low',    dot: 'bg-slate-400' },
  { value: 'normal', label: 'Normal', dot: 'bg-blue-400' },
  { value: 'high',   label: 'High',   dot: 'bg-rose-500' },
]

export function NewTaskModal({ open, onClose, spaceId, defaultStatus = 'todo', defaultPosition = 0 }: NewTaskModalProps) {
  const { user } = useAuth()
  const createTask = useCreateTask()

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState<TaskPriority>('normal')
  const [dueDate, setDueDate] = useState('')

  const titleRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      setTimeout(() => {
        setTitle('')
        setDescription('')
        setPriority('normal')
        setDueDate('')
        titleRef.current?.focus()
      }, 0)
    }
  }, [open])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (open) document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, onClose])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !user) return

    // `created_by` is defaulted server-side to auth.uid() — see migration 008.
    createTask.mutate({
      title: title.trim(),
      description: description.trim() || null,
      status: defaultStatus,
      priority,
      due_date: dueDate || null,
      space_id: spaceId,
      position: defaultPosition,
    })

    onClose()
  }

  return (
    <AnimatePresence>
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="new-task-title"
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-[#1a2035]/25 backdrop-blur-sm"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 12 }}
            transition={{ duration: 0.22, ease: [0.25, 0.46, 0.45, 0.94] }}
            className={cn(
              'relative w-full max-w-md z-10',
              'bg-[#eef1f6] rounded-2xl p-6',
              'shadow-[14px_14px_28px_rgba(163,177,198,0.6),-12px_-12px_24px_rgba(255,255,255,0.9)]'
            )}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 id="new-task-title" className="text-base font-bold text-[#1a2035]">
                  New Task
                </h2>
                <p className="text-xs text-[#94a3b8] mt-0.5 font-medium capitalize">
                  {defaultStatus.replace('_', ' ')} column
                </p>
              </div>
              <NeuIconButton icon={<X />} label="Close" size="sm" variant="ghost" onClick={onClose} />
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              {/* Title */}
              <div>
                <input
                  ref={titleRef}
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="What needs to be done?"
                  maxLength={200}
                  required
                  className={cn(
                    'w-full px-4 py-3 rounded-xl text-sm font-semibold text-[#1a2035]',
                    'bg-[#e8ecf2] shadow-[inset_3px_3px_6px_rgba(163,177,198,0.55),inset_-3px_-3px_6px_rgba(255,255,255,0.8)]',
                    'placeholder:text-[#94a3b8] placeholder:font-medium',
                    'border-none outline-none',
                    'focus:ring-2 focus:ring-blue-400/40',
                    'transition-shadow duration-150'
                  )}
                  aria-label="Task title"
                />
              </div>

              {/* Description */}
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Add a description (optional)…"
                rows={3}
                className={cn(
                  'w-full px-4 py-3 rounded-xl text-sm font-medium text-[#374156]',
                  'bg-[#e8ecf2] shadow-[inset_2px_2px_5px_rgba(163,177,198,0.5),inset_-2px_-2px_5px_rgba(255,255,255,0.7)]',
                  'placeholder:text-[#94a3b8]',
                  'resize-none border-none outline-none leading-relaxed',
                  'focus:ring-2 focus:ring-blue-400/40',
                  'transition-shadow duration-150'
                )}
                aria-label="Task description"
              />

              {/* Priority + Due Date */}
              <div className="flex gap-3">
                {/* Priority */}
                <div className="flex-1">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-[#94a3b8] mb-1.5 flex items-center gap-1">
                    <Flag className="w-3 h-3" />Priority
                  </label>
                  <div className="flex gap-1.5">
                    {PRIORITY_OPTIONS.map(p => (
                      <button
                        key={p.value}
                        type="button"
                        onClick={() => setPriority(p.value)}
                        className={cn(
                          'flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold flex-1 justify-center',
                          'transition-all duration-150',
                          priority === p.value
                            ? 'bg-[#e0e5ed] text-[#1a2035] shadow-[inset_2px_2px_4px_rgba(163,177,198,0.5),inset_-2px_-2px_4px_rgba(255,255,255,0.7)]'
                            : 'text-[#64748b] hover:bg-[#e8ecf2]'
                        )}
                        aria-pressed={priority === p.value}
                      >
                        <span className={cn('w-2 h-2 rounded-full', p.dot)} aria-hidden="true" />
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Due Date */}
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-[#94a3b8] mb-1.5 flex items-center gap-1">
                  <Calendar className="w-3 h-3" />Due Date (optional)
                </label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={e => setDueDate(e.target.value)}
                  className={cn(
                    'w-full px-3 py-2 rounded-xl text-sm font-medium text-[#374156]',
                    'bg-[#e8ecf2] shadow-[inset_2px_2px_5px_rgba(163,177,198,0.5),inset_-2px_-2px_5px_rgba(255,255,255,0.7)]',
                    'border-none outline-none',
                    'focus:ring-2 focus:ring-blue-400/40',
                    'transition-shadow duration-150'
                  )}
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-1">
                <NeuButton
                  type="button"
                  variant="ghost"
                  size="md"
                  onClick={onClose}
                  className="flex-1"
                >
                  Cancel
                </NeuButton>
                <NeuButton
                  type="submit"
                  variant="primary"
                  size="md"
                  disabled={!title.trim()}
                  isLoading={createTask.isPending}
                  leftIcon={<Plus className="w-4 h-4" />}
                  className="flex-1"
                >
                  Create Task
                </NeuButton>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
