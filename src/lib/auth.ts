import { supabase } from './supabase'
import type { AuthError, User } from '@supabase/supabase-js'

export interface AuthResult {
  user: User | null
  error: AuthError | null
}

/**
 * Signs in anonymously if no session exists. This creates a guest user row
 * with `is_anonymous = true`. Called once on app mount.
 */
export async function bootstrapGuestSession(): Promise<AuthResult> {
  const { data: sessionData } = await supabase.auth.getSession()

  if (sessionData.session?.user) {
    return { user: sessionData.session.user, error: null }
  }

  const { data, error } = await supabase.auth.signInAnonymously()
  return { user: data.user ?? null, error }
}

/**
 * Sign in with email + password.
 * If the current user is anonymous, links the email identity to the existing
 * anonymous account (upgrades it) rather than creating a new user row.
 */
export async function signInWithPassword(
  email: string,
  password: string
): Promise<AuthResult> {
  const { data: sessionData } = await supabase.auth.getSession()
  const currentUser = sessionData.session?.user

  // If current user is anonymous, upgrade by linking identity
  if (currentUser?.is_anonymous) {
    const { error } = await supabase.auth.updateUser({
      email,
      password,
    })
    if (error) return { user: null, error }

    // Re-sign-in with the new credentials to get a proper session
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    return { user: signInData.user ?? null, error: signInError }
  }

  // Normal sign-in
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  return { user: data.user ?? null, error }
}

/**
 * Create a new account with email + password.
 * If the current user is anonymous, upgrades the existing account instead.
 */
export async function signUpWithPassword(
  email: string,
  password: string
): Promise<AuthResult> {
  const { data: sessionData } = await supabase.auth.getSession()
  const currentUser = sessionData.session?.user

  if (currentUser?.is_anonymous) {
    // Upgrade: link email identity to anonymous account
    const { data, error } = await supabase.auth.updateUser({ email, password })
    return { user: data.user ?? null, error }
  }

  const { data, error } = await supabase.auth.signUp({ email, password })
  return { user: data.user ?? null, error }
}

/**
 * Signs out the current user and clears the local session.
 */
export async function signOut(): Promise<{ error: AuthError | null }> {
  return supabase.auth.signOut()
}
