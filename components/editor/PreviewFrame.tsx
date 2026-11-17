'use client'

import { createElement } from 'react'
import type { ComponentType } from 'react'
import type { SiteConfig } from '@/lib/schemas/site-config.schema'
import type { Artwork } from '@/lib/schemas/works.schema'
import MinimalGallery from '@/components/templates/minimal-gallery'
import EditorialTemplate from '@/components/templates/editorial'
import ImmersiveTemplate from '@/components/templates/immersive'
import type { Viewport } from '@/app/editor/[token]/EditorConfig'

type TemplateProps = {
  config: SiteConfig
  works: Artwork[]
  artistSlug: string
}

const TEMPLATES: Record<SiteConfig['template'], ComponentType<TemplateProps>> = {
  'minimal-gallery': MinimalGallery,
  editorial: EditorialTemplate,
  immersive: ImmersiveTemplate,
}

type Props = {
  config: SiteConfig
  works: Artwork[]
  artistSlug: string
  viewport: Viewport
}

export default function PreviewFrame({ config, works, artistSlug, viewport }: Props) {
  const Template = TEMPLATES[config.template] ?? MinimalGallery

  const isMobile = viewport === 'mobile'
  const outerStyle: React.CSSProperties = {
    width: '100%',
    display: 'flex',
    justifyContent: 'center',
    background: '#f3f4f6',
    padding: isMobile ? '1rem' : '0',
    minHeight: '100%',
  }

  const frameStyle: React.CSSProperties = isMobile
    ? {
        width: '390px',
        maxWidth: '100%',
        overflowX: 'hidden',
        background: '#ffffff',
        border: '1px solid #d4d4d8',
        borderRadius: '12px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
      }
    : {
        width: '100%',
        background: '#ffffff',
      }

  return (
    <div data-testid="preview-frame" data-viewport={viewport} style={outerStyle}>
      <div style={frameStyle}>
        {createElement(Template, { config, works, artistSlug })}
      </div>
    </div>
  )
}
