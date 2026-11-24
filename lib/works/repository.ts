import type { Artwork } from '@/lib/schemas/works.schema'
import { getStorageBackend } from '@/lib/cloud/supabase-client'
import { createFileWorksAdapter } from './file-adapter'
import { createSupabaseWorksAdapter } from './supabase-adapter'

export interface WorksRepository {
  getWorks(artistSlug: string): Promise<Artwork[]>
  getWork(artistSlug: string, workSlug: string): Promise<Artwork | null>
  saveWorks(artistSlug: string, works: Artwork[]): Promise<void>
}

export { createFileWorksAdapter, createSupabaseWorksAdapter }

/** Returns the active WorksRepository based on STORAGE_BACKEND ('cloud' or 'file'). */
export function getWorksRepository(): WorksRepository {
  return getStorageBackend() === 'cloud'
    ? createSupabaseWorksAdapter()
    : createFileWorksAdapter()
}
