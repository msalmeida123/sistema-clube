import { createClient as createSupabaseClient, SupabaseClient } from '@supabase/supabase-js'
import { BrowserCookieAuthStorageAdapter } from '@supabase/auth-helpers-shared'
import { sessionLock } from './session-lock'

let browserClient: SupabaseClient | undefined

export function createClientComponentClient<Database = any>(): SupabaseClient<Database> {
  const browser = typeof window !== 'undefined'
  if (browser && browserClient) return browserClient as SupabaseClient<Database>
  const client = createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
      auth: {
        flowType: 'pkce', persistSession: true, autoRefreshToken: browser,
        detectSessionInUrl: browser, storage: new BrowserCookieAuthStorageAdapter(),
        ...(browser ? { lock: sessionLock } : {})
      }
    }
  )
  if (browser) browserClient = client as SupabaseClient
  return client
}
export const createClient = createClientComponentClient
