import { useRef } from 'react'
import { Search, X, ChevronDown, Filter } from 'lucide-react'
import { cn } from '@/lib/cn'
import { useLabels } from '@/hooks/useLabels'
import { useMembers } from '@/hooks/useMembers'
import type { BoardFilters } from './filterTypes'
import { DEFAULT_FILTERS } from './filterTypes'

interface FilterBarProps {
  spaceId: string
  filters: BoardFilters
  onChange: (next: BoardFilters) => void
  totalTasks: number
  visibleTasks: number
}

function FilterSelect<T extends string>({
  value,
  options,
  onChange,
  placeholder,
}: {
  value: T
  options: { value: T; label: string }[]
  onChange: (v: T) => void
  placeholder: string
}) {
  const isActive = value !== 'all'
  return (
    <div className="relative">
      <select
        value={value}
        onChange={e => onChange(e.target.value as T)}
        className={cn(
          'appearance-none pl-3 pr-7 py-1.5 rounded-xl text-xs font-semibold cursor-pointer',
          'border-none outline-none transition-all duration-150',
          'focus:ring-2 focus:ring-blue-400/40',
          isActive
            ? 'bg-blue-100 text-blue-700 shadow-[inset_2px_2px_4px_rgba(96,165,250,0.2),inset_-2px_-2px_4px_rgba(255,255,255,0.7)]'
            : 'bg-[#e8ecf2] text-[#374156] shadow-[inset_2px_2px_4px_rgba(163,177,198,0.4),inset_-2px_-2px_4px_rgba(255,255,255,0.7)]'
        )}
        aria-label={placeholder}
      >
        <option value="all">{placeholder}</option>
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      <ChevronDown
        className={cn(
          'absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 pointer-events-none',
          isActive ? 'text-blue-500' : 'text-[#94a3b8]'
        )}
      />
    </div>
  )
}

export function FilterBar({ spaceId, filters, onChange, totalTasks, visibleTasks }: FilterBarProps) {
  const { data: labels = [] } = useLabels(spaceId)
  const { data: members = [] } = useMembers(spaceId)
  const searchRef = useRef<HTMLInputElement>(null)

  const hasFilters = filters.search !== '' ||
    filters.priority !== 'all' ||
    filters.assigneeId !== 'all' ||
    filters.labelId !== 'all' ||
    filters.dueDate !== 'all'

  const clearAll = () => onChange(DEFAULT_FILTERS)

  const set = <K extends keyof BoardFilters>(key: K, value: BoardFilters[K]) =>
    onChange({ ...filters, [key]: value })

  return (
    <div className={cn(
      'flex flex-wrap items-center gap-2 px-6 py-3 border-b border-[#dde2ec]',
      'bg-[#eef1f6]'
    )}>
      {/* Search input */}
      <div className={cn(
        'relative flex items-center',
        'flex-1 min-w-[180px] max-w-xs'
      )}>
        <Search className="absolute left-3 w-3.5 h-3.5 text-[#94a3b8] pointer-events-none" />
        <input
          ref={searchRef}
          type="text"
          value={filters.search}
          onChange={e => set('search', e.target.value)}
          placeholder="Search tasks…"
          className={cn(
            'w-full pl-8 pr-8 py-1.5 rounded-xl text-xs font-medium text-[#374156]',
            'bg-[#e8ecf2] shadow-[inset_2px_2px_4px_rgba(163,177,198,0.45),inset_-2px_-2px_4px_rgba(255,255,255,0.7)]',
            'placeholder:text-[#94a3b8] border-none outline-none',
            'focus:ring-2 focus:ring-blue-400/40 transition-shadow duration-150'
          )}
          aria-label="Search tasks"
        />
        {filters.search && (
          <button
            onClick={() => { set('search', ''); searchRef.current?.focus() }}
            className="absolute right-2 text-[#94a3b8] hover:text-[#374156] transition-colors"
            aria-label="Clear search"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Filter icon */}
      <div className="flex items-center gap-2">
        <Filter className="w-3.5 h-3.5 text-[#94a3b8]" aria-hidden="true" />
      </div>

      {/* Priority filter */}
      <FilterSelect
        value={filters.priority}
        onChange={v => set('priority', v)}
        placeholder="Priority"
        options={[
          { value: 'low', label: 'Low' },
          { value: 'normal', label: 'Normal' },
          { value: 'high', label: 'High' },
        ]}
      />

      {/* Assignee filter */}
      {members.length > 0 && (
        <FilterSelect
          value={filters.assigneeId}
          onChange={v => set('assigneeId', v)}
          placeholder="Assignee"
          options={members.map(m => ({
            value: m.user_id,
            label: m.profile.display_name ?? 'Member',
          }))}
        />
      )}

      {/* Label filter */}
      {labels.length > 0 && (
        <FilterSelect
          value={filters.labelId}
          onChange={v => set('labelId', v)}
          placeholder="Label"
          options={labels.map(l => ({ value: l.id, label: l.name }))}
        />
      )}

      {/* Due date filter */}
      <FilterSelect
        value={filters.dueDate}
        onChange={v => set('dueDate', v)}
        placeholder="Due date"
        options={[
          { value: 'overdue', label: 'Overdue' },
          { value: 'this_week', label: 'This week' },
          { value: 'no_date', label: 'No date' },
        ]}
      />

      {/* Results count + clear */}
      {hasFilters && (
        <div className="flex items-center gap-2 ml-auto">
          <span className="text-xs text-[#94a3b8] font-medium whitespace-nowrap">
            <span className="font-bold text-[#374156]">{visibleTasks}</span> of {totalTasks}
          </span>
          <button
            onClick={clearAll}
            className="flex items-center gap-1 text-xs text-blue-500 font-semibold hover:text-blue-700 transition-colors"
          >
            <X className="w-3 h-3" /> Clear
          </button>
        </div>
      )}
    </div>
  )
}
