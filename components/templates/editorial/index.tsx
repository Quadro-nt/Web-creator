import type { ReactNode } from 'react'
import type { PageConfig, SectionConfig, SiteConfig } from '@/lib/schemas/site-config.schema'
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
  page: PageConfig
  works: Artwork[]
  artistSlug: string
  inPreview?: boolean
  onSelectChrome?: (target: 'announcement' | 'header' | 'footer') => void
  renderSectionWrapper?: (section: SectionConfig, children: ReactNode, index: number) => ReactNode
}

export default function EditorialTemplate({
  config,
  page,
  works,
  artistSlug,
  inPreview = false,
  onSelectChrome,
  renderSectionWrapper,
}: Props) {
  const tokenCss = generateTokenStyles(config, '.qs-site-root')
  const visibleSections = page.sections.filter((s) => s.visible)

  const editorialCss = `
    .qs-editorial-dialect h1 { font-size: clamp(2.5rem, 7vw, 5.25rem); line-height: 1.02; letter-spacing: -0.02em; }
    .qs-editorial-dialect h2 { font-size: clamp(1.75rem, 4.2vw, 3.5rem); line-height: 1.08; letter-spacing: -0.015em; }
    .qs-editorial-dialect h3 { font-size: clamp(1.25rem, 2.4vw, 1.75rem); line-height: 1.2; }
    .qs-editorial-dialect .qs-editorial-main > div + div { border-top: 1px solid rgba(128,128,128,0.22); padding-top: clamp(2.5rem, 5vw, 4.5rem); }
    @container qs-canvas (min-width: 900px) {
      .qs-editorial-dialect .qs-editorial-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); column-gap: clamp(1.5rem, 3vw, 2.5rem); }
    }
  `

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
      <style dangerouslySetInnerHTML={{ __html: editorialCss }} />
      <div
        className="qs-site-root qs-editorial-dialect"
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
          className="qs-editorial-main"
          style={{
            maxWidth: 'min(1180px, 94vw)',
            marginInline: 'auto',
            paddingInline: 'clamp(1rem, 4vw, 3rem)',
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
