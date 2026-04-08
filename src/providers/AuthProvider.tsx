import React, { useState, useEffect, useCallback, useRef } from 'react'
import type { User } from '@supabase/supabase-js'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import {
  bootstrapGuestSession,
  signInWithPassword as authSignIn,
  signUpWithPassword as authSignUp,
  signOut as authSignOut,
} from '@/lib/auth'
import { AuthContext } from './AuthContext'
import type { AuthStatus } from './AuthContext'

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [status, setStatus] = useState<AuthStatus>('loading')
  const queryClient = useQueryClient()
  // Tracks the last auth user id we've observed so we can detect identity
  // changes (sign-out, account switch, guest-upgrade) and nuke the cached
  // data from the previous user. Without this, react-query happily serves
  // the old user's spaces/tasks to the new session — a severe data-leak bug.
  const lastUserIdRef = useRef<string | null>(null)

  useEffect(() => {
    // Bootstrap: ensure a session exists (anonymous if needed)
    bootstrapGuestSession().then(({ user: bootstrappedUser }) => {
      lastUserIdRef.current = bootstrappedUser?.id ?? null
      setUser(bootstrappedUser)
      setStatus(bootstrappedUser ? 'authenticated' : 'unauthenticated')
    })

    // Subscribe to auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      const nextUser = session?.user ?? null
      const nextId = nextUser?.id ?? null
      const prevId = lastUserIdRef.current

      // Any identity change — sign-in as a different user, sign-out, or
      // initial sign-in — must drop every cached query from the previous
      // identity. USER_UPDATED (e.g. anonymous → permanent upgrade) keeps
      // the same uuid, so we skip clearing there to preserve the user's
      // work across the upgrade.
      const identityChanged = nextId !== prevId
      if (identityChanged) {
        queryClient.cancelQueries()
        queryClient.removeQueries()
      }

      // Sign-out explicitly nukes any lingering mutations too, so a pending
      // optimistic write from the previous session can't land on the new one.
      if (event === 'SIGNED_OUT') {
        queryClient.getMutationCache().clear()
      }

      lastUserIdRef.current = nextId
      setUser(nextUser)
      setStatus(nextUser ? 'authenticated' : 'unauthenticated')
    })

    return () => subscription.unsubscribe()
  }, [queryClient])

  const signInWithPassword = useCallback(async (email: string, password: string) => {
    // Tear down the current session (and its cached data) before switching
    // accounts. Supabase's signInWithPassword replaces the JWT in-place, but
    // without an explicit signOut first we've seen rare races where stale
    // realtime subscriptions / storage-event listeners outlive the switch.
    await authSignOut()
    queryClient.cancelQueries()
    queryClient.removeQueries()
    const { error } = await authSignIn(email, password)
    return { error: error?.message ?? null }
  }, [queryClient])

  const signUpWithPassword = useCallback(async (email: string, password: string) => {
    const { error } = await authSignUp(email, password)
    return { error: error?.message ?? null }
  }, [])

  const signOut = useCallback(async () => {
    await authSignOut()
    // onAuthStateChange('SIGNED_OUT') has already cleared the cache, but we
    // run it again here for safety in case the listener hasn't fired yet
    // before bootstrap kicks off a new anonymous session.
    queryClient.cancelQueries()
    queryClient.removeQueries()
    // After sign-out, bootstrap a fresh guest session
    await bootstrapGuestSession()
  }, [queryClient])

  const isAnonymous = user?.is_anonymous ?? false

  return (
    <AuthContext.Provider value={{ user, status, isAnonymous, signInWithPassword, signUpWithPassword, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}
