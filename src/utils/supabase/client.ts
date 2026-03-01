import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  // Make sure these are defined in your .env.local
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
