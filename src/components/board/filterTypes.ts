export type PriorityFilter = 'all' | 'low' | 'normal' | 'high'
export type DueDateFilter = 'all' | 'overdue' | 'this_week' | 'no_date'

export interface BoardFilters {
  search: string
  priority: PriorityFilter
  assigneeId: string | 'all'
  labelId: string | 'all'
  dueDate: DueDateFilter
}

export const DEFAULT_FILTERS: BoardFilters = {
  search: '',
  priority: 'all',
  assigneeId: 'all',
  labelId: 'all',
  dueDate: 'all',
}
