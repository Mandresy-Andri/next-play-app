import { formatDistanceToNow } from 'date-fns'
import { cn } from '@/lib/cn'
import { NeuAvatar } from '@/components/ui/NeuAvatar'
import { NeuSkeleton } from '@/components/ui/NeuSkeleton'
import { useTaskActivity } from '@/hooks/useActivity'
import type { ActivityWithActor } from '@/lib/db/activity'
import type { Json } from '@/lib/database.types'

interface ActivityFeedProps {
  taskId: string
}

const STATUS_LABELS: Record<string, string> = {
  todo: 'To Do',
  in_progress: 'In Progress',
  in_review: 'In Review',
  done: 'Done',
}

const STATUS_COLORS: Record<string, string> = {
  todo: '#64748b',
  in_progress: '#3b82f6',
  in_review: '#f59e0b',
  done: '#10b981',
}

function StatusPill({ status }: { status: string }) {
  const color = STATUS_COLORS[status] ?? '#64748b'
  const label = STATUS_LABELS[status] ?? status
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold"
      style={{ background: color + '18', color }}
    >
      {label}
    </span>
  )
}

function getPayload(raw: Json): Record<string, Json> {
  if (typeof raw === 'object' && raw !== null && !Array.isArray(raw)) {
    return raw as Record<string, Json>
  }
  return {}
}

function formatAction(event: ActivityWithActor): React.ReactNode {
  const payload = getPayload(event.payload)
  const actorName = event.actor?.display_name ?? 'Someone'

  switch (event.action) {
    case 'task.created':
      return (
        <span>
          <strong className="text-[#374156]">{actorName}</strong>
          {' created this task'}
        </span>
      )

    case 'task.status_changed': {
      const from = String(payload.from ?? '')
      const to = String(payload.to ?? '')
      return (
        <span className="inline-flex flex-wrap items-center gap-1">
          <strong className="text-[#374156]">{actorName}</strong>
          {' moved from '}
          <StatusPill status={from} />
          {' to '}
          <StatusPill status={to} />
        </span>
      )
    }

    case 'task.assigned': {
      const to = payload.to
      return (
        <span>
          <strong className="text-[#374156]">{actorName}</strong>
          {to ? ' assigned this task' : ' unassigned this task'}
        </span>
      )
    }

    case 'task.edited': {
      const fields = Array.isArray(payload.fields) ? payload.fields.join(', ') : 'details'
      return (
        <span>
          <strong className="text-[#374156]">{actorName}</strong>
          {` edited ${fields}`}
        </span>
      )
    }

    case 'task.deleted':
      return (
        <span>
          <strong className="text-[#374156]">{actorName}</strong>
          {' deleted this task'}
        </span>
      )

    default:
      return (
        <span>
          <strong className="text-[#374156]">{actorName}</strong>
          {` performed action: ${event.action}`}
        </span>
      )
  }
}

function ActivityItem({ event }: { event: ActivityWithActor }) {
  const actorName = event.actor?.display_name ?? 'Someone'

  return (
    <div className="flex gap-3">
      {/* Timeline connector */}
      <div className="flex flex-col items-center shrink-0">
        <NeuAvatar
          name={actorName}
          src={event.actor?.avatar_url ?? undefined}
          size="xs"
        />
      </div>

      <div className="flex-1 min-w-0 pb-4">
        <div className="flex flex-wrap items-start gap-x-2 gap-y-0.5">
          <p className="text-xs text-[#374156] leading-relaxed flex-1">
            {formatAction(event)}
          </p>
        </div>
        <p className="text-[10px] text-[#94a3b8] mt-0.5">
          {formatDistanceToNow(new Date(event.created_at), { addSuffix: true })}
        </p>
      </div>
    </div>
  )
}

export function ActivityFeed({ taskId }: ActivityFeedProps) {
  const { data: events = [], isLoading, isError } = useTaskActivity(taskId)

  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-[10px] font-bold uppercase tracking-widest text-[#94a3b8]">
        Activity
      </h3>

      {isLoading && (
        <div className="flex flex-col gap-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex gap-3">
              <NeuSkeleton className="w-6 h-6 rounded-full shrink-0" />
              <div className="flex-1 space-y-1.5">
                <NeuSkeleton className="h-3 w-3/4 rounded" />
                <NeuSkeleton className="h-2.5 w-1/3 rounded" />
              </div>
            </div>
          ))}
        </div>
      )}

      {isError && (
        <p className="text-xs text-red-500 font-medium">Failed to load activity.</p>
      )}

      {!isLoading && !isError && events.length === 0 && (
        <p className="text-xs text-[#94a3b8] text-center py-2">No activity recorded yet.</p>
      )}

      {!isLoading && !isError && events.length > 0 && (
        <div className={cn(
          'rounded-xl px-3 py-3',
          'bg-[#e8ecf2] shadow-[inset_2px_2px_5px_rgba(163,177,198,0.4),inset_-2px_-2px_5px_rgba(255,255,255,0.7)]'
        )}>
          {events.map((event, i) => (
            <div key={event.id} className={cn(i < events.length - 1 && 'border-b border-[#dde2ec]')}>
              <ActivityItem event={event} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
