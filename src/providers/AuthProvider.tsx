import React, { useState, useEffect, useCallback } from 'react'
import type { User } from '@supabase/supabase-js'
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

  useEffect(() => {
    // Bootstrap: ensure a session exists (anonymous if needed)
    bootstrapGuestSession().then(({ user: bootstrappedUser }) => {
      setUser(bootstrappedUser)
      setStatus(bootstrappedUser ? 'authenticated' : 'unauthenticated')
    })

    // Subscribe to auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      setStatus(session?.user ? 'authenticated' : 'unauthenticated')
    })

    return () => subscription.unsubscribe()
  }, [])

  const signInWithPassword = useCallback(async (email: string, password: string) => {
    const { error } = await authSignIn(email, password)
    return { error: error?.message ?? null }
  }, [])

  const signUpWithPassword = useCallback(async (email: string, password: string) => {
    const { error } = await authSignUp(email, password)
    return { error: error?.message ?? null }
  }, [])

  const signOut = useCallback(async () => {
    await authSignOut()
    // After sign-out, bootstrap a fresh guest session
    await bootstrapGuestSession()
  }, [])

  const isAnonymous = user?.is_anonymous ?? false

  return (
    <AuthContext.Provider value={{ user, status, isAnonymous, signInWithPassword, signUpWithPassword, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}
