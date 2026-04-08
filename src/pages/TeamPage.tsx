import { useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { UserPlus, Mail, Crown, Trash2, Users, CheckCircle2, Loader2 } from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { NeuButton, NeuInput, NeuAvatar, NeuBadge, InlineError } from '@/components/ui'
import { useMembers, useInviteMember, useRemoveMember } from '@/hooks/useMembers'
import { useTasks } from '@/hooks/useTasks'
import { useSpaces } from '@/hooks/useSpaces'
import { useAuth } from '@/providers/useAuth'
import { displayNameOf } from '@/lib/displayName'
import { cn } from '@/lib/cn'

/**
 * Team page — invite existing users by email, view the roster, and see
 * per-member task stats. Owner controls (invite / remove) are only rendered
 * when the current user owns the space.
 */
export default function TeamPage() {
  const { spaceId = '' } = useParams<{ spaceId: string }>()
  const { user } = useAuth()
  const { data: members = [], isLoading } = useMembers(spaceId)
  const { data: allTasks = [] } = useTasks(spaceId)
  const { data: spaces = [] } = useSpaces()
  const invite = useInviteMember(spaceId)
  const remove = useRemoveMember(spaceId)

  const space = spaces.find(s => s.id === spaceId)
  const isOwner = space?.owner_id === user?.id

  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)

  // Tasks by assignee for the stats column
  const statsByUser = useMemo(() => {
    const map = new Map<string, { total: number; done: number; overdue: number }>()
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    for (const t of allTasks) {
      if (!t.assignee_id) continue
      const s = map.get(t.assignee_id) ?? { total: 0, done: 0, overdue: 0 }
      s.total += 1
      if (t.status === 'done') s.done += 1
      if (t.due_date && t.status !== 'done' && new Date(t.due_date) < today) s.overdue += 1
      map.set(t.assignee_id, s)
    }
    return map
  }, [allTasks])

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!email.trim()) { setError('Email is required'); return }
    try {
      await invite.mutateAsync(email.trim())
      setEmail('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to invite member')
    }
  }

  return (
    <AppShell
      topBarTitle={space ? `${space.name} — Team` : 'Team'}
      topBarSubtitle="Spaces"
    >
      <div className="h-full overflow-y-auto">
        <div className="max-w-3xl mx-auto px-6 py-8 flex flex-col gap-6">
          {/* Invite card — owner only */}
          {isOwner && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className={cn(
                'bg-[#eef1f6] rounded-3xl p-6',
                'shadow-[8px_8px_20px_rgba(163,177,198,0.5),-8px_-8px_20px_rgba(255,255,255,0.9)]'
              )}
            >
              <div className="flex items-center gap-2 mb-1">
                <UserPlus className="w-4 h-4 text-blue-500" />
                <h2 className="text-sm font-bold text-[#1a2035]">Invite a teammate</h2>
              </div>
              <p className="text-xs text-[#94a3b8] mb-4">
                Enter the email of an existing Next Play user. They'll get instant
                access to this space's board, labels, and comments.
              </p>
              <form onSubmit={handleInvite} className="flex flex-col sm:flex-row gap-3">
                <NeuInput
                  type="email"
                  value={email}
                  onChange={e => { setEmail(e.target.value); setError(null) }}
                  placeholder="teammate@company.com"
                  leftIcon={<Mail className="w-4 h-4" />}
                  fullWidth
                />
                <NeuButton
                  type="submit"
                  variant="primary"
                  size="md"
                  isLoading={invite.isPending}
                  disabled={!email.trim()}
                  leftIcon={<UserPlus className="w-4 h-4" />}
                >
                  Invite
                </NeuButton>
              </form>
              {error && <div className="mt-3"><InlineError message={error} /></div>}
            </motion.div>
          )}

          {/* Member list */}
          <div
            className={cn(
              'bg-[#eef1f6] rounded-3xl p-6',
              'shadow-[8px_8px_20px_rgba(163,177,198,0.5),-8px_-8px_20px_rgba(255,255,255,0.9)]'
            )}
          >
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-500" />
                <h2 className="text-sm font-bold text-[#1a2035]">
                  Members {!isLoading && <span className="text-[#94a3b8] font-semibold">· {members.length}</span>}
                </h2>
              </div>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-10 text-[#94a3b8] text-xs">
                <Loader2 className="w-4 h-4 animate-spin mr-2" /> Loading members…
              </div>
            ) : members.length === 0 ? (
              <p className="text-center text-sm text-[#94a3b8] py-10">No members yet.</p>
            ) : (
              <ul role="list" className="flex flex-col gap-2.5">
                {members.map(m => {
                  const stats = statsByUser.get(m.user_id) ?? { total: 0, done: 0, overdue: 0 }
                  const name = displayNameOf({
                    displayName: m.profile?.display_name,
                    isAnonymous: m.profile?.anonymous,
                    fallback: 'Teammate',
                  })
                  const isMe = m.user_id === user?.id
                  const isSpaceOwner = m.role === 'owner'
                  return (
                    <li
                      key={m.user_id}
                      className={cn(
                        'flex items-center gap-4 px-4 py-3 rounded-2xl',
                        'bg-[#e8ecf2]',
                        'shadow-[inset_2px_2px_5px_rgba(163,177,198,0.45),inset_-2px_-2px_5px_rgba(255,255,255,0.7)]'
                      )}
                    >
                      <NeuAvatar
                        name={name}
                        src={m.profile?.avatar_url ?? undefined}
                        size="md"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-bold text-[#1a2035] truncate">
                            {name}{isMe && <span className="text-[#94a3b8] font-medium"> · you</span>}
                          </p>
                          {isSpaceOwner && (
                            <NeuBadge variant="amber" size="sm">
                              <Crown className="w-3 h-3 mr-0.5" /> Owner
                            </NeuBadge>
                          )}
                        </div>
                        <div className="flex items-center gap-4 mt-1 text-[11px] text-[#64748b]">
                          <span><span className="font-bold text-[#374156]">{stats.total}</span> assigned</span>
                          <span className="text-emerald-600 font-semibold flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> {stats.done} done
                          </span>
                          {stats.overdue > 0 && (
                            <span className="text-rose-500 font-semibold">{stats.overdue} overdue</span>
                          )}
                        </div>
                      </div>

                      {isOwner && !isSpaceOwner && !isMe && (
                        <button
                          onClick={() => {
                            if (confirm(`Remove ${name} from this space?`)) {
                              remove.mutate(m.user_id)
                            }
                          }}
                          className="text-[#94a3b8] hover:text-rose-500 p-1.5 rounded-lg hover:bg-rose-50 transition-colors"
                          aria-label={`Remove ${name}`}
                          title="Remove member"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  )
}
