import type { SupabaseClient } from '@supabase/supabase-js'
import { isSafeArtistSlug } from '@/lib/auth/verify-api-request'
import { getSupabaseAdminClient } from '@/lib/cloud/supabase-client'
import { normalizeSiteConfig } from '@/lib/schemas/site-config.schema'
import type { SiteConfig, StorageAdapter } from './index'

type ConfigColumn = 'config_published' | 'config_draft'

function resolveClient(client?: SupabaseClient): SupabaseClient {
  return client ?? getSupabaseAdminClient()
}

function assertSafeSlug(slug: string): void {
  if (!isSafeArtistSlug(slug)) {
    throw new Error('Slug de artista inválido')
  }
}

async function readConfigColumn(
  db: SupabaseClient,
  slug: string,
  column: ConfigColumn,
): Promise<SiteConfig | null> {
  const { data, error } = await db
    .from('artists')
    .select(column)
    .eq('slug', slug)
    .maybeSingle()

  if (error) {
    throw new Error(`Error reading ${column} for artist "${slug}": ${error.message}`)
  }

  const row = data as Record<string, unknown> | null
  const raw = row?.[column] as SiteConfig | null | undefined
  if (!raw) return null
  return normalizeSiteConfig(raw) as SiteConfig
}

async function updateArtistRow(
  db: SupabaseClient,
  slug: string,
  payload: Record<string, unknown>,
  actionLabel: string,
): Promise<void> {
  const { error } = await db
    .from('artists')
    .update({
      ...payload,
      updated_at: new Date().toISOString(),
    })
    .eq('slug', slug)

  if (error) {
    throw new Error(`Error ${actionLabel} for artist "${slug}": ${error.message}`)
  }
}

/** Creates a StorageAdapter backed by the Supabase `artists` table. */
export function createSupabaseStorageAdapter(client?: SupabaseClient): StorageAdapter {
  return {
    async getPublished(slug: string): Promise<SiteConfig | null> {
      if (!isSafeArtistSlug(slug)) return null
      return readConfigColumn(resolveClient(client), slug, 'config_published')
    },

    async getDraft(slug: string): Promise<SiteConfig | null> {
      if (!isSafeArtistSlug(slug)) return null
      return readConfigColumn(resolveClient(client), slug, 'config_draft')
    },

    async saveDraft(slug: string, config: SiteConfig): Promise<void> {
      assertSafeSlug(slug)
      await updateArtistRow(
        resolveClient(client),
        slug,
        { config_draft: config },
        'saving draft',
      )
    },

    async discardDraft(slug: string): Promise<void> {
      assertSafeSlug(slug)
      await updateArtistRow(
        resolveClient(client),
        slug,
        { config_draft: null },
        'discarding draft',
      )
    },

    async publish(slug: string): Promise<void> {
      assertSafeSlug(slug)
      const db = resolveClient(client)
      const draft = await readConfigColumn(db, slug, 'config_draft')
      if (!draft) {
        throw new Error('No hay borrador para publicar')
      }
      await updateArtistRow(
        db,
        slug,
        { config_published: draft, config_draft: null },
        'publishing site',
      )
    },
  }
}
