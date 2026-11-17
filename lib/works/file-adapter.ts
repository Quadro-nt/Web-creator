import { readFile } from 'fs/promises'
import path from 'path'
import { WorksFileSchema } from '@/lib/schemas/works.schema'
import type { Artwork } from '@/lib/schemas/works.schema'
import type { WorksRepository } from './repository'

function worksPath(artistSlug: string): string {
  return path.join(process.cwd(), 'data', 'artists', artistSlug, 'works.json')
}

async function fetchWorks(artistSlug: string): Promise<Artwork[]> {
  try {
    const content = await readFile(worksPath(artistSlug), 'utf-8')
    const parsed = WorksFileSchema.parse(JSON.parse(content))
    return parsed.works
  } catch (err) {
    if (isFileNotFound(err)) return []
    throw err
  }
}

export function createFileWorksAdapter(): WorksRepository {
  return {
    getWorks: fetchWorks,

    async getWork(artistSlug: string, workSlug: string): Promise<Artwork | null> {
      const works = await fetchWorks(artistSlug)
      return works.find((w) => w.slug === workSlug) ?? null
    },
  }
}

function isFileNotFound(err: unknown): boolean {
  return (
    typeof err === 'object' &&
    err !== null &&
    'code' in err &&
    (err as NodeJS.ErrnoException).code === 'ENOENT'
  )
}
