import React, { useState } from 'react'
import { Pencil, Trash2, Plus, Check, X, Loader2 } from 'lucide-react'
import { cn } from '@/lib/cn'
import { NeuModal } from '@/components/ui/NeuModal'
import { useLabels, useCreateLabel, useUpdateLabel, useDeleteLabel } from '@/hooks/useLabels'
import type { Label } from '@/lib/db/labels'

const COLOR_OPTIONS = [
  '#60a5fa', '#3b82f6', '#0ea5e9', '#10b981',
  '#f59e0b', '#f97316', '#ef4444', '#8b5cf6',
  '#ec4899', '#64748b',
]

interface LabelRowProps {
  label: Label
  spaceId: string
}

function LabelRow({ label, spaceId }: LabelRowProps) {
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(label.name)
  const [color, setColor] = useState(label.color)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const updateLabel = useUpdateLabel(spaceId)
  const deleteLabel = useDeleteLabel(spaceId)

  const handleSave = () => {
    if (!name.trim()) return
    updateLabel.mutate({ id: label.id, updates: { name: name.trim(), color } })
    setEditing(false)
  }

  const handleDelete = () => {
    if (!confirmDelete) { setConfirmDelete(true); return }
    deleteLabel.mutate(label.id)
  }

  if (editing) {
    return (
      <div className="flex flex-col gap-2 p-3 rounded-xl bg-[#e8ecf2] shadow-[inset_2px_2px_5px_rgba(163,177,198,0.4),inset_-2px_-2px_5px_rgba(255,255,255,0.7)]">
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          autoFocus
          className={cn(
            'px-2.5 py-1.5 rounded-lg text-sm text-[#374156]',
            'bg-[#eef1f6] border-none outline-none',
            'focus:ring-2 focus:ring-blue-400/40 shadow-[inset_1px_1px_3px_rgba(163,177,198,0.4)]'
          )}
          onKeyDown={e => {
            if (e.key === 'Enter') handleSave()
            if (e.key === 'Escape') { setEditing(false); setName(label.name); setColor(label.color) }
          }}
        />
        <div className="flex gap-1.5 flex-wrap">
          {COLOR_OPTIONS.map(c => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              className={cn(
                'w-5 h-5 rounded-full transition-transform',
                color === c ? 'scale-125 ring-2 ring-white ring-offset-1' : 'hover:scale-110'
              )}
              style={{ background: c }}
              aria-label={`Color ${c}`}
              aria-pressed={color === c}
            />
          ))}
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleSave}
            disabled={updateLabel.isPending}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-blue-500 text-white hover:bg-blue-600 transition-colors"
          >
            {updateLabel.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
            Save
          </button>
          <button
            onClick={() => { setEditing(false); setName(label.name); setColor(label.color) }}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold text-[#64748b] hover:bg-[#dde2ec] transition-colors"
          >
            <X className="w-3 h-3" /> Cancel
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl group hover:bg-[#e8ecf2] transition-colors duration-150">
      <span className="w-3 h-3 rounded-full shrink-0" style={{ background: label.color }} />
      <span className="flex-1 text-sm font-medium text-[#374156]">{label.name}</span>
      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
        <button
          onClick={() => setEditing(true)}
          className="p-1.5 rounded-lg text-[#94a3b8] hover:text-[#374156] hover:bg-[#dde2ec] transition-colors"
          aria-label={`Edit label ${label.name}`}
        >
          <Pencil className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={handleDelete}
          className={cn(
            'p-1.5 rounded-lg transition-colors',
            confirmDelete
              ? 'text-red-500 bg-red-50'
              : 'text-[#94a3b8] hover:text-red-500 hover:bg-red-50'
          )}
          aria-label={confirmDelete ? `Confirm delete ${label.name}` : `Delete label ${label.name}`}
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
        {confirmDelete && (
          <button
            onClick={() => setConfirmDelete(false)}
            className="p-1.5 rounded-lg text-[#94a3b8] hover:bg-[#dde2ec] transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  )
}

interface ManageLabelsModalProps {
  open: boolean
  onClose: () => void
  spaceId: string
}

export function ManageLabelsModal({ open, onClose, spaceId }: ManageLabelsModalProps) {
  const { data: labels = [], isLoading } = useLabels(spaceId)
  const createLabel = useCreateLabel(spaceId)

  const [newName, setNewName] = useState('')
  const [newColor, setNewColor] = useState(COLOR_OPTIONS[0])
  const [showCreate, setShowCreate] = useState(false)

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newName.trim()) return
    createLabel.mutate(
      { name: newName.trim(), color: newColor },
      {
        onSuccess: () => {
          setNewName('')
          setNewColor(COLOR_OPTIONS[0])
          setShowCreate(false)
        },
      }
    )
  }

  return (
    <NeuModal open={open} onClose={onClose} title="Manage Labels">
      <div className="flex flex-col gap-3 min-h-[200px]">
        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin text-[#94a3b8]" />
          </div>
        )}

        {!isLoading && labels.length === 0 && !showCreate && (
          <div className="text-center py-8">
            <p className="text-sm text-[#94a3b8] font-medium mb-3">No labels in this space yet.</p>
          </div>
        )}

        {!isLoading && (
          <div className="flex flex-col gap-1">
            {labels.map(label => (
              <LabelRow key={label.id} label={label} spaceId={spaceId} />
            ))}
          </div>
        )}

        {/* Create form */}
        {showCreate ? (
          <form onSubmit={handleCreate} className="flex flex-col gap-3 p-3 rounded-xl bg-[#e8ecf2] shadow-[inset_2px_2px_5px_rgba(163,177,198,0.4),inset_-2px_-2px_5px_rgba(255,255,255,0.7)]">
            <input
              type="text"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              placeholder="Label name"
              autoFocus
              className={cn(
                'px-3 py-2 rounded-xl text-sm text-[#374156]',
                'bg-[#eef1f6] border-none outline-none placeholder:text-[#94a3b8]',
                'focus:ring-2 focus:ring-blue-400/40',
                'shadow-[inset_1px_1px_3px_rgba(163,177,198,0.4),inset_-1px_-1px_3px_rgba(255,255,255,0.7)]'
              )}
              onKeyDown={e => e.key === 'Escape' && setShowCreate(false)}
            />
            <div className="flex gap-2 flex-wrap">
              {COLOR_OPTIONS.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setNewColor(c)}
                  className={cn(
                    'w-6 h-6 rounded-full transition-transform',
                    newColor === c ? 'scale-125 ring-2 ring-white ring-offset-1' : 'hover:scale-110'
                  )}
                  style={{ background: c }}
                  aria-label={`Color ${c}`}
                  aria-pressed={newColor === c}
                />
              ))}
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={!newName.trim() || createLabel.isPending}
                className={cn(
                  'flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold',
                  'transition-all duration-150',
                  newName.trim()
                    ? 'bg-blue-500 text-white hover:bg-blue-600 shadow-[3px_3px_6px_rgba(37,99,235,0.3)]'
                    : 'bg-[#e0e5ed] text-[#94a3b8] cursor-not-allowed'
                )}
              >
                {createLabel.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                Create
              </button>
              <button
                type="button"
                onClick={() => setShowCreate(false)}
                className="px-4 py-2 rounded-xl text-sm font-semibold text-[#64748b] hover:bg-[#e8ecf2] transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <button
            onClick={() => setShowCreate(true)}
            className={cn(
              'flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-semibold',
              'text-blue-500 border border-dashed border-blue-300/60',
              'hover:bg-blue-50 hover:border-blue-400 transition-colors duration-150'
            )}
          >
            <Plus className="w-4 h-4" /> New label
          </button>
        )}
      </div>
    </NeuModal>
  )
}
