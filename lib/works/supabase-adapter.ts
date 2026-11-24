import type { SupabaseClient } from '@supabase/supabase-js'
import { isSafeArtistSlug } from '@/lib/auth/verify-api-request'
import { getSupabaseAdminClient } from '@/lib/cloud/supabase-client'
import { WorksFileSchema, type Artwork } from '@/lib/schemas/works.schema'
import type { WorksRepository } from './repository'

function resolveClient(client?: SupabaseClient): SupabaseClient {
  return client ?? getSupabaseAdminClient()
}

/** Creates a WorksRepository backed by the Supabase `works` table. */
export function createSupabaseWorksAdapter(client?: SupabaseClient): WorksRepository {
  async function getWorks(artistSlug: string): Promise<Artwork[]> {
    if (!isSafeArtistSlug(artistSlug)) return []

    const db = resolveClient(client)
    const { data, error } = await db
      .from('works')
      .select('items')
      .eq('artist_slug', artistSlug)
      .maybeSingle()

    if (error) {
      throw new Error(`Error reading works for artist "${artistSlug}": ${error.message}`)
    }

    if (!data) return []

    const row = data as { items: unknown }
    const parsed = WorksFileSchema.parse({ artistSlug, works: row.items })
    return parsed.works
  }

  return {
    getWorks,

    async getWork(artistSlug: string, workSlug: string): Promise<Artwork | null> {
      const works = await getWorks(artistSlug)
      return works.find((work) => work.slug === workSlug) ?? null
    },

    async saveWorks(artistSlug: string, works: Artwork[]): Promise<void> {
      if (!isSafeArtistSlug(artistSlug)) {
        throw new Error('Slug de artista inválido')
      }

      const validated = WorksFileSchema.parse({ artistSlug, works })
      const db = resolveClient(client)
      const { error } = await db.from('works').upsert(
        {
          artist_slug: artistSlug,
          items: validated.works,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'artist_slug' },
      )

      if (error) {
        throw new Error(`Error saving works for artist "${artistSlug}": ${error.message}`)
      }
    },
  }
}
