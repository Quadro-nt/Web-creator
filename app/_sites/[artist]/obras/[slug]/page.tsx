import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getStorageAdapter } from '@/lib/storage'
import { getWorksRepository } from '@/lib/works/repository'
import { ArtworkDetail } from '@/components/ArtworkDetail'

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'
export const revalidate = 0

type Props = {
  params: { artist: string; slug: string }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const worksRepo = getWorksRepository()
  const work = await worksRepo.getWork(params.artist, params.slug)
  if (!work) {
    return { title: 'Obra no encontrada' }
  }

  const storage = getStorageAdapter()
  const config = await storage.getPublished(params.artist)
  const siteTitle = config?.identity.siteTitle ?? params.artist

  return {
    title: `${siteTitle} — ${work.title}`,
    openGraph: {
      images: [work.images[0]],
    },
  }
}

export default async function ArtworkPage({ params }: Props) {
  const worksRepo = getWorksRepository()
  const work = await worksRepo.getWork(params.artist, params.slug)

  if (!work) {
    notFound()
  }

  return <ArtworkDetail artwork={work} artistSlug={params.artist} />
}
