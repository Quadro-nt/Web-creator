import type { Metadata } from 'next'

type Props = {
  params: { artist: string }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return {
    title: params.artist,
  }
}

export default function ArtistSitePage({ params }: Props) {
  return (
    <main>
      <h1>Sitio de {params.artist}</h1>
    </main>
  )
}
