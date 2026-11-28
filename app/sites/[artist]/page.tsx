import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getStorageAdapter } from '@/lib/storage'
import { getWorksRepository } from '@/lib/works/repository'
import type { PageConfig, SiteConfig } from '@/lib/schemas/site-config.schema'
import { safeJsonLd } from '@/lib/seo/json-ld'
import { sanitizeSocialHandle } from '@/components/templates/shared/template-helpers'
import MinimalGallery from '@/components/templates/minimal-gallery'
import EditorialTemplate from '@/components/templates/editorial'
import ImmersiveTemplate from '@/components/templates/immersive'

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'
export const revalidate = 0

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

function resolveSiteDescription(config: SiteConfig | null | undefined, home: PageConfig | undefined): string | undefined {
  if (home?.seo?.description?.trim()) return home.seo.description.trim()
  const bioSection = home?.sections?.find((s) => s.type === 'bio')
  const bioText = typeof bioSection?.content.text === 'string' ? bioSection.content.text.trim() : ''
  if (bioText) return bioText.slice(0, 180)
  const coverSection = home?.sections?.find((s) => s.type === 'cover')
  const subtitle = typeof coverSection?.content.subtitle === 'string' ? coverSection.content.subtitle.trim() : ''
  return subtitle || undefined
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const config = await safeGetPublished(params.artist)
  const home = config?.pages?.find((p) => p.isHome)
  const title = home?.seo?.title ?? config?.identity.siteTitle ?? params.artist
  const description = resolveSiteDescription(config, home)
  const ogImage = home?.seo?.ogImageUrl ?? config?.identity.ogImageUrl ?? config?.identity.coverImageUrl

  return {
    title,
    ...(description ? { description } : {}),
    openGraph: {
      title,
      ...(description ? { description } : {}),
      ...(ogImage ? { images: [{ url: ogImage }] } : {}),
      type: 'website',
    },
    ...(config?.identity.faviconUrl ? { icons: { icon: config.identity.faviconUrl } } : {}),
  }
}

export default async function ArtistSitePage({ params }: Props) {
  const config = await safeGetPublished(params.artist)

  if (!config) {
    notFound()
  }

  const home = config.pages?.find((p) => p.isHome)
  if (!home) notFound()

  const works = await safeGetWorks(params.artist)
  const description = resolveSiteDescription(config, home)
  const coverSection = home.sections.find((s) => s.type === 'cover')
  const coverTitle = typeof coverSection?.content.title === 'string' ? coverSection.content.title.trim() : ''
  const personName = coverTitle || config.identity.siteTitle
  const personImage = home.seo?.ogImageUrl ?? config.identity.ogImageUrl ?? config.identity.coverImageUrl
  const contactSection = home.sections.find((s) => s.type === 'contact')
  const instagramHandle = sanitizeSocialHandle(
    config.header?.instagramHandle ?? config.footer?.instagram ?? contactSection?.content.instagram
  )

  const personJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: personName,
    ...(description ? { description } : {}),
    ...(personImage ? { image: personImage } : {}),
    ...(instagramHandle ? { sameAs: [`https://instagram.com/${instagramHandle}`] } : {}),
  }

  let templateView: React.ReactNode
  if (config.template === 'minimal-gallery') {
    templateView = <MinimalGallery config={config} page={home} works={works} artistSlug={params.artist} />
  } else if (config.template === 'editorial') {
    templateView = <EditorialTemplate config={config} page={home} works={works} artistSlug={params.artist} />
  } else if (config.template === 'immersive') {
    templateView = <ImmersiveTemplate config={config} page={home} works={works} artistSlug={params.artist} />
  } else {
    templateView = (
      <main style={{ padding: '2rem' }}>
        <h1>Sitio en construcción</h1>
      </main>
    )
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(personJsonLd) }}
      />
      {templateView}
    </>
  )
}
