'use client'

import { createElement } from 'react'
import type { ComponentType, ReactNode } from 'react'
import type { PageConfig, SectionConfig, SiteConfig } from '@/lib/schemas/site-config.schema'
import type { Artwork } from '@/lib/schemas/works.schema'
import MinimalGallery from '@/components/templates/minimal-gallery'
import EditorialTemplate from '@/components/templates/editorial'
import ImmersiveTemplate from '@/components/templates/immersive'
import type { Viewport } from '@/app/editor/[token]/EditorConfig'

type TemplateProps = {
  config: SiteConfig
  page: PageConfig
  works: Artwork[]
  artistSlug: string
  inPreview?: boolean
  onSelectChrome?: (target: 'announcement' | 'header' | 'footer') => void
  renderSectionWrapper?: (section: SectionConfig, children: ReactNode, index: number) => ReactNode
}

const TEMPLATES: Record<SiteConfig['template'], ComponentType<TemplateProps>> = {
  'minimal-gallery': MinimalGallery,
  editorial: EditorialTemplate,
  immersive: ImmersiveTemplate,
}

type Props = {
  config: SiteConfig
  page: PageConfig | undefined
  works: Artwork[]
  artistSlug: string
  viewport: Viewport
  onSelectChrome?: (target: 'announcement' | 'header' | 'footer') => void
  renderSectionWrapper?: (section: SectionConfig, children: ReactNode, index: number) => ReactNode
}

export default function PreviewFrame({
  config,
  page,
  works,
  artistSlug,
  viewport,
  onSelectChrome,
  renderSectionWrapper,
}: Props) {
  const Template = TEMPLATES[config.template] ?? MinimalGallery

  const effectivePage: PageConfig =
    page ?? config.pages.find((p) => p.isHome) ?? config.pages[0]

  const isFramed = viewport !== 'desktop'
  const frameWidth = viewport === 'mobile' ? '390px' : viewport === 'tablet' ? '768px' : '100%'

  const outerStyle: React.CSSProperties = {
    width: '100%',
    display: 'flex',
    justifyContent: 'center',
    background: '#e2e8f0',
    padding: isFramed ? '1.25rem' : '0',
    minHeight: '100%',
  }

  const frameStyle: React.CSSProperties = isFramed
    ? {
        width: frameWidth,
        maxWidth: '100%',
        overflowX: 'hidden',
        background: '#ffffff',
        border: '1px solid #d4d4d8',
        borderRadius: '12px',
        boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
      }
    : {
        width: '100%',
        background: '#ffffff',
      }

  return (
    <div data-testid="preview-frame" data-viewport={viewport} style={outerStyle}>
      <div style={frameStyle}>
        {createElement(Template, {
          config,
          page: effectivePage,
          works,
          artistSlug,
          inPreview: true,
          onSelectChrome,
          renderSectionWrapper,
        })}
      </div>
    </div>
  )
}
