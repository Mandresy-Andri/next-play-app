import { createClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

if (!supabaseUrl || supabaseUrl === 'https://zgrxevscvjyblzfddsbb.supabase.co') {
  // URL is pre-filled in .env.example — it's the real project URL, not a secret.
}

if (!supabaseAnonKey || supabaseAnonKey === 'your-anon-key-here') {
  console.warn(
    '[Next Play] VITE_SUPABASE_ANON_KEY is not set.\n' +
    'Copy .env.example → .env.local and fill in your Supabase anon key.\n' +
    'Find it in: Supabase dashboard → Project Settings → API → anon public.'
  )
}

/**
 * Typed Supabase client. Uses the anon key only — never the service role key.
 * The Database generic will be filled in by the backend agent's generated types.
 */
export const supabase = createClient<Database>(
  supabaseUrl ?? 'https://placeholder.supabase.co',
  supabaseAnonKey ?? 'placeholder-anon-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  }
)
