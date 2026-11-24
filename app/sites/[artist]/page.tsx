import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { createFileAdapter } from '@/lib/storage'
import { createFileWorksAdapter } from '@/lib/works/file-adapter'
import MinimalGallery from '@/components/templates/minimal-gallery'
import EditorialTemplate from '@/components/templates/editorial'
import ImmersiveTemplate from '@/components/templates/immersive'

type Props = {
  params: { artist: string }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const storage = createFileAdapter()
  const config = await storage.getPublished(params.artist)
  return {
    title: config?.identity.siteTitle ?? params.artist,
  }
}

export default async function ArtistSitePage({ params }: Props) {
  const storage = createFileAdapter()
  const config = await storage.getPublished(params.artist)

  if (!config) {
    notFound()
  }

  if (config.template === 'minimal-gallery') {
    const worksRepo = createFileWorksAdapter()
    const works = await worksRepo.getWorks(params.artist)
    return <MinimalGallery config={config} works={works} artistSlug={params.artist} />
  }

  if (config.template === 'editorial') {
    const worksRepo = createFileWorksAdapter()
    const works = await worksRepo.getWorks(params.artist)
    return <EditorialTemplate config={config} works={works} artistSlug={params.artist} />
  }

  if (config.template === 'immersive') {
    const worksRepo = createFileWorksAdapter()
    const works = await worksRepo.getWorks(params.artist)
    return <ImmersiveTemplate config={config} works={works} artistSlug={params.artist} />
  }

  return (
    <main style={{ padding: '2rem' }}>
      <h1>Sitio en construccion</h1>
    </main>
  )
}
