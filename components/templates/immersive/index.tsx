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

export default function ImmersiveTemplate({
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

  const immersiveCss = `
    .qs-immersive-dialect {
      --color-bg: #0a0a0a;
      --color-text: #f5f5f5;
      --qs-bg: #0a0a0a;
      --qs-text: #f5f5f5;
      --color-surface: rgba(255,255,255,0.06);
      color-scheme: dark;
    }
    .qs-immersive-dialect .qs-immersive-chrome {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      z-index: 150;
      background: linear-gradient(to bottom, rgba(0,0,0,0.55), rgba(0,0,0,0));
      pointer-events: none;
    }
    .qs-immersive-dialect .qs-immersive-chrome > * { pointer-events: auto; }
  `

  function renderSectionContent(section: SectionConfig): ReactNode {
    let inner: ReactNode = null

    if (isExtraSectionType(section.type)) {
      inner = (
        <section
          id={section.id}
          style={{
            minHeight: inPreview ? 'auto' : '70vh',
            flexShrink: 0,
          }}
        >
          <ExtraSection
            section={section}
            config={config}
            works={works}
            artistSlug={artistSlug}
            inPreview={inPreview}
          />
        </section>
      )
    } else {
      switch (section.type) {
        case 'cover':
          inner = (
            <section
              id={section.id}
              style={{
                display: 'grid',
                gridTemplateRows: 'minmax(0, 1fr)',
                minHeight: inPreview ? '520px' : '100vh',
                flexShrink: 0,
              }}
            >
              <Cover section={section} config={config} />
            </section>
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
            <section
              id={section.id}
              style={{
                minHeight: inPreview ? 'auto' : '100vh',
                flexShrink: 0,
              }}
            >
              <ArtworksSection section={enriched} works={works} artistSlug={artistSlug} config={config} />
            </section>
          )
          break
        }
        case 'bio':
          inner = (
            <section
              id={section.id}
              style={{
                minHeight: inPreview ? 'auto' : '100vh',
                flexShrink: 0,
              }}
            >
              <Bio section={section} config={config} />
            </section>
          )
          break
        case 'exhibitions':
          inner = (
            <section
              id={section.id}
              style={{
                minHeight: inPreview ? 'auto' : '100vh',
                flexShrink: 0,
              }}
            >
              <Exhibitions section={section} config={config} />
            </section>
          )
          break
        case 'contact':
          inner = (
            <section
              id={section.id}
              style={{
                minHeight: inPreview ? 'auto' : '100vh',
                flexShrink: 0,
              }}
            >
              <Contact section={section} config={config} />
            </section>
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
      <style dangerouslySetInnerHTML={{ __html: immersiveCss }} />
      <div
        className="qs-site-root qs-immersive-dialect"
        style={{
          backgroundColor: 'var(--color-bg)',
          color: 'var(--color-text)',
          minHeight: inPreview ? '100%' : '100vh',
          scrollBehavior: 'smooth',
          containerType: 'inline-size',
          containerName: 'qs-canvas',
          position: 'relative',
        }}
      >
        <a href="#qs-main-content" className="qs-skip-link">
          Saltar al contenido principal
        </a>
        <div className="qs-immersive-chrome">
          <AnnouncementBar config={config} inPreview={inPreview} onSelectChrome={onSelectChrome} />
          {config.header && (
            <SiteHeader
              config={config}
              artistSlug={artistSlug}
              inPreview={inPreview}
              onSelectChrome={onSelectChrome}
            />
          )}
        </div>
        {!config.header && (
          <ChromeRegion
            target="header"
            onSelectChrome={onSelectChrome}
            title={inPreview ? 'Clic para editar encabezado' : undefined}
          >
            <Nav config={config} sections={visibleSections} artistSlug={artistSlug} inPreview={inPreview} />
          </ChromeRegion>
        )}

        <main id="qs-main-content">
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
