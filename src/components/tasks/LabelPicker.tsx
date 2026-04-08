import React, { useState, useRef, useEffect } from 'react'
import { Check, Plus, Tag, X, Loader2 } from 'lucide-react'
import { cn } from '@/lib/cn'
import { NeuBadge } from '@/components/ui/NeuBadge'
import { useLabels, useCreateLabel, useAddTaskLabel, useRemoveTaskLabel } from '@/hooks/useLabels'
import type { Label } from '@/lib/db/labels'

// Curated color palette: light-blue + complementary accents
const COLOR_OPTIONS = [
  '#60a5fa', // blue
  '#3b82f6', // blue-500
  '#0ea5e9', // sky
  '#10b981', // emerald
  '#f59e0b', // amber
  '#f97316', // orange
  '#ef4444', // rose
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#64748b', // slate
]

interface LabelPickerProps {
  taskId: string
  spaceId: string
  currentLabels: Array<{ id: string; name: string; color: string }>
}

export function LabelPicker({ taskId, spaceId, currentLabels }: LabelPickerProps) {
  const [open, setOpen] = useState(false)
  const [newName, setNewName] = useState('')
  const [newColor, setNewColor] = useState(COLOR_OPTIONS[0])
  const [showCreate, setShowCreate] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const { data: allLabels = [], isLoading } = useLabels(spaceId)
  const createLabel = useCreateLabel(spaceId)
  const addLabel = useAddTaskLabel(spaceId)
  const removeLabel = useRemoveTaskLabel(spaceId)

  const currentLabelIds = new Set(currentLabels.map(l => l.id))

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
        setShowCreate(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const toggleLabel = (label: Label) => {
    if (currentLabelIds.has(label.id)) {
      removeLabel.mutate({ taskId, labelId: label.id })
    } else {
      addLabel.mutate({ taskId, labelId: label.id })
    }
  }

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newName.trim()) return
    createLabel.mutate(
      { name: newName.trim(), color: newColor },
      {
        onSuccess: (created) => {
          addLabel.mutate({ taskId, labelId: created.id })
          setNewName('')
          setNewColor(COLOR_OPTIONS[0])
          setShowCreate(false)
        },
      }
    )
  }

  return (
    <div ref={containerRef} className="relative">
      <p className="text-[10px] font-bold uppercase tracking-widest text-[#94a3b8] mb-1.5 flex items-center gap-1.5">
        <Tag className="w-3 h-3" />Labels
      </p>

      {/* Current labels + trigger */}
      <button
        onClick={() => setOpen(v => !v)}
        className={cn(
          'flex flex-wrap gap-1.5 min-h-[36px] w-full px-3 py-2 rounded-xl text-sm text-left',
          'bg-[#e8ecf2] shadow-[inset_2px_2px_5px_rgba(163,177,198,0.5),inset_-2px_-2px_5px_rgba(255,255,255,0.7)]',
          'hover:shadow-[inset_3px_3px_6px_rgba(163,177,198,0.55),inset_-3px_-3px_6px_rgba(255,255,255,0.75)]',
          'transition-shadow duration-150 focus-visible:outline-2 focus-visible:outline-blue-400'
        )}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label="Manage labels"
      >
        {currentLabels.length === 0 ? (
          <span className="text-xs text-[#94a3b8] flex items-center gap-1.5 self-center">
            <Plus className="w-3 h-3" /> Add labels
          </span>
        ) : (
          currentLabels.map(label => (
            <NeuBadge
              key={label.id}
              className="text-[10px]"
              style={{
                background: label.color + '20',
                color: label.color,
                border: `1px solid ${label.color}40`,
              } as React.CSSProperties}
            >
              {label.name}
            </NeuBadge>
          ))
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div
          className={cn(
            'absolute left-0 right-0 mt-2 z-20 rounded-xl overflow-hidden',
            'bg-[#eef1f6] shadow-[6px_6px_16px_rgba(163,177,198,0.55),-4px_-4px_10px_rgba(255,255,255,0.85)]',
            'border border-[#dde2ec]'
          )}
          role="dialog"
          aria-label="Label picker"
        >
          <div className="px-3 py-2 max-h-48 overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center gap-2 py-2 text-xs text-[#94a3b8]">
                <Loader2 className="w-3 h-3 animate-spin" /> Loading labels…
              </div>
            ) : allLabels.length === 0 ? (
              <p className="text-xs text-[#94a3b8] py-2 text-center">No labels yet. Create one below.</p>
            ) : (
              <ul role="list" className="flex flex-col gap-0.5">
                {allLabels.map(label => {
                  const isActive = currentLabelIds.has(label.id)
                  return (
                    <li key={label.id}>
                      <button
                        onClick={() => toggleLabel(label)}
                        className={cn(
                          'flex items-center gap-2.5 w-full px-2 py-2 rounded-lg text-xs font-medium',
                          'transition-colors duration-100',
                          isActive ? 'bg-blue-50' : 'hover:bg-[#e8ecf2]'
                        )}
                        aria-pressed={isActive}
                      >
                        <span
                          className="w-3 h-3 rounded-full shrink-0"
                          style={{ background: label.color }}
                        />
                        <span className="flex-1 text-left text-[#374156]">{label.name}</span>
                        {isActive && <Check className="w-3 h-3 text-blue-500 shrink-0" />}
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>

          {/* Create new label */}
          <div className="border-t border-[#dde2ec] px-3 py-2">
            {!showCreate ? (
              <button
                onClick={() => setShowCreate(true)}
                className="flex items-center gap-1.5 w-full text-xs text-[#94a3b8] hover:text-[#374156] font-medium transition-colors py-1"
              >
                <Plus className="w-3 h-3" /> Create new label
              </button>
            ) : (
              <form onSubmit={handleCreate} className="flex flex-col gap-2">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newName}
                    onChange={e => setNewName(e.target.value)}
                    placeholder="Label name"
                    autoFocus
                    className={cn(
                      'flex-1 px-2.5 py-1.5 rounded-lg text-xs text-[#374156]',
                      'bg-[#e8ecf2] shadow-[inset_1px_1px_3px_rgba(163,177,198,0.4),inset_-1px_-1px_3px_rgba(255,255,255,0.7)]',
                      'border-none outline-none placeholder:text-[#94a3b8]',
                      'focus:ring-1 focus:ring-blue-400/40'
                    )}
                    onKeyDown={e => e.key === 'Escape' && setShowCreate(false)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowCreate(false)}
                    className="p-1.5 rounded-lg text-[#94a3b8] hover:text-[#374156] hover:bg-[#e8ecf2] transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>

                {/* Color picker */}
                <div className="flex gap-1.5 flex-wrap">
                  {COLOR_OPTIONS.map(color => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setNewColor(color)}
                      className={cn(
                        'w-5 h-5 rounded-full transition-transform',
                        newColor === color ? 'scale-125 ring-2 ring-white ring-offset-1' : 'hover:scale-110'
                      )}
                      style={{ background: color }}
                      aria-label={`Select color ${color}`}
                      aria-pressed={newColor === color}
                    />
                  ))}
                </div>

                <button
                  type="submit"
                  disabled={!newName.trim() || createLabel.isPending}
                  className={cn(
                    'flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold',
                    'transition-all duration-150',
                    newName.trim()
                      ? 'bg-blue-500 text-white hover:bg-blue-600'
                      : 'bg-[#e8ecf2] text-[#94a3b8] cursor-not-allowed'
                  )}
                >
                  {createLabel.isPending ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <><Plus className="w-3 h-3" /> Create</>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
