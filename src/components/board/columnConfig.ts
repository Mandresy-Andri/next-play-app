import type { TaskStatus } from '@/lib/db/tasks'

export interface ColumnConfig {
  status: TaskStatus
  label: string
  accent: string
  glow: string
  iconBg: string
}

export const COLUMN_CONFIG: ColumnConfig[] = [
  {
    status:  'todo',
    label:   'To Do',
    accent:  'text-slate-500',
    glow:    'border-t-slate-300',
    iconBg:  'bg-slate-100',
  },
  {
    status:  'in_progress',
    label:   'In Progress',
    accent:  'text-blue-500',
    glow:    'border-t-blue-300',
    iconBg:  'bg-blue-50',
  },
  {
    status:  'in_review',
    label:   'In Review',
    accent:  'text-amber-600',
    glow:    'border-t-amber-300',
    iconBg:  'bg-amber-50',
  },
  {
    status:  'done',
    label:   'Done',
    accent:  'text-emerald-600',
    glow:    'border-t-emerald-300',
    iconBg:  'bg-emerald-50',
  },
]
