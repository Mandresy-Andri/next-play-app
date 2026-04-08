import { supabase } from './supabase'
import type { AuthError, User } from '@supabase/supabase-js'

export interface AuthResult {
  user: User | null
  error: AuthError | null
}

/**
 * Signs in anonymously if no session exists. This creates a guest user row
 * with `is_anonymous = true`. Called once on app mount.
 *
 * If the project has anonymous sign-ins disabled, GoTrue returns a clear
 * error ("Anonymous sign-ins are disabled"). We log it loudly and return
 * it so callers can route the user to the auth page instead of silently
 * leaving them in a broken unauthenticated state.
 */
export async function bootstrapGuestSession(): Promise<AuthResult> {
  const { data: sessionData } = await supabase.auth.getSession()

  if (sessionData.session?.user) {
    return { user: sessionData.session.user, error: null }
  }

  const { data, error } = await supabase.auth.signInAnonymously()
  if (error) {
    // eslint-disable-next-line no-console
    console.error(
      '[Next Play] Anonymous sign-in failed:', error.message,
      '\n→ Enable it in Supabase dashboard → Authentication → Providers → Anonymous Sign-Ins.'
    )
  }
  return { user: data.user ?? null, error }
}

/**
 * Sign in with email + password.
 *
 * We deliberately do NOT attempt to "link" the email to the current session
 * here, even if the user is anonymous. Every visitor starts with a bootstrap
 * anonymous session, so treating sign-in as a link would call updateUser()
 * and Supabase would reject it with "user already registered" for any email
 * that legitimately has an existing account.
 *
 * Linking/upgrading an anonymous account is what Sign Up is for — see
 * signUpWithPassword. Plain sign-in just replaces the current session with
 * the target account's session.
 */
export async function signInWithPassword(
  email: string,
  password: string
): Promise<AuthResult> {
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
