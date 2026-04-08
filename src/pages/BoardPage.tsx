import { useState, useCallback, useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { DragDropContext, type DropResult } from '@hello-pangea/dnd'
import { Plus } from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { NeuButton, InlineError } from '@/components/ui'
import { BoardColumn, COLUMN_CONFIG } from '@/components/board/BoardColumn'
import { TaskDetailPanel } from '@/components/board/TaskDetailPanel'
import { NewTaskModal } from '@/components/board/NewTaskModal'
import { FilterBar } from '@/components/board/FilterBar'
import {
  useTasks, useReorderTask, useRealtimeTasks, computePosition,
} from '@/hooks/useTasks'
import { useSpaces } from '@/hooks/useSpaces'
import { useBoardFilters, applyFilters } from '@/hooks/useBoardFilters'
import { useRealtimeActivity } from '@/hooks/useActivity'
import type { TaskStatus } from '@/lib/db/tasks'
import type { GroupedTasks } from '@/hooks/useTasks'

export default function BoardPage() {
  const { spaceId = '' } = useParams<{ spaceId: string }>()

  // Data
  const { data: allTasks = [], grouped: rawGrouped, isLoading, isError, error, refetch } = useTasks(spaceId)
  const { data: spaces = [] } = useSpaces()
  const reorderTask = useReorderTask()

  // Realtime subscriptions
  useRealtimeTasks(spaceId)
  useRealtimeActivity(spaceId)

  // Filters
  const { filters, setFilters } = useBoardFilters()

  // Apply filters to produce the visible grouped tasks
  const filteredTasks = useMemo(() => applyFilters(allTasks, filters), [allTasks, filters])

  const filteredGrouped = useMemo((): GroupedTasks => {
    const groups: GroupedTasks = { todo: [], in_progress: [], in_review: [], done: [] }
    for (const task of filteredTasks) {
      const col = task.status as TaskStatus
      if (col in groups) groups[col].push(task)
    }
    return groups
  }, [filteredTasks])

  const hasFilters = filters.search !== '' ||
    filters.priority !== 'all' ||
    filters.assigneeId !== 'all' ||
    filters.labelId !== 'all' ||
    filters.dueDate !== 'all'

  // UI state — track only the selected task id, then read the live row from the
  // React Query cache so label/assignee/etc. updates reflect in the panel immediately.
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)
  const selectedTask = useMemo(
    () => (selectedTaskId ? allTasks.find(t => t.id === selectedTaskId) ?? null : null),
    [allTasks, selectedTaskId]
  )
  const [newTaskStatus, setNewTaskStatus] = useState<TaskStatus>('todo')
  const [newTaskOpen, setNewTaskOpen] = useState(false)

  const space = spaces.find(s => s.id === spaceId)
  const spaceName = space?.name ?? (spaceId ? spaceId.charAt(0).toUpperCase() + spaceId.slice(1) : 'Board')

  const openNewTask = useCallback((status: TaskStatus) => {
    setNewTaskStatus(status)
    setNewTaskOpen(true)
  }, [])

  const handleDragEnd = useCallback((result: DropResult) => {
    const { source, destination, draggableId } = result
    if (!destination) return
    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    ) return

    const destStatus = destination.droppableId as TaskStatus
    // Always operate on raw (unfiltered) column for position computation
    const destTasks = rawGrouped[destStatus]

    const position = computePosition(destTasks, destination.index, draggableId)

    reorderTask.mutate({
      taskId: draggableId,
      spaceId,
      status: destStatus,
      position,
    })
  }, [rawGrouped, reorderTask, spaceId])

  const totalTasks = allTasks.length
  const visibleTasks = filteredTasks.length

  return (
    <AppShell
      topBarSubtitle="Spaces"
      topBarTitle={spaceName}
      topBarActions={
        <NeuButton
          variant="primary"
          size="sm"
          leftIcon={<Plus className="w-3.5 h-3.5" />}
          onClick={() => openNewTask('todo')}
        >
          New Task
        </NeuButton>
      }
    >
      {/* Error state */}
      {isError && (
        <div className="flex items-center justify-center h-full p-8">
          <div className="flex flex-col items-center gap-4 max-w-sm text-center">
            <InlineError
              message={error instanceof Error ? error.message : 'Failed to load tasks'}
            />
            <NeuButton variant="secondary" size="sm" onClick={() => refetch()}>
              Try again
            </NeuButton>
          </div>
        </div>
      )}

      {/* Board */}
      {!isError && (
        <div className="h-full flex flex-col">
          {/* Filter bar — always shown when not loading */}
          {!isLoading && (
            <FilterBar
              spaceId={spaceId}
              filters={filters}
              onChange={setFilters}
              totalTasks={totalTasks}
              visibleTasks={visibleTasks}
            />
          )}

          {/* Quick stats bar */}
          {!isLoading && !hasFilters && totalTasks > 0 && (
            <div className="flex items-center gap-4 px-6 py-2 border-b border-[#dde2ec]">
              <p className="text-xs text-[#94a3b8] font-medium">
                <span className="font-bold text-[#374156]">{totalTasks}</span> tasks total
              </p>
              <p className="text-xs text-[#94a3b8] font-medium">
                <span className="font-bold text-emerald-600">{rawGrouped.done.length}</span> done
              </p>
            </div>
          )}

          {/* Columns area — horizontally scrollable on small screens */}
          <DragDropContext onDragEnd={handleDragEnd}>
            <div className="flex-1 overflow-x-auto overflow-y-hidden">
              <div className="flex gap-4 px-6 py-5 h-full min-h-0" style={{ minWidth: 'max-content' }}>
                {COLUMN_CONFIG.map(config => (
                  <BoardColumn
                    key={config.status}
                    config={config}
                    tasks={filteredGrouped[config.status]}
                    isLoading={isLoading}
                    onAddTask={openNewTask}
                    onTaskClick={(t) => setSelectedTaskId(t.id)}
                  />
                ))}
              </div>
            </div>
          </DragDropContext>
        </div>
      )}

      {/* Task Detail Panel */}
      <TaskDetailPanel
        task={selectedTask}
        spaceId={spaceId}
        onClose={() => setSelectedTaskId(null)}
      />

      {/* New Task Modal */}
      <NewTaskModal
        open={newTaskOpen}
        onClose={() => setNewTaskOpen(false)}
        spaceId={spaceId}
        defaultStatus={newTaskStatus}
        defaultPosition={
          rawGrouped[newTaskStatus].length > 0
            ? (rawGrouped[newTaskStatus][rawGrouped[newTaskStatus].length - 1]?.position ?? 0) + 1000
            : 0
        }
      />
    </AppShell>
  )
}
