import type { ReactNode } from 'react'
import type { SectionConfig, SiteConfig } from '@/lib/schemas/site-config.schema'
import type { Artwork } from '@/lib/schemas/works.schema'
import { generateTokenStyles } from '@/lib/tokens/token-engine'
import { AnimationProvider } from '@/components/AnimationProvider'
import AnnouncementBar from '@/components/templates/shared/AnnouncementBar'
import ChromeRegion from '@/components/templates/shared/ChromeRegion'
import ExtraSection from '@/components/templates/shared/ExtraSections'
import SectionSurface from '@/components/templates/shared/SectionSurface'
import SiteFooter from '@/components/templates/shared/SiteFooter'
import SiteHeader from '@/components/templates/shared/SiteHeader'
import { isExtraSectionType } from '@/components/templates/shared/template-helpers'
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
  inPreview?: boolean
  onSelectChrome?: (target: 'announcement' | 'header' | 'footer') => void
  renderSectionWrapper?: (section: SectionConfig, children: ReactNode, index: number) => ReactNode
}

export default function MinimalGallery({
  config,
  works,
  artistSlug,
  inPreview = false,
  onSelectChrome,
  renderSectionWrapper,
}: Props) {
  const tokenCss = generateTokenStyles(config, '.qs-site-root')
  const visibleSections = config.sections.filter((s) => s.visible)

  function renderSectionContent(section: SectionConfig): ReactNode {
    let inner: ReactNode = null

    if (isExtraSectionType(section.type)) {
      inner = (
        <div id={section.id}>
          <ExtraSection
            section={section}
            config={config}
            works={works}
            artistSlug={artistSlug}
            inPreview={inPreview}
          />
        </div>
      )
    } else {
      switch (section.type) {
        case 'cover':
          inner = (
            <div id={section.id}>
              <Cover section={section} config={config} />
            </div>
          )
          break
        case 'artworks': {
          const enriched = {
            ...section,
            content: {
              ...section.content,
              columns: section.content.columns ?? config.sizes.columns,
              artworkSize: section.content.artworkSize ?? config.sizes.artworkSize,
            },
          }
          inner = (
            <div id={section.id}>
              <ArtworksSection section={enriched} works={works} artistSlug={artistSlug} config={config} />
            </div>
          )
          break
        }
        case 'bio':
          inner = (
            <div id={section.id}>
              <Bio section={section} config={config} />
            </div>
          )
          break
        case 'exhibitions':
          inner = (
            <div id={section.id}>
              <Exhibitions section={section} config={config} />
            </div>
          )
          break
        case 'contact':
          inner = (
            <div id={section.id}>
              <Contact section={section} config={config} />
            </div>
          )
          break
      }
    }

    if (!inner) return null
    return <SectionSurface styleConfig={section.style}>{inner}</SectionSurface>
  }

  return (
    <AnimationProvider config={config}>
      <style dangerouslySetInnerHTML={{ __html: tokenCss }} />
      <div
        className="qs-site-root"
        style={{
          backgroundColor: 'var(--color-bg)',
          color: 'var(--color-text)',
          minHeight: inPreview ? '100%' : '100vh',
          containerType: 'inline-size',
          containerName: 'qs-canvas',
          position: 'relative',
        }}
      >
        <AnnouncementBar config={config} inPreview={inPreview} onSelectChrome={onSelectChrome} />
        {config.header ? (
          <SiteHeader
            config={config}
            artistSlug={artistSlug}
            inPreview={inPreview}
            onSelectChrome={onSelectChrome}
          />
        ) : (
          <ChromeRegion
            target="header"
            onSelectChrome={onSelectChrome}
            title={inPreview ? 'Clic para editar encabezado' : undefined}
          >
            <Nav config={config} artistSlug={artistSlug} inPreview={inPreview} />
          </ChromeRegion>
        )}

        <main
          className="qs-minimal-main"
          style={{
            maxWidth: 'min(1200px, 92vw)',
            marginInline: 'auto',
            paddingInline: 'clamp(1rem, 4vw, 2.5rem)',
            display: 'flex',
            flexDirection: 'column',
            gap: 'clamp(3rem, 7vw, 6rem)',
            paddingBlock: 'clamp(2rem, 5vw, 4rem)',
          }}
        >
          {visibleSections.map((section, index) => {
            const node = renderSectionContent(section)
            if (renderSectionWrapper) {
              return renderSectionWrapper(section, node, index)
            }
            return <div key={section.id}>{node}</div>
          })}
        </main>

        <SiteFooter
          config={config}
          artistSlug={artistSlug}
          inPreview={inPreview}
          onSelectChrome={onSelectChrome}
        />
      </div>
    </AnimationProvider>
  )
}
