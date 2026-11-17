import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { createFileAdapter } from '@/lib/storage'
import { createFileWorksAdapter } from '@/lib/works/file-adapter'
import { ArtworkDetail } from '@/components/ArtworkDetail'

type Props = {
  params: { artist: string; slug: string }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const worksRepo = createFileWorksAdapter()
  const work = await worksRepo.getWork(params.artist, params.slug)
  if (!work) {
    return { title: 'Obra no encontrada' }
  }

  const storage = createFileAdapter()
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
  const worksRepo = createFileWorksAdapter()
  const work = await worksRepo.getWork(params.artist, params.slug)

  if (!work) {
    notFound()
  }

  return <ArtworkDetail artwork={work} artistSlug={params.artist} />
}
