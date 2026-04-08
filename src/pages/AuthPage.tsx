import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Mail, Lock, Zap, ArrowRight } from 'lucide-react'
import { NeuButton, NeuInput, InlineError } from '@/components/ui'
import { useAuth } from '@/providers/useAuth'
import { cn } from '@/lib/cn'

type AuthMode = 'signin' | 'signup'

/**
 * AuthPage — sign in or upgrade a guest account.
 * The neumorphic form is the hero element. No distracting backgrounds.
 */
export default function AuthPage() {
  const { signInWithPassword, signUpWithPassword, isAnonymous, status } = useAuth()
  const navigate = useNavigate()

  const [mode, setMode] = useState<AuthMode>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccessMsg(null)
    setIsLoading(true)

    const fn = mode === 'signin' ? signInWithPassword : signUpWithPassword
    const { error: authError } = await fn(email, password)

    setIsLoading(false)

    if (authError) {
      setError(authError)
      return
    }

    if (mode === 'signup' && isAnonymous) {
      setSuccessMsg('Account upgraded! Your tasks are preserved.')
      setTimeout(() => navigate('/'), 1500)
    } else {
      navigate('/')
    }
  }

  const headingText = isAnonymous
    ? mode === 'signup'
      ? 'Save your work'
      : 'Welcome back'
    : mode === 'signup'
      ? 'Create account'
      : 'Sign in'

  const subText = isAnonymous && mode === 'signup'
    ? 'Link an email to your guest account — your tasks and spaces are preserved.'
    : isAnonymous && mode === 'signin'
      ? 'Sign in to an existing account. Your current guest data will be replaced.'
      : mode === 'signup'
        ? 'Start organizing your work with Next Play.'
        : 'Welcome back to Next Play.'

  return (
    <div className="min-h-screen bg-[#eef1f6] flex items-center justify-center p-4">
      {/* Soft decorative blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-blue-100/40 blur-3xl" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-blue-50/60 blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="relative w-full max-w-md"
      >
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-2xl bg-blue-500 flex items-center justify-center shadow-[4px_4px_8px_rgba(37,99,235,0.4),-3px_-3px_6px_rgba(255,255,255,0.6)]">
            <Zap className="w-5 h-5 text-white" aria-hidden="true" />
          </div>
          <span className="text-2xl font-bold text-[#1a2035] tracking-tight">Next Play</span>
        </div>

        {/* Card */}
        <div
          className={cn(
            'bg-[#eef1f6] rounded-3xl p-8',
            'shadow-[12px_12px_24px_rgba(163,177,198,0.55),-12px_-12px_24px_rgba(255,255,255,0.9)]'
          )}
        >
          <div className="mb-7">
            <h1 className="text-2xl font-bold text-[#1a2035] mb-1">{headingText}</h1>
            <p className="text-sm text-[#64748b] leading-relaxed">{subText}</p>
          </div>

          {/* Tab switcher */}
          <div
            className={cn(
              'flex p-1 mb-6 rounded-xl',
              'bg-[#e6e9f0]',
              'shadow-[inset_3px_3px_6px_rgba(163,177,198,0.5),inset_-3px_-3px_6px_rgba(255,255,255,0.7)]'
            )}
            role="tablist"
            aria-label="Authentication mode"
          >
            {(['signin', 'signup'] as AuthMode[]).map(m => (
              <button
                key={m}
                role="tab"
                aria-selected={mode === m}
                onClick={() => { setMode(m); setError(null) }}
                className={cn(
                  'flex-1 py-2 text-sm font-semibold rounded-lg transition-all duration-200',
                  mode === m
                    ? 'bg-[#eef1f6] text-[#1a2035] shadow-[3px_3px_6px_rgba(163,177,198,0.5),-3px_-3px_6px_rgba(255,255,255,0.8)]'
                    : 'text-[#64748b] hover:text-[#374156]'
                )}
              >
                {m === 'signin' ? 'Sign in' : 'Sign up'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
            <NeuInput
              label="Email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              leftIcon={<Mail className="w-4 h-4" />}
              required
              fullWidth
            />
            <NeuInput
              label="Password"
              type="password"
              autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              leftIcon={<Lock className="w-4 h-4" />}
              required
              fullWidth
            />

            {error && <InlineError message={error} />}

            {successMsg && (
              <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-medium" role="status">
                {successMsg}
              </div>
            )}

            <NeuButton
              type="submit"
              variant="primary"
              size="lg"
              isLoading={isLoading || status === 'loading'}
              rightIcon={<ArrowRight className="w-4 h-4" />}
              className="w-full mt-2"
            >
              {mode === 'signin' ? 'Sign in' : 'Create account'}
            </NeuButton>
          </form>

          {isAnonymous && (
            <p className="mt-5 text-center text-xs text-[#94a3b8]">
              Already using Next Play as a guest?{' '}
              <button
                onClick={() => navigate('/')}
                className="text-blue-500 font-semibold hover:text-blue-600 underline-offset-2 hover:underline"
              >
                Continue as guest
              </button>
            </p>
          )}
        </div>
      </motion.div>
    </div>
  )
}
