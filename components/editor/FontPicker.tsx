'use client'

import { useState } from 'react'
import {
  FONT_CATALOG,
  FONT_CATEGORY_LABELS,
  getEditorPreviewFontsUrl,
  type FontCategory,
  type FontFamilyName,
} from '@/lib/tokens/font-catalog'
import { STUDIO_COLORS, studioInputStyle } from './studio-styles'

type Props = {
  headingFont?: FontFamilyName
  bodyFont?: FontFamilyName
  onSelectHeading: (font: FontFamilyName) => void
  onSelectBody: (font: FontFamilyName) => void
}

const CATEGORIES: Array<{ key: 'all' | FontCategory; label: string }> = [
  { key: 'all', label: 'Todas' },
  { key: 'pop-retro', label: 'Pop / Retro' },
  { key: 'editorial', label: 'Editorial' },
  { key: 'moderna', label: 'Moderna' },
  { key: 'artesanal', label: 'Artesanal' },
]

export default function FontPicker({
  headingFont,
  bodyFont,
  onSelectHeading,
  onSelectBody,
}: Props) {
  const [target, setTarget] = useState<'heading' | 'body'>('heading')
  const [category, setCategory] = useState<'all' | FontCategory>('all')
  const [query, setQuery] = useState('')
  const previewFontsUrl = getEditorPreviewFontsUrl()

  const activeFont = target === 'heading' ? headingFont : bodyFont
  const q = query.trim().toLowerCase()

  const entries = FONT_CATALOG.filter((entry) => {
    if (category !== 'all' && entry.category !== category) return false
    if (q && !entry.family.toLowerCase().includes(q)) return false
    return true
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
      {previewFontsUrl && <link rel="stylesheet" href={previewFontsUrl} />}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.3rem' }}>
        <button
          type="button"
          onClick={() => setTarget('heading')}
          aria-pressed={target === 'heading'}
          style={{
            padding: '0.4rem 0.5rem',
            borderRadius: '6px',
            border: `1px solid ${target === 'heading' ? STUDIO_COLORS.primary : STUDIO_COLORS.inputBorder}`,
            background: target === 'heading' ? STUDIO_COLORS.primary : STUDIO_COLORS.surface,
            color: target === 'heading' ? '#ffffff' : STUDIO_COLORS.text,
            fontSize: '0.74rem',
            fontWeight: 600,
            cursor: 'pointer',
            fontFamily: 'inherit',
          }}
        >
          Títulos {headingFont ? `· ${headingFont}` : ''}
        </button>
        <button
          type="button"
          onClick={() => setTarget('body')}
          aria-pressed={target === 'body'}
          style={{
            padding: '0.4rem 0.5rem',
            borderRadius: '6px',
            border: `1px solid ${target === 'body' ? STUDIO_COLORS.primary : STUDIO_COLORS.inputBorder}`,
            background: target === 'body' ? STUDIO_COLORS.primary : STUDIO_COLORS.surface,
            color: target === 'body' ? '#ffffff' : STUDIO_COLORS.text,
            fontSize: '0.74rem',
            fontWeight: 600,
            cursor: 'pointer',
            fontFamily: 'inherit',
          }}
        >
          Texto {bodyFont ? `· ${bodyFont}` : ''}
        </button>
      </div>

      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Buscar tipografía…"
        aria-label="Buscar tipografía"
        style={studioInputStyle}
      />

      <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
        {CATEGORIES.map((cat) => {
          const active = category === cat.key
          return (
            <button
              key={cat.key}
              type="button"
              onClick={() => setCategory(cat.key)}
              style={{
                padding: '0.22rem 0.5rem',
                borderRadius: '9999px',
                border: `1px solid ${active ? STUDIO_COLORS.accent : STUDIO_COLORS.inputBorder}`,
                background: active ? STUDIO_COLORS.accentSoft : STUDIO_COLORS.surface,
                color: active ? STUDIO_COLORS.accent : STUDIO_COLORS.muted,
                fontSize: '0.68rem',
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              {cat.label}
            </button>
          )
        })}
      </div>

      <div
        style={{
          maxHeight: '220px',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.35rem',
          paddingRight: '0.15rem',
        }}
      >
        {entries.map((entry) => {
          const selected = activeFont === entry.family
          return (
            <button
              key={entry.family}
              type="button"
              onClick={() => {
                if (target === 'heading') {
                  onSelectHeading(entry.family)
                } else {
                  onSelectBody(entry.family)
                }
              }}
              style={{
                textAlign: 'left',
                padding: '0.45rem 0.6rem',
                borderRadius: '7px',
                border: selected
                  ? `1.5px solid ${STUDIO_COLORS.accent}`
                  : `1px solid ${STUDIO_COLORS.border}`,
                background: selected ? STUDIO_COLORS.accentSoft : STUDIO_COLORS.surface,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '0.5rem',
              }}
            >
              <div style={{ minWidth: 0 }}>
                <div
                  style={{
                    fontFamily: `'${entry.family}', ${entry.fallback === 'display' ? 'sans-serif' : entry.fallback}`,
                    fontSize: '0.96rem',
                    color: STUDIO_COLORS.text,
                    lineHeight: 1.2,
                  }}
                >
                  {entry.family}
                </div>
                <div style={{ fontSize: '0.66rem', color: STUDIO_COLORS.muted, marginTop: '0.12rem' }}>
                  {FONT_CATEGORY_LABELS[entry.category]}
                </div>
              </div>
              <span
                style={{
                  fontFamily: `'${entry.family}', ${entry.fallback === 'display' ? 'sans-serif' : entry.fallback}`,
                  fontSize: '0.82rem',
                  color: STUDIO_COLORS.muted,
                  flexShrink: 0,
                }}
              >
                {entry.sample}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
