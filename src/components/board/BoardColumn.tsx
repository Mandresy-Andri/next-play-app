import { memo } from 'react'
import { Droppable } from '@hello-pangea/dnd'
import { motion } from 'framer-motion'
import { Plus } from 'lucide-react'
import { cn } from '@/lib/cn'
import { NeuIconButton, NeuSkeleton } from '@/components/ui'
import { TaskCard } from './TaskCard'
import type { TaskWithLabels, TaskStatus } from '@/lib/db/tasks'
import type { ColumnConfig } from './columnConfig'

export { COLUMN_CONFIG } from './columnConfig'

interface BoardColumnProps {
  config: ColumnConfig
  tasks: TaskWithLabels[]
  isLoading: boolean
  onAddTask: (status: TaskStatus) => void
  onTaskClick: (task: TaskWithLabels) => void
}

const SkeletonCard = () => (
  <div className="bg-[#eef1f6] rounded-2xl p-3.5 shadow-[4px_4px_10px_rgba(163,177,198,0.45),-4px_-4px_10px_rgba(255,255,255,0.75)]">
    <div className="flex items-start gap-2.5">
      <NeuSkeleton className="w-2 h-2 rounded-full mt-1.5 shrink-0" />
      <div className="flex-1 flex flex-col gap-2">
        <NeuSkeleton className="h-3.5 w-full rounded" />
        <NeuSkeleton className="h-3.5 w-3/4 rounded" />
      </div>
    </div>
    <div className="mt-2.5 ml-4.5 flex gap-1.5">
      <NeuSkeleton className="h-4 w-14 rounded-full" />
      <NeuSkeleton className="h-4 w-10 rounded-full" />
    </div>
  </div>
)

export const BoardColumn = memo(function BoardColumn({
  config, tasks, isLoading, onAddTask, onTaskClick,
}: BoardColumnProps) {
  return (
    <div className="flex flex-col w-72 shrink-0">
      {/* Column header */}
      <div className={cn(
        'flex items-center justify-between px-4 py-3 mb-3',
        'bg-[#eef1f6] rounded-2xl',
        'shadow-[5px_5px_10px_rgba(163,177,198,0.5),-5px_-5px_10px_rgba(255,255,255,0.8)]',
        'border-t-2',
        config.glow
      )}>
        <div className="flex items-center gap-2.5">
          <h2 className="text-sm font-bold text-[#1a2035]">{config.label}</h2>
          <span className={cn(
            'text-xs font-bold px-2 py-0.5 rounded-full',
            'bg-[#e6e9f0] shadow-[inset_1px_1px_2px_rgba(163,177,198,0.4),inset_-1px_-1px_2px_rgba(255,255,255,0.7)]',
            config.accent
          )}>
            {tasks.length}
          </span>
        </div>
        <NeuIconButton
          icon={<Plus />}
          label={`Add task to ${config.label}`}
          size="sm"
          variant="ghost"
          onClick={() => onAddTask(config.status)}
        />
      </div>

      {/* Droppable area */}
      <Droppable droppableId={config.status}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={cn(
              'flex-1 flex flex-col gap-2.5 px-2 py-2 rounded-2xl min-h-[200px]',
              'transition-all duration-200',
              snapshot.isDraggingOver
                ? 'bg-blue-50/60 shadow-[inset_4px_4px_10px_rgba(163,177,198,0.35),inset_-4px_-4px_10px_rgba(255,255,255,0.6)]'
                : 'bg-[#e8ecf1] shadow-[inset_3px_3px_7px_rgba(163,177,198,0.4),inset_-3px_-3px_7px_rgba(255,255,255,0.65)]'
            )}
            aria-label={`${config.label} task list`}
          >
            {isLoading ? (
              <>
                <SkeletonCard />
                <SkeletonCard />
                <SkeletonCard />
              </>
            ) : tasks.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className={cn(
                  'flex flex-col items-center justify-center text-center py-10 px-4',
                  'flex-1',
                  snapshot.isDraggingOver && 'opacity-50'
                )}
              >
                <div className={cn(
                  'w-10 h-10 rounded-2xl flex items-center justify-center mb-3',
                  config.iconBg,
                  'shadow-[3px_3px_6px_rgba(163,177,198,0.4),-3px_-3px_6px_rgba(255,255,255,0.7)]'
                )}>
                  <Plus className={cn('w-4 h-4', config.accent)} aria-hidden="true" />
                </div>
                <p className="text-xs font-semibold text-[#94a3b8] mb-1">
                  No tasks here yet
                </p>
                <button
                  onClick={() => onAddTask(config.status)}
                  className="text-xs text-blue-500 font-semibold hover:text-blue-600 transition-colors"
                >
                  Add the first one
                </button>
              </motion.div>
            ) : (
              tasks.map((task, idx) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  index={idx}
                  onClick={onTaskClick}
                />
              ))
            )}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  )
})
