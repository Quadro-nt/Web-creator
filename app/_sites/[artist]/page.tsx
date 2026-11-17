import type { Metadata } from 'next'
import { createFileAdapter } from '@/lib/storage'
import { createFileWorksAdapter } from '@/lib/works/file-adapter'
import MinimalGallery from '@/components/templates/minimal-gallery'

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
    return (
      <main style={{ padding: '4rem 2rem', textAlign: 'center' }}>
        <h1>Sitio no encontrado</h1>
      </main>
    )
  }

  if (config.template === 'minimal-gallery') {
    const worksRepo = createFileWorksAdapter()
    const works = await worksRepo.getWorks(params.artist)
    return <MinimalGallery config={config} works={works} artistSlug={params.artist} />
  }

  return (
    <main style={{ padding: '4rem 2rem' }}>
      <div>Template {config.template} - proximamente</div>
    </main>
  )
}
