import type { SiteConfig } from '@/lib/schemas/site-config.schema'
import type { Artwork } from '@/lib/schemas/works.schema'
import InteractiveArtworksGrid from '@/components/templates/shared/InteractiveArtworksGrid'

type SectionConfig = SiteConfig['sections'][number]

type Props = {
  section: SectionConfig
  works: Artwork[]
  artistSlug: string
  config?: SiteConfig
}

export default function ImmersiveArtworks({ section, works, artistSlug, config }: Props) {
  return (
    <InteractiveArtworksGrid
      section={section}
      works={works}
      artistSlug={artistSlug}
      config={config}
      templateVariant="immersive"
    />
  )
}
