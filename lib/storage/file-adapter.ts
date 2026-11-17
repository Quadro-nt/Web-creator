import { readFile, writeFile, copyFile, mkdir } from 'fs/promises'
import path from 'path'
import type { StorageAdapter, SiteConfig } from './index'

function artistDir(slug: string): string {
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
    return JSON.parse(content) as SiteConfig
  } catch {
    return null
  }
}

export function createFileAdapter(): StorageAdapter {
  return {
    async getPublished(slug: string): Promise<SiteConfig | null> {
      return readJsonFile(publishedPath(slug))
    },

    async getDraft(slug: string): Promise<SiteConfig | null> {
      return readJsonFile(draftPath(slug))
    },

    async saveDraft(slug: string, config: SiteConfig): Promise<void> {
      const dir = artistDir(slug)
      await mkdir(dir, { recursive: true })
      await writeFile(draftPath(slug), JSON.stringify(config, null, 2), 'utf-8')
    },

    async publish(slug: string): Promise<void> {
      await copyFile(draftPath(slug), publishedPath(slug))
    },
  }
}
