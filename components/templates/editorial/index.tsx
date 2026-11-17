import type { SiteConfig } from '@/lib/schemas/site-config.schema'
import type { Artwork } from '@/lib/schemas/works.schema'
import Nav from './nav'
import Cover from './sections/cover'
import ArtworksSection from './sections/artworks'
import Bio from './sections/bio'
import Exhibitions from './sections/exhibitions'
import Contact from './sections/contact'

type Props = {
  config: SiteConfig
  works: Artwork[]
  artistSlug: string
}

type SectionConfig = SiteConfig['sections'][number]

export default function EditorialTemplate({ config, works, artistSlug }: Props) {
  const cssVars = [
    `--color-bg: ${config.styleTokens.background || '#f5f0e8'};`,
    `--color-text: ${config.styleTokens.text || '#1a1a1a'};`,
    `--color-accent: ${config.styleTokens.accent || '#c8420a'};`,
  ].join(' ')

  function renderSection(section: SectionConfig) {
    switch (section.type) {
      case 'cover':
        return <Cover key={section.id} section={section} config={config} />
      case 'artworks': {
        const enriched = {
          ...section,
          content: {
            ...section.content,
            columns: section.content.columns ?? config.sizes.columns,
            artworkSize: section.content.artworkSize ?? config.sizes.artworkSize,
          },
        }
        return (
          <div key={section.id} id={section.id}>
            <ArtworksSection section={enriched} works={works} artistSlug={artistSlug} />
          </div>
        )
      }
      case 'bio':
        return (
          <div key={section.id} id={section.id}>
            <Bio section={section} />
          </div>
        )
      case 'exhibitions':
        return (
          <div key={section.id} id={section.id}>
            <Exhibitions section={section} />
          </div>
        )
      case 'contact':
        return (
          <div key={section.id} id={section.id}>
            <Contact section={section} />
          </div>
        )
    }
  }

  return (
    <>
      <style>{`:root { ${cssVars} }`}</style>
      <div
        style={{
          backgroundColor: 'var(--color-bg)',
          color: 'var(--color-text)',
          minHeight: '100vh',
        }}
      >
        <Nav config={config} artistSlug={artistSlug} />
        {config.sections.filter((s) => s.visible).map(renderSection)}
      </div>
    </>
  )
}
