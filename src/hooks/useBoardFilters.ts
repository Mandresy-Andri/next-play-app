import { useCallback, useMemo, useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import type { BoardFilters, DueDateFilter, PriorityFilter } from '@/components/board/filterTypes'
import type { TaskWithLabels } from '@/lib/db/tasks'

function isOverdue(dateStr: string | null): boolean {
  if (!dateStr) return false
  return new Date(dateStr) < new Date(new Date().toDateString())
}

function isThisWeek(dateStr: string | null): boolean {
  if (!dateStr) return false
  const now = new Date()
  const date = new Date(dateStr)
  const weekStart = new Date(now)
  weekStart.setDate(now.getDate() - now.getDay())
  weekStart.setHours(0, 0, 0, 0)
  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekStart.getDate() + 7)
  return date >= weekStart && date < weekEnd
}

/** Read/write board filters from URL search params. */
export function useBoardFilters() {
  const [params, setParams] = useSearchParams()

  const filters: BoardFilters = useMemo(() => ({
    search: params.get('q') ?? '',
    priority: (params.get('priority') as PriorityFilter) ?? 'all',
    assigneeId: params.get('assignee') ?? 'all',
    labelId: params.get('label') ?? 'all',
    dueDate: (params.get('due') as DueDateFilter) ?? 'all',
  }), [params])

  // Debounce search writes to URL (300ms)
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const setFilters = useCallback((next: BoardFilters) => {
    const update = () => {
      setParams(prev => {
        const p = new URLSearchParams(prev)
        if (next.search) p.set('q', next.search); else p.delete('q')
        if (next.priority !== 'all') p.set('priority', next.priority); else p.delete('priority')
        if (next.assigneeId !== 'all') p.set('assignee', next.assigneeId); else p.delete('assignee')
        if (next.labelId !== 'all') p.set('label', next.labelId); else p.delete('label')
        if (next.dueDate !== 'all') p.set('due', next.dueDate); else p.delete('due')
        return p
      }, { replace: true })
    }

    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current)
    // Debounce only search changes
    const prevSearch = params.get('q') ?? ''
    if (next.search !== prevSearch) {
      searchDebounceRef.current = setTimeout(update, 300)
    } else {
      update()
    }
  }, [params, setParams])

  useEffect(() => () => {
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current)
  }, [])

  return { filters, setFilters }
}

/** Apply filters to a flat array of tasks. Returns filtered tasks. */
export function applyFilters(tasks: TaskWithLabels[], filters: BoardFilters): TaskWithLabels[] {
  let result = tasks

  if (filters.search) {
    const q = filters.search.toLowerCase()
    result = result.filter(t =>
      t.title.toLowerCase().includes(q) ||
      (t.description ?? '').toLowerCase().includes(q)
    )
  }

  if (filters.priority !== 'all') {
    result = result.filter(t => t.priority === filters.priority)
  }

  if (filters.assigneeId !== 'all') {
    result = result.filter(t => t.assignee_id === filters.assigneeId)
  }

  if (filters.labelId !== 'all') {
    result = result.filter(t => t.labels.some(l => l.id === filters.labelId))
  }

  if (filters.dueDate === 'overdue') {
    result = result.filter(t => isOverdue(t.due_date))
  } else if (filters.dueDate === 'this_week') {
    result = result.filter(t => isThisWeek(t.due_date))
  } else if (filters.dueDate === 'no_date') {
    result = result.filter(t => !t.due_date)
  }

  return result
}

