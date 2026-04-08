import { useParams } from 'react-router-dom'
import { formatDistanceToNow } from 'date-fns'
import { cn } from '@/lib/cn'
import { AppShell } from '@/components/layout/AppShell'
import { NeuSkeleton } from '@/components/ui/NeuSkeleton'
import { NeuAvatar } from '@/components/ui/NeuAvatar'
import { EmptyState } from '@/components/ui/EmptyState'
import { useTasks } from '@/hooks/useTasks'
import { useSpaces } from '@/hooks/useSpaces'
import { useSpaceActivity, useRealtimeActivity } from '@/hooks/useActivity'
import type { ActivityWithActor } from '@/lib/db/activity'
import type { Json } from '@/lib/database.types'
import { BarChart2 } from 'lucide-react'

/* ─── Types ────────────────────────────────────────────────────────────────── */
interface StatCardProps {
  label: string
  value: number | string
  sub?: string
  accent?: 'blue' | 'emerald' | 'rose' | 'amber' | 'default'
}

/* ─── Helpers ──────────────────────────────────────────────────────────────── */
function getPayload(raw: Json): Record<string, Json> {
  if (typeof raw === 'object' && raw !== null && !Array.isArray(raw)) {
    return raw as Record<string, Json>
  }
  return {}
}

function formatActivitySummary(event: ActivityWithActor): string {
  const actorName = event.actor?.display_name ?? 'Someone'
  const payload = getPayload(event.payload)

  switch (event.action) {
    case 'task.created': return `${actorName} created "${payload.title ?? 'a task'}"`
    case 'task.status_changed': return `${actorName} moved task from ${payload.from} to ${payload.to}`
    case 'task.assigned': return `${actorName} ${payload.to ? 'assigned' : 'unassigned'} a task`
    case 'task.edited': return `${actorName} edited task details`
    case 'task.deleted': return `${actorName} deleted "${payload.title ?? 'a task'}"`
    default: return `${actorName} performed an action`
  }
}

function isOverdue(dateStr: string | null): boolean {
  if (!dateStr) return false
  return new Date(dateStr) < new Date(new Date().toDateString())
}

function wasThisWeek(dateStr: string): boolean {
  const now = new Date()
  const date = new Date(dateStr)
  const weekStart = new Date(now)
  weekStart.setDate(now.getDate() - 7)
  return date >= weekStart
}

function wasLastWeek(dateStr: string): boolean {
  const now = new Date()
  const date = new Date(dateStr)
  const weekStart = new Date(now)
  weekStart.setDate(now.getDate() - 7)
  const twoWeeksAgo = new Date(now)
  twoWeeksAgo.setDate(now.getDate() - 14)
  return date >= twoWeeksAgo && date < weekStart
}

/* ─── Components ───────────────────────────────────────────────────────────── */

function StatCard({ label, value, sub, accent = 'default' }: StatCardProps) {
  const accentMap = {
    blue: 'text-blue-600',
    emerald: 'text-emerald-600',
    rose: 'text-rose-600',
    amber: 'text-amber-600',
    default: 'text-[#1a2035]',
  }

  return (
    <div className={cn(
      'flex flex-col gap-1 px-5 py-4 rounded-2xl',
      'bg-[#eef1f6] shadow-[6px_6px_12px_rgba(163,177,198,0.55),-6px_-6px_12px_rgba(255,255,255,0.85)]'
    )}>
      <p className="text-[10px] font-bold uppercase tracking-widest text-[#94a3b8]">{label}</p>
      <p className={cn('text-3xl font-bold leading-none', accentMap[accent])}>{value}</p>
      {sub && <p className="text-xs text-[#94a3b8] font-medium mt-0.5">{sub}</p>}
    </div>
  )
}

const COLUMN_CONFIG = [
  { status: 'todo',        label: 'To Do',      color: '#64748b' },
  { status: 'in_progress', label: 'In Progress', color: '#3b82f6' },
  { status: 'in_review',   label: 'In Review',   color: '#f59e0b' },
  { status: 'done',        label: 'Done',        color: '#10b981' },
]

function StatusBar({ grouped, total }: {
  grouped: Record<string, number>
  total: number
}) {
  return (
    <div className={cn(
      'px-5 py-4 rounded-2xl',
      'bg-[#eef1f6] shadow-[6px_6px_12px_rgba(163,177,198,0.55),-6px_-6px_12px_rgba(255,255,255,0.85)]'
    )}>
      <p className="text-[10px] font-bold uppercase tracking-widest text-[#94a3b8] mb-4">Tasks by Status</p>
      <div className="flex flex-col gap-3">
        {COLUMN_CONFIG.map(col => {
          const count = grouped[col.status] ?? 0
          const pct = total > 0 ? Math.round((count / total) * 100) : 0
          return (
            <div key={col.status}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold text-[#374156]">{col.label}</span>
                <span className="text-xs text-[#94a3b8] font-medium">{count} ({pct}%)</span>
              </div>
              <div className="h-2 rounded-full bg-[#e0e5ed] shadow-[inset_1px_1px_3px_rgba(163,177,198,0.4)]">
                <div
                  className="h-2 rounded-full transition-all duration-700"
                  style={{
                    width: `${pct}%`,
                    background: col.color,
                    boxShadow: `0 0 6px ${col.color}60`,
                  }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function PriorityBar({ counts, total }: { counts: Record<string, number>; total: number }) {
  const priorities = [
    { key: 'high', label: 'High', color: '#ef4444' },
    { key: 'normal', label: 'Normal', color: '#3b82f6' },
    { key: 'low', label: 'Low', color: '#10b981' },
  ]

  return (
    <div className={cn(
      'px-5 py-4 rounded-2xl',
      'bg-[#eef1f6] shadow-[6px_6px_12px_rgba(163,177,198,0.55),-6px_-6px_12px_rgba(255,255,255,0.85)]'
    )}>
      <p className="text-[10px] font-bold uppercase tracking-widest text-[#94a3b8] mb-4">Tasks by Priority</p>
      <div className="flex gap-3 h-24 items-end">
        {priorities.map(p => {
          const count = counts[p.key] ?? 0
          const pct = total > 0 ? Math.max((count / total) * 100, count > 0 ? 6 : 0) : 0
          return (
            <div key={p.key} className="flex flex-col items-center gap-1.5 flex-1">
              <span className="text-xs font-bold text-[#374156]">{count}</span>
              <div className="w-full rounded-t-lg transition-all duration-700"
                style={{ height: `${pct}%`, background: p.color, boxShadow: `0 -2px 8px ${p.color}40`, minHeight: count > 0 ? '8px' : '0' }}
              />
              <span className="text-[10px] text-[#94a3b8] font-medium">{p.label}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function ActivityPanel({ spaceId }: { spaceId: string }) {
  const { data: events = [], isLoading, isError } = useSpaceActivity(spaceId, 20)
  useRealtimeActivity(spaceId)

  return (
    <div className={cn(
      'px-5 py-4 rounded-2xl',
      'bg-[#eef1f6] shadow-[6px_6px_12px_rgba(163,177,198,0.55),-6px_-6px_12px_rgba(255,255,255,0.85)]'
    )}>
      <p className="text-[10px] font-bold uppercase tracking-widest text-[#94a3b8] mb-4">Recent Activity</p>

      {isLoading && (
        <div className="flex flex-col gap-3">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="flex gap-3">
              <NeuSkeleton className="w-6 h-6 rounded-full shrink-0" />
              <div className="flex-1 space-y-1.5">
                <NeuSkeleton className="h-3 w-4/5 rounded" />
                <NeuSkeleton className="h-2.5 w-1/4 rounded" />
              </div>
            </div>
          ))}
        </div>
      )}

      {isError && (
        <p className="text-xs text-red-500 font-medium">Failed to load activity.</p>
      )}

      {!isLoading && !isError && events.length === 0 && (
        <p className="text-xs text-[#94a3b8] text-center py-4">No activity recorded yet.</p>
      )}

      {!isLoading && !isError && events.length > 0 && (
        <div className="flex flex-col gap-0">
          {events.map((event, i) => (
            <div key={event.id} className={cn(
              'flex gap-3 py-3',
              i < events.length - 1 && 'border-b border-[#e0e5ed]'
            )}>
              <NeuAvatar
                name={event.actor?.display_name ?? 'System'}
                src={event.actor?.avatar_url ?? undefined}
                size="xs"
                className="shrink-0 mt-0.5"
              />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-[#374156] leading-relaxed">{formatActivitySummary(event)}</p>
                <p className="text-[10px] text-[#94a3b8] mt-0.5">
                  {formatDistanceToNow(new Date(event.created_at), { addSuffix: true })}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/* ─── Page ──────────────────────────────────────────────────────────────────── */
export default function StatsPage() {
  const { spaceId = '' } = useParams<{ spaceId: string }>()
  const { data: spaces = [] } = useSpaces()
  const { data: tasks = [], isLoading, isError } = useTasks(spaceId)

  const space = spaces.find(s => s.id === spaceId)
  const spaceName = space?.name ?? 'Space'

  // Compute stats
  const total = tasks.length
  const doneTasks = tasks.filter(t => t.status === 'done').length
  const overdueTasks = tasks.filter(t => isOverdue(t.due_date) && t.status !== 'done').length
  const completionRate = total > 0 ? Math.round((doneTasks / total) * 100) : 0

  const thisWeekCount = tasks.filter(t => wasThisWeek(t.created_at)).length
  const lastWeekCount = tasks.filter(t => wasLastWeek(t.created_at)).length

  const statusCounts: Record<string, number> = {}
  const priorityCounts: Record<string, number> = {}
  for (const task of tasks) {
    statusCounts[task.status] = (statusCounts[task.status] ?? 0) + 1
    priorityCounts[task.priority] = (priorityCounts[task.priority] ?? 0) + 1
  }

  const weekTrend = lastWeekCount > 0
    ? `${thisWeekCount > lastWeekCount ? '+' : ''}${thisWeekCount - lastWeekCount} vs last week`
    : undefined

  return (
    <AppShell topBarSubtitle={spaceName} topBarTitle="Stats">
      {/* Loading */}
      {isLoading && (
        <div className="p-6 grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <NeuSkeleton key={i} className="h-28 rounded-2xl" />
          ))}
          <NeuSkeleton className="h-48 rounded-2xl col-span-2" />
          <NeuSkeleton className="h-48 rounded-2xl col-span-2" />
        </div>
      )}

      {/* Error */}
      {isError && !isLoading && (
        <div className="flex items-center justify-center h-full p-8">
          <p className="text-sm text-red-500 font-medium">Failed to load stats.</p>
        </div>
      )}

      {/* Empty state */}
      {!isLoading && !isError && total === 0 && (
        <div className="flex items-center justify-center h-full p-8">
          <EmptyState
            icon={<BarChart2 className="w-10 h-10 text-blue-400" />}
            title="No tasks yet"
            description="Create tasks on the board and they will appear here with stats and activity."
          />
        </div>
      )}

      {/* Stats */}
      {!isLoading && !isError && total > 0 && (
        <div className="p-6 flex flex-col gap-5 overflow-y-auto">
          {/* Headline numbers */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              label="Total Tasks"
              value={total}
              accent="default"
            />
            <StatCard
              label="Completed"
              value={doneTasks}
              sub={`${completionRate}% completion rate`}
              accent="emerald"
            />
            <StatCard
              label="Overdue"
              value={overdueTasks}
              sub={overdueTasks > 0 ? 'Needs attention' : 'All on track'}
              accent={overdueTasks > 0 ? 'rose' : 'default'}
            />
            <StatCard
              label="Created This Week"
              value={thisWeekCount}
              sub={weekTrend}
              accent="blue"
            />
          </div>

          {/* Charts row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <StatusBar grouped={statusCounts} total={total} />
            <PriorityBar counts={priorityCounts} total={total} />
          </div>

          {/* Activity feed */}
          <ActivityPanel spaceId={spaceId} />
        </div>
      )}
    </AppShell>
  )
}
