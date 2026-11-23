import { mkdir, readFile, writeFile } from 'fs/promises'
import path from 'path'
import { WorksFileSchema } from '@/lib/schemas/works.schema'
import type { Artwork } from '@/lib/schemas/works.schema'
import type { WorksRepository } from './repository'
import { isSafeArtistSlug } from '@/lib/auth/verify-api-request'

function artistDir(artistSlug: string): string {
  if (!isSafeArtistSlug(artistSlug)) {
    throw new Error('Slug de artista inválido')
  }
  return path.join(process.cwd(), 'data', 'artists', artistSlug)
}

function worksPath(artistSlug: string): string {
  return path.join(artistDir(artistSlug), 'works.json')
}

async function fetchWorks(artistSlug: string): Promise<Artwork[]> {
  if (!isSafeArtistSlug(artistSlug)) return []
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

    async saveWorks(artistSlug: string, works: Artwork[]): Promise<void> {
      const dir = artistDir(artistSlug)
      const validated = WorksFileSchema.parse({ artistSlug, works })
      await mkdir(dir, { recursive: true })
      await writeFile(worksPath(artistSlug), JSON.stringify(validated, null, 2), 'utf-8')
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
