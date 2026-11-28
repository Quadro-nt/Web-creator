import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getStorageAdapter } from '@/lib/storage'
import { getWorksRepository } from '@/lib/works/repository'
import { safeJsonLd } from '@/lib/seo/json-ld'
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
  const title = `${siteTitle} — ${work.title}`
  const description = work.description ?? `${work.medium}, ${work.year} · ${work.dimensions}`
  const ogImage = work.images[0] ?? config?.identity.ogImageUrl ?? config?.identity.coverImageUrl

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      ...(ogImage ? { images: [{ url: ogImage }] } : {}),
      type: 'article',
    },
    ...(config?.identity.faviconUrl ? { icons: { icon: config.identity.faviconUrl } } : {}),
  }
}

export default async function ArtworkPage({ params }: Props) {
  const worksRepo = getWorksRepository()
  const allWorks = await worksRepo.getWorks(params.artist)
  const work = allWorks.find((w) => w.slug === params.slug) ?? (await worksRepo.getWork(params.artist, params.slug))

  if (!work) {
    notFound()
  }

  const config = await getStorageAdapter().getPublished(params.artist)

  const artworkJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'VisualArtwork',
    name: work.title,
    artMedium: work.medium,
    dateCreated: String(work.year),
    size: work.dimensions,
    image: work.images,
    ...(work.description ? { description: work.description } : {}),
    creator: {
      '@type': 'Person',
      name: config?.identity.siteTitle ?? params.artist,
    },
    ...(work.price !== undefined
      ? {
          offers: {
            '@type': 'Offer',
            price: work.price,
            priceCurrency: work.currency,
            availability: work.sold
              ? 'https://schema.org/SoldOut'
              : 'https://schema.org/InStock',
          },
        }
      : {}),
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(artworkJsonLd) }}
      />
      <ArtworkDetail
        artwork={work}
        artistSlug={params.artist}
        config={config}
        relatedWorks={allWorks}
      />
    </>
  )
}
