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

export default function ImmersiveTemplate({ config, works, artistSlug }: Props) {
  const cssVars = [
    `--color-bg: ${config.styleTokens.background || '#0a0a0a'};`,
    `--color-text: ${config.styleTokens.text || '#f0f0f0'};`,
    `--color-accent: ${config.styleTokens.accent || '#e8c547'};`,
  ].join(' ')

  const visibleSections = config.sections.filter((s) => s.visible)

  function renderSection(section: SectionConfig) {
    switch (section.type) {
      case 'cover':
        return (
          <section
            key={section.id}
            id={section.id}
            style={{ height: '100vh', scrollSnapAlign: 'start', flexShrink: 0 }}
          >
            <Cover section={section} config={config} />
          </section>
        )
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
          <section
            key={section.id}
            id={section.id}
            style={{ minHeight: '100vh', scrollSnapAlign: 'start', flexShrink: 0 }}
          >
            <ArtworksSection section={enriched} works={works} artistSlug={artistSlug} />
          </section>
        )
      }
      case 'bio':
        return (
          <section
            key={section.id}
            id={section.id}
            style={{ minHeight: '100vh', scrollSnapAlign: 'start', flexShrink: 0 }}
          >
            <Bio section={section} />
          </section>
        )
      case 'exhibitions':
        return (
          <section
            key={section.id}
            id={section.id}
            style={{ minHeight: '100vh', scrollSnapAlign: 'start', flexShrink: 0 }}
          >
            <Exhibitions section={section} />
          </section>
        )
      case 'contact':
        return (
          <section
            key={section.id}
            id={section.id}
            style={{ minHeight: '100vh', scrollSnapAlign: 'start', flexShrink: 0 }}
          >
            <Contact section={section} />
          </section>
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
          height: '100vh',
          overflowY: 'scroll',
          scrollSnapType: 'y mandatory',
          scrollBehavior: 'smooth',
        }}
      >
        <Nav config={config} sections={visibleSections} artistSlug={artistSlug} />
        {visibleSections.map(renderSection)}
      </div>
    </>
  )
}
