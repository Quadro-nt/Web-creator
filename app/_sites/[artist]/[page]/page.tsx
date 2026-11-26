import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getStorageAdapter } from '@/lib/storage'
import { getWorksRepository } from '@/lib/works/repository'
import MinimalGallery from '@/components/templates/minimal-gallery'
import EditorialTemplate from '@/components/templates/editorial'
import ImmersiveTemplate from '@/components/templates/immersive'

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'
export const revalidate = 0

type Props = { params: { artist: string; page: string } }

async function safeGetPublished(slug: string) {
  try {
    return await getStorageAdapter().getPublished(slug)
  } catch (err) {
    console.error(`[_sites/${slug}/page] getPublished failed:`, err)
    return null
  }
}

async function safeGetWorks(slug: string) {
  try {
    return await getWorksRepository().getWorks(slug)
  } catch (err) {
    console.error(`[_sites/${slug}/page] getWorks failed:`, err)
    return []
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const config = await safeGetPublished(params.artist)
  const page = config?.pages?.find((p) => p.slug === params.page && !p.isHome)
  return {
    title:
      page?.seo?.title ?? page?.title ?? config?.identity.siteTitle ?? params.artist,
    description: page?.seo?.description,
  }
}

export default async function ArtistSubPage({ params }: Props) {
  const config = await safeGetPublished(params.artist)
  if (!config) notFound()

  const page = config.pages?.find((p) => p.slug === params.page && !p.isHome)
  if (!page) notFound()

  const works = await safeGetWorks(params.artist)

  if (config.template === 'minimal-gallery') {
    return <MinimalGallery config={config} page={page} works={works} artistSlug={params.artist} />
  }
  if (config.template === 'editorial') {
    return <EditorialTemplate config={config} page={page} works={works} artistSlug={params.artist} />
  }
  if (config.template === 'immersive') {
    return <ImmersiveTemplate config={config} page={page} works={works} artistSlug={params.artist} />
  }

  return <main style={{ padding: '2rem' }}><h1>Sitio en construccion</h1></main>
}
