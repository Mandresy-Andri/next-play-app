import React, { useState, useRef, useEffect } from 'react'
import { NeuModal, NeuButton, NeuInput } from '@/components/ui'
import { cn } from '@/lib/cn'
import { useCreateSpace } from '@/hooks/useSpaces'

interface NewSpaceModalProps {
  open: boolean
  onClose: () => void
  onCreated: (spaceId: string) => void
}

const COLOR_PALETTE = [
  '#3b82f6', // blue-500 (default)
  '#60a5fa', // blue-400
  '#93c5fd', // blue-300
  '#10b981', // emerald
  '#f59e0b', // amber
  '#ef4444', // red
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#64748b', // slate
]

const ICON_OPTIONS = ['', '🚀', '💼', '🎨', '📚', '🏠', '🎯', '⚡', '🌱', '💡']

export function NewSpaceModal({ open, onClose, onCreated }: NewSpaceModalProps) {
  const createSpace = useCreateSpace()
  const [name, setName] = useState('')
  const [color, setColor] = useState(COLOR_PALETTE[0])
  const [icon, setIcon] = useState('')
  const [error, setError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      setTimeout(() => {
        setName('')
        setColor(COLOR_PALETTE[0])
        setIcon('')
        setError('')
        inputRef.current?.focus()
      }, 0)
    }
  }, [open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) { setError('Name is required'); return }
    setError('')

    try {
      const space = await createSpace.mutateAsync({
        name: name.trim(),
        color,
        icon: icon || null,
      })
      onCreated(space.id)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create space')
    }
  }

  return (
    <NeuModal
      open={open}
      onClose={onClose}
      title="New Space"
      description="Create a workspace to organize your tasks."
      size="sm"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <NeuInput
          ref={inputRef}
          label="Space name"
          placeholder="e.g. Work, Personal, Design…"
          value={name}
          onChange={e => { setName(e.target.value); setError('') }}
          error={error}
          fullWidth
          maxLength={60}
        />

        {/* Icon picker */}
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-[#94a3b8] mb-2">Icon (optional)</p>
          <div className="flex flex-wrap gap-1.5">
            {ICON_OPTIONS.map(em => (
              <button
                key={em || 'none'}
                type="button"
                onClick={() => setIcon(em)}
                className={cn(
                  'w-9 h-9 rounded-xl text-base flex items-center justify-center',
                  'transition-all duration-150',
                  icon === em
                    ? 'bg-[#e0e5ed] shadow-[inset_2px_2px_4px_rgba(163,177,198,0.5),inset_-2px_-2px_4px_rgba(255,255,255,0.7)]'
                    : 'hover:bg-[#e8ecf2]',
                )}
                aria-pressed={icon === em}
                aria-label={em || 'No icon'}
              >
                {em || <span className="text-[#94a3b8] text-xs font-bold">–</span>}
              </button>
            ))}
          </div>
        </div>

        {/* Color picker */}
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-[#94a3b8] mb-2">Color</p>
          <div className="flex flex-wrap gap-2">
            {COLOR_PALETTE.map(c => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                className={cn(
                  'w-7 h-7 rounded-full transition-all duration-150',
                  color === c
                    ? 'ring-2 ring-offset-2 ring-[#3b82f6] ring-offset-[#eef1f6] scale-110'
                    : 'hover:scale-110'
                )}
                style={{ background: c }}
                aria-pressed={color === c}
                aria-label={`Color ${c}`}
              />
            ))}
          </div>
        </div>

        {/* Preview */}
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-[#e8ecf2] shadow-[inset_2px_2px_5px_rgba(163,177,198,0.45),inset_-2px_-2px_5px_rgba(255,255,255,0.65)]">
          <span
            className="w-3 h-3 rounded-full shrink-0"
            style={{ background: color }}
            aria-hidden="true"
          />
          <span className="text-sm font-semibold text-[#1a2035]">
            {icon && <span className="mr-1">{icon}</span>}
            {name.trim() || 'Space name'}
          </span>
        </div>

        <div className="flex gap-3 pt-1">
          <NeuButton type="button" variant="ghost" size="md" onClick={onClose} className="flex-1">
            Cancel
          </NeuButton>
          <NeuButton
            type="submit"
            variant="primary"
            size="md"
            isLoading={createSpace.isPending}
            disabled={!name.trim()}
            className="flex-1"
          >
            Create Space
          </NeuButton>
        </div>
      </form>
    </NeuModal>
  )
}
