import type { SiteConfig } from '../schemas/site-config.schema'
import { getStorageBackend } from '../cloud/supabase-client'
import { createFileAdapter } from './file-adapter'
import { createSupabaseStorageAdapter } from './supabase-adapter'

export type { SiteConfig }

export interface StorageAdapter {
  getPublished(slug: string): Promise<SiteConfig | null>
  getDraft(slug: string): Promise<SiteConfig | null>
  saveDraft(slug: string, config: SiteConfig): Promise<void>
  discardDraft(slug: string): Promise<void>
  publish(slug: string): Promise<void>
}

export { createFileAdapter, createSupabaseStorageAdapter }

/** Returns the active StorageAdapter based on STORAGE_BACKEND ('cloud' or 'file'). */
export function getStorageAdapter(): StorageAdapter {
  return getStorageBackend() === 'cloud'
    ? createSupabaseStorageAdapter()
    : createFileAdapter()
}
