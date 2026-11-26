import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getStorageAdapter } from '@/lib/storage'
import { getWorksRepository } from '@/lib/works/repository'
import MinimalGallery from '@/components/templates/minimal-gallery'
import EditorialTemplate from '@/components/templates/editorial'
import ImmersiveTemplate from '@/components/templates/immersive'

type Props = {
  params: { artist: string }
}

async function safeGetPublished(slug: string) {
  try {
    const storage = getStorageAdapter()
    return await storage.getPublished(slug)
  } catch (err) {
    console.error(`[sites/${slug}] getPublished failed:`, err)
    return null
  }
}

async function safeGetWorks(slug: string) {
  try {
    const worksRepo = getWorksRepository()
    return await worksRepo.getWorks(slug)
  } catch (err) {
    console.error(`[sites/${slug}] getWorks failed:`, err)
    return []
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const config = await safeGetPublished(params.artist)
  return {
    title: config?.identity.siteTitle ?? params.artist,
  }
}

export default async function ArtistSitePage({ params }: Props) {
  const config = await safeGetPublished(params.artist)

  if (!config) {
    notFound()
  }

  const works = await safeGetWorks(params.artist)

  if (config.template === 'minimal-gallery') {
    return <MinimalGallery config={config} works={works} artistSlug={params.artist} />
  }

  if (config.template === 'editorial') {
    return <EditorialTemplate config={config} works={works} artistSlug={params.artist} />
  }

  if (config.template === 'immersive') {
    return <ImmersiveTemplate config={config} works={works} artistSlug={params.artist} />
  }

  return (
    <main style={{ padding: '2rem' }}>
      <h1>Sitio en construccion</h1>
    </main>
  )
}
