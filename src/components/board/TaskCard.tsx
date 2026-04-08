import { memo } from 'react'
import { Draggable } from 'react-beautiful-dnd'
import { motion } from 'framer-motion'
import { Calendar, AlertCircle } from 'lucide-react'
import { format, isPast, isToday, addDays, isBefore } from 'date-fns'
import { cn } from '@/lib/cn'
import { NeuAvatar } from '@/components/ui'
import type { TaskWithLabels, TaskPriority } from '@/lib/db/tasks'

interface TaskCardProps {
  task: TaskWithLabels
  index: number
  onClick: (task: TaskWithLabels) => void
}

const PRIORITY_DOT: Record<TaskPriority, string> = {
  low:    'bg-slate-400',
  normal: 'bg-blue-400',
  high:   'bg-rose-500',
}

const PRIORITY_LABEL: Record<TaskPriority, string> = {
  low:    'Low',
  normal: 'Normal',
  high:   'High',
}

function DueDateChip({ dateStr }: { dateStr: string }) {
  const date = new Date(dateStr + 'T00:00:00')
  const overdue   = isPast(date) && !isToday(date)
  const dueSoon   = !overdue && isBefore(date, addDays(new Date(), 3))
  const dueToday  = isToday(date)

  const chipClass = cn(
    'inline-flex items-center gap-1 text-[10px] font-semibold rounded-full px-2 py-0.5',
    overdue  && 'bg-red-100 text-red-600',
    dueToday && 'bg-amber-100 text-amber-700',
    dueSoon  && !dueToday && 'bg-orange-100 text-orange-600',
    !overdue && !dueSoon && !dueToday && 'bg-[#e2e8f0] text-[#64748b]'
  )

  return (
    <span className={chipClass}>
      {(overdue || dueToday) && <AlertCircle className="w-2.5 h-2.5" aria-hidden="true" />}
      {!overdue && !dueToday && <Calendar className="w-2.5 h-2.5" aria-hidden="true" />}
      {overdue ? 'Overdue' : format(date, 'MMM d')}
    </span>
  )
}

const MAX_LABELS = 3

export const TaskCard = memo(function TaskCard({ task, index, onClick }: TaskCardProps) {
  const priority = (task.priority as TaskPriority) ?? 'normal'
  const visibleLabels = task.labels.slice(0, MAX_LABELS)
  const extraLabels   = task.labels.length - MAX_LABELS

  return (
    <Draggable draggableId={task.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={cn(
            'group outline-none',
            snapshot.isDragging && 'z-50'
          )}
          style={provided.draggableProps.style}
          onClick={() => onClick(task)}
          onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') onClick(task) }}
          tabIndex={0}
          role="button"
          aria-label={`Task: ${task.title}`}
        >
          <motion.div
            animate={snapshot.isDragging ? {
              scale: 1.025,
              rotate: 1.5,
              boxShadow: '12px 14px 28px rgba(163,177,198,0.65), -8px -8px 20px rgba(255,255,255,0.9)',
            } : {
              scale: 1,
              rotate: 0,
              boxShadow: '4px 4px 10px rgba(163,177,198,0.55), -4px -4px 10px rgba(255,255,255,0.85)',
            }}
            transition={{ duration: 0.18, ease: [0.25, 0.46, 0.45, 0.94] }}
            className={cn(
              'bg-[#eef1f6] rounded-2xl p-3.5 cursor-grab active:cursor-grabbing',
              'border border-transparent',
              'transition-[border-color] duration-150',
              'hover:border-blue-200/60',
              'focus-visible:outline-2 focus-visible:outline-blue-400 focus-visible:outline-offset-1',
              snapshot.isDragging && 'border-blue-300/50 cursor-grabbing'
            )}
          >
            {/* Priority dot + title */}
            <div className="flex items-start gap-2.5">
              <span
                className={cn(
                  'mt-1.5 w-2 h-2 rounded-full shrink-0',
                  PRIORITY_DOT[priority]
                )}
                aria-label={`Priority: ${PRIORITY_LABEL[priority]}`}
                title={`Priority: ${PRIORITY_LABEL[priority]}`}
              />
              <p className={cn(
                'flex-1 text-sm font-semibold text-[#1a2035] leading-snug',
                'line-clamp-2'
              )}>
                {task.title}
              </p>
            </div>

            {/* Labels */}
            {visibleLabels.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2.5 ml-4.5">
                {visibleLabels.map(label => (
                  <span
                    key={label.id}
                    className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                    style={{
                      background: label.color + '22',
                      color: label.color,
                      border: `1px solid ${label.color}44`,
                    }}
                  >
                    {label.name}
                  </span>
                ))}
                {extraLabels > 0 && (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#e2e8f0] text-[#64748b]">
                    +{extraLabels}
                  </span>
                )}
              </div>
            )}

            {/* Footer: due date + assignee */}
            {(task.due_date || task.assignee) && (
              <div className="flex items-center justify-between mt-2.5 ml-4.5">
                <div>
                  {task.due_date && <DueDateChip dateStr={task.due_date} />}
                </div>
                {task.assignee && (
                  <NeuAvatar
                    name={task.assignee.display_name ?? 'User'}
                    src={task.assignee.avatar_url ?? undefined}
                    size="xs"
                  />
                )}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </Draggable>
  )
})
