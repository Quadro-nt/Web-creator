import type { Artwork } from '@/lib/schemas/works.schema'

export interface WorksRepository {
  getWorks(artistSlug: string): Promise<Artwork[]>
  getWork(artistSlug: string, workSlug: string): Promise<Artwork | null>
}
