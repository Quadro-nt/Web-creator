export type SiteConfig = Record<string, unknown>

export interface StorageAdapter {
  getPublished(slug: string): Promise<SiteConfig | null>
  getDraft(slug: string): Promise<SiteConfig | null>
  saveDraft(slug: string, config: SiteConfig): Promise<void>
  publish(slug: string): Promise<void>
}

export { createFileAdapter } from './file-adapter'
