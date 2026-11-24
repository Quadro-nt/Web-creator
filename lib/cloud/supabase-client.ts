import { createClient, type SupabaseClient } from '@supabase/supabase-js'

let cachedClient: SupabaseClient | null = null

/** Returns the active storage backend ('cloud' only when STORAGE_BACKEND=cloud). */
export function getStorageBackend(): 'file' | 'cloud' {
  return (process.env.STORAGE_BACKEND ?? '').toLowerCase() === 'cloud' ? 'cloud' : 'file'
}

/** Returns the Supabase anon key from public or server environment variables. */
export function getSupabaseAnonKey(): string {
  return process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || ''
}

/** Returns the Supabase Storage bucket name used for artist media. */
export function getSupabaseStorageBucket(): string {
  return process.env.SUPABASE_STORAGE_BUCKET || 'artist-media'
}

/** Creates a non-persisting PKCE Supabase client suitable for server-side Auth flows. */
export function createSupabaseAuthClient(options?: {
  storage?: {
    getItem: (k: string) => string | null
    setItem: (k: string, v: string) => void
    removeItem: (k: string) => void
  }
}): SupabaseClient {
  const url = process.env.SUPABASE_URL
  const key = getSupabaseAnonKey() || process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !key) {
    const missing = [
      !url ? 'SUPABASE_URL' : null,
      !key ? 'NEXT_PUBLIC_SUPABASE_ANON_KEY / SUPABASE_ANON_KEY / SUPABASE_SERVICE_ROLE_KEY' : null,
    ]
      .filter(Boolean)
      .join(', ')
    throw new Error(`Missing required Supabase environment variable(s): ${missing}`)
  }

  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
      flowType: 'pkce',
      ...(options?.storage ? { storage: options.storage } : {}),
    },
  })
}

/** Returns a lazy singleton Supabase admin client using the service role key. */
export function getSupabaseAdminClient(): SupabaseClient {
  if (cachedClient) {
    return cachedClient
  }

  const url = process.env.SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceRoleKey) {
    const missing = [
      !url ? 'SUPABASE_URL' : null,
      !serviceRoleKey ? 'SUPABASE_SERVICE_ROLE_KEY' : null,
    ]
      .filter(Boolean)
      .join(', ')
    throw new Error(`Missing required Supabase environment variable(s): ${missing}`)
  }

  cachedClient = createClient(url, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })

  return cachedClient
}

/** Resets the cached Supabase client instance for unit tests. */
export function resetSupabaseClientForTests(): void {
  cachedClient = null
}
