import { readFile, writeFile, copyFile, mkdir, unlink } from 'fs/promises'
import path from 'path'
import type { StorageAdapter, SiteConfig } from './index'
import { isSafeArtistSlug } from '@/lib/auth/verify-api-request'
import { normalizeSiteConfig } from '@/lib/schemas/site-config.schema'

function artistDir(slug: string): string {
  if (!isSafeArtistSlug(slug)) {
    throw new Error('Slug de artista inválido')
  }
  return path.join(process.cwd(), 'data', 'artists', slug)
}

function publishedPath(slug: string): string {
  return path.join(artistDir(slug), 'config.published.json')
}

function draftPath(slug: string): string {
  return path.join(artistDir(slug), 'config.draft.json')
}

async function readJsonFile(filePath: string): Promise<SiteConfig | null> {
  try {
    const content = await readFile(filePath, 'utf-8')
    const parsed = JSON.parse(content)
    return normalizeSiteConfig(parsed) as SiteConfig
  } catch {
    return null
  }
}

function isNotFound(err: unknown): boolean {
  return (
    typeof err === 'object' &&
    err !== null &&
    'code' in err &&
    (err as NodeJS.ErrnoException).code === 'ENOENT'
  )
}

export function createFileAdapter(): StorageAdapter {
  return {
    async getPublished(slug: string): Promise<SiteConfig | null> {
      if (!isSafeArtistSlug(slug)) return null
      return readJsonFile(publishedPath(slug))
    },

    async getDraft(slug: string): Promise<SiteConfig | null> {
      if (!isSafeArtistSlug(slug)) return null
      return readJsonFile(draftPath(slug))
    },

    async saveDraft(slug: string, config: SiteConfig): Promise<void> {
      const dir = artistDir(slug)
      await mkdir(dir, { recursive: true })
      await writeFile(draftPath(slug), JSON.stringify(config, null, 2), 'utf-8')
    },

    async discardDraft(slug: string): Promise<void> {
      try {
        await unlink(draftPath(slug))
      } catch (err) {
        if (!isNotFound(err)) throw err
      }
    },

    async publish(slug: string): Promise<void> {
      await copyFile(draftPath(slug), publishedPath(slug))
    },
  }
}
