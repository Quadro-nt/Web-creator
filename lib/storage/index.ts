import type { SiteConfig } from '../schemas/site-config.schema'

export type { SiteConfig }

export interface StorageAdapter {
  getPublished(slug: string): Promise<SiteConfig | null>
  getDraft(slug: string): Promise<SiteConfig | null>
  saveDraft(slug: string, config: SiteConfig): Promise<void>
  discardDraft(slug: string): Promise<void>
  publish(slug: string): Promise<void>
}

export { createFileAdapter } from './file-adapter'
