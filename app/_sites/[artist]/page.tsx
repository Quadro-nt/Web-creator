import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getStorageAdapter } from '@/lib/storage'
import { getWorksRepository } from '@/lib/works/repository'
import MinimalGallery from '@/components/templates/minimal-gallery'
import EditorialTemplate from '@/components/templates/editorial'
import ImmersiveTemplate from '@/components/templates/immersive'

export const dynamic = 'force-dynamic'

type Props = {
  params: { artist: string }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const storage = getStorageAdapter()
  const config = await storage.getPublished(params.artist)
  const home = config?.pages?.find((p) => p.isHome)
  return {
    title: home?.seo?.title ?? config?.identity.siteTitle ?? params.artist,
    description: home?.seo?.description,
  }
}

export default async function ArtistSitePage({ params }: Props) {
  const storage = getStorageAdapter()
  const config = await storage.getPublished(params.artist)

  if (!config) {
    notFound()
  }

  const home = config.pages?.find((p) => p.isHome)
  if (!home) notFound()

  const worksRepo = getWorksRepository()
  const works = await worksRepo.getWorks(params.artist)

  if (config.template === 'minimal-gallery') {
    return <MinimalGallery config={config} page={home} works={works} artistSlug={params.artist} />
  }

  if (config.template === 'editorial') {
    return <EditorialTemplate config={config} page={home} works={works} artistSlug={params.artist} />
  }

  if (config.template === 'immersive') {
    return <ImmersiveTemplate config={config} page={home} works={works} artistSlug={params.artist} />
  }

  return (
    <main style={{ padding: '2rem' }}>
      <h1>Sitio en construccion</h1>
    </main>
  )
}
