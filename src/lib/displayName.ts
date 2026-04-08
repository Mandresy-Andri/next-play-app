/**
 * Centralized "what do we call this user?" logic so the board, comments,
 * assignee pickers, and sidebar all agree — and nobody sees "Member".
 *
 * Preference order:
 *   1. explicit display_name
 *   2. local-part of the email (e.g. "jane" from "jane@acme.co")
 *   3. "Guest" for anonymous accounts
 *   4. "You" as a last resort for the current user
 */
export function displayNameOf(params: {
  displayName?: string | null
  email?: string | null
  isAnonymous?: boolean
  fallback?: string
}): string {
  const { displayName, email, isAnonymous, fallback = 'User' } = params
  if (displayName && displayName.trim()) return displayName.trim()
  if (email) {
    const local = email.split('@')[0]
    if (local) return local
  }
  if (isAnonymous) return 'Guest'
  return fallback
}
