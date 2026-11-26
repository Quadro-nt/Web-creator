'use client'

import { useMemo, useState } from 'react'
import type { SiteConfig } from '@/lib/schemas/site-config.schema'
import {
  STUDIO_COLORS,
  studioInputStyle,
  studioLabelStyle,
} from './studio-styles'

type LinkType = 'internal' | 'external' | 'email' | 'tel' | 'anchor'

type Props = {
  value: string
  config: SiteConfig
  onChange: (value: string) => void
  label?: string
}

function detectType(value: string): LinkType {
  if (value.startsWith('mailto:')) return 'email'
  if (value.startsWith('tel:')) return 'tel'
  if (value.startsWith('#')) return 'anchor'
  if (/^https?:/.test(value)) return 'external'
  return 'internal'
}

export default function LinkField({ value, config, onChange, label }: Props) {
  const [type, setType] = useState<LinkType>(() => detectType(value))
  const pages = config.pages ?? []
  const missingInternal = useMemo(() => {
    if (type !== 'internal') return false
    if (value === '/' || value === '') return false
    const slug = value.replace(/^\//, '')
    return !pages.some((p) => p.slug === slug)
  }, [type, value, pages])

  const handleTypeChange = (nextType: LinkType) => {
    setType(nextType)
    switch (nextType) {
      case 'internal':
        onChange(pages.find((p) => p.isHome) ? '/' : '/')
        break
      case 'external':
        onChange('https://')
        break
      case 'email':
        onChange('mailto:')
        break
      case 'tel':
        onChange('tel:')
        break
      case 'anchor':
        onChange('#top')
        break
    }
  }

  const handleInternalChange = (slug: string) => {
    const page = pages.find((p) => p.slug === slug)
    if (!page) return
    onChange(page.isHome ? '/' : `/${page.slug}`)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      {label && <span style={{ fontSize: '0.75rem', fontWeight: 500 }}>{label}</span>}

      <div style={studioLabelStyle}>
        <label htmlFor="linkfield-type">Tipo</label>
        <select
          id="linkfield-type"
          value={type}
          onChange={(e) => handleTypeChange(e.target.value as LinkType)}
          style={studioInputStyle}
        >
          <option value="internal">Página interna</option>
          <option value="external">URL externa</option>
          <option value="email">Email</option>
          <option value="tel">Teléfono</option>
          <option value="anchor">Anchor (#)</option>
        </select>
      </div>

      {type === 'internal' && (
        <div style={studioLabelStyle}>
          <label htmlFor="linkfield-page">Página</label>
          <select
            id="linkfield-page"
            value={
              value === '/'
                ? pages.find((p) => p.isHome)?.slug ?? ''
                : value.replace(/^\//, '')
            }
            onChange={(e) => handleInternalChange(e.target.value)}
            style={studioInputStyle}
          >
            {pages.map((p) => (
              <option key={p.slug} value={p.slug}>
                {p.title}
              </option>
            ))}
          </select>
          {missingInternal && (
            <span style={{ color: STUDIO_COLORS.danger, fontSize: '0.7rem' }}>
              ⚠️ Esta página ya no existe
            </span>
          )}
        </div>
      )}

      {type === 'external' && (
        <div style={studioLabelStyle}>
          <label htmlFor="linkfield-url">URL</label>
          <input
            id="linkfield-url"
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            style={studioInputStyle}
          />
        </div>
      )}

      {type === 'email' && (
        <div style={studioLabelStyle}>
          <label htmlFor="linkfield-email">Email</label>
          <input
            id="linkfield-email"
            type="email"
            value={value.replace(/^mailto:/, '')}
            onChange={(e) => onChange(`mailto:${e.target.value}`)}
            style={studioInputStyle}
          />
        </div>
      )}

      {type === 'tel' && (
        <div style={studioLabelStyle}>
          <label htmlFor="linkfield-tel">Teléfono</label>
          <input
            id="linkfield-tel"
            type="tel"
            value={value.replace(/^tel:/, '')}
            onChange={(e) => onChange(`tel:${e.target.value}`)}
            style={studioInputStyle}
          />
        </div>
      )}

      {type === 'anchor' && (
        <div style={studioLabelStyle}>
          <label htmlFor="linkfield-anchor">Sección</label>
          <input
            id="linkfield-anchor"
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            style={studioInputStyle}
            placeholder="#artworks"
          />
        </div>
      )}
    </div>
  )
}
