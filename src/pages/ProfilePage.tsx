import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, User, Mail, ImageIcon, Check } from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { NeuButton, NeuInput, NeuAvatar, InlineError } from '@/components/ui'
import { useAuth } from '@/providers/useAuth'
import { useMyProfile, useUpdateMyProfile } from '@/hooks/useProfile'
import { displayNameOf } from '@/lib/displayName'
import { cn } from '@/lib/cn'

/**
 * Profile page — edit display name and avatar URL. The display name flows
 * through comments, assignees, and the sidebar, so setting it here immediately
 * removes the generic "Member" fallback from the board.
 */
export default function ProfilePage() {
  const navigate = useNavigate()
  const { user, isAnonymous } = useAuth()
  const { data: profile, isLoading } = useMyProfile()
  const updateProfile = useUpdateMyProfile()

  const [displayName, setDisplayName] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  // Seed fields from loaded profile, falling back to the email prefix
  useEffect(() => {
    if (!profile) return
    setDisplayName(
      profile.display_name ??
        displayNameOf({ email: user?.email, isAnonymous, fallback: '' })
    )
    setAvatarUrl(profile.avatar_url ?? '')
  }, [profile, user?.email, isAnonymous])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSaved(false)
    const name = displayName.trim()
    if (!name) {
      setError('Display name is required')
      return
    }
    try {
      await updateProfile.mutateAsync({
        display_name: name,
        avatar_url: avatarUrl.trim() || null,
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile')
    }
  }

  const previewName = displayName || displayNameOf({ email: user?.email, isAnonymous, fallback: 'You' })

  return (
    <AppShell
      topBarTitle="Profile"
      topBarSubtitle="Account"
      topBarActions={
        <NeuButton
          variant="ghost"
          size="sm"
          leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}
          onClick={() => navigate(-1)}
        >
          Back
        </NeuButton>
      }
    >
      <div className="h-full overflow-y-auto">
        <div className="max-w-xl mx-auto px-6 py-8">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className={cn(
              'bg-[#eef1f6] rounded-3xl p-8',
              'shadow-[12px_12px_24px_rgba(163,177,198,0.5),-12px_-12px_24px_rgba(255,255,255,0.9)]'
            )}
          >
            {/* Preview */}
            <div className="flex items-center gap-4 pb-6 mb-6 border-b border-[#dde2ec]">
              <NeuAvatar
                name={previewName}
                src={avatarUrl || undefined}
                size="lg"
              />
              <div className="min-w-0 flex-1">
                <p className="text-lg font-bold text-[#1a2035] truncate">{previewName}</p>
                <p className="text-xs text-[#94a3b8] truncate flex items-center gap-1.5 mt-0.5">
                  <Mail className="w-3 h-3" />
                  {user?.email ?? (isAnonymous ? 'Anonymous guest' : 'No email')}
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              <NeuInput
                label="Display name"
                value={displayName}
                onChange={e => { setDisplayName(e.target.value); setError(null) }}
                leftIcon={<User className="w-4 h-4" />}
                placeholder="How should we call you?"
                fullWidth
                maxLength={60}
                disabled={isLoading}
              />

              <NeuInput
                label="Avatar URL (optional)"
                value={avatarUrl}
                onChange={e => setAvatarUrl(e.target.value)}
                leftIcon={<ImageIcon className="w-4 h-4" />}
                placeholder="https://…"
                fullWidth
                disabled={isLoading}
              />

              {error && <InlineError message={error} />}

              {saved && (
                <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-medium" role="status">
                  <Check className="w-4 h-4" />
                  Profile saved. Your name will show up across the app.
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <NeuButton
                  type="button"
                  variant="ghost"
                  size="md"
                  onClick={() => navigate(-1)}
                  className="flex-1"
                >
                  Cancel
                </NeuButton>
                <NeuButton
                  type="submit"
                  variant="primary"
                  size="md"
                  isLoading={updateProfile.isPending}
                  disabled={!displayName.trim() || isLoading}
                  className="flex-1"
                >
                  Save profile
                </NeuButton>
              </div>
            </form>

            {isAnonymous && (
              <p className="mt-6 text-xs text-[#94a3b8] text-center">
                You're signed in as a guest. Your profile will carry over when you
                upgrade to an email account — no tasks lost.
              </p>
            )}
          </motion.div>
        </div>
      </div>
    </AppShell>
  )
}
