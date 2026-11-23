'use client'

import { useEffect, useState } from 'react'
import type { SiteConfig } from '@/lib/schemas/site-config.schema'
import { sanitizeHref } from './template-helpers'

type Props = {
  config: SiteConfig
  inPreview?: boolean
  onSelectChrome?: (target: 'announcement' | 'header' | 'footer') => void
}

export default function AnnouncementBar({ config, inPreview = false, onSelectChrome }: Props) {
  const bar = config.announcementBar
  const [index, setIndex] = useState(0)

  const messages = bar?.messages?.filter((m) => m.trim().length > 0) ?? []
  const count = messages.length

  useEffect(() => {
    if (!bar?.enabled || !bar.autoRotate || count <= 1) return
    const timer = window.setInterval(() => {
      setIndex((prev) => (prev + 1) % count)
    }, 4500)
    return () => window.clearInterval(timer)
  }, [bar?.autoRotate, bar?.enabled, count])

  if (!bar?.enabled || count === 0) return null

  const activeMsg = messages[index % count]
  const href = sanitizeHref(bar.linkUrl)

  const content = (
    <span
      style={{
        fontSize: '0.76rem',
        fontWeight: 700,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
      }}
    >
      {activeMsg}
    </span>
  )

  return (
    <div
      onClick={(e) => {
        if (onSelectChrome) {
          e.stopPropagation()
          onSelectChrome('announcement')
        }
      }}
      title={inPreview ? 'Clic para editar barra de anuncios' : undefined}
      style={{
        backgroundColor: bar.backgroundColor || '#ec9fbf',
        color: bar.textColor || '#4b0303',
        padding: '0.55rem 1.25rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '1rem',
        minHeight: '38px',
        position: 'relative',
        zIndex: 110,
        cursor: onSelectChrome ? 'pointer' : undefined,
      }}
    >
      {count > 1 && (
        <button
          type="button"
          aria-label="Anuncio anterior"
          onClick={(e) => {
            e.stopPropagation()
            setIndex((prev) => (prev - 1 + count) % count)
          }}
          style={{
            background: 'none',
            border: 'none',
            color: 'inherit',
            cursor: 'pointer',
            fontSize: '0.9rem',
            padding: '0 0.35rem',
            opacity: 0.75,
          }}
        >
          ‹
        </button>
      )}

      {href && !inPreview ? (
        <a href={href} style={{ color: 'inherit', textDecoration: 'none' }}>
          {content}
        </a>
      ) : (
        content
      )}

      {count > 1 && (
        <button
          type="button"
          aria-label="Siguiente anuncio"
          onClick={(e) => {
            e.stopPropagation()
            setIndex((prev) => (prev + 1) % count)
          }}
          style={{
            background: 'none',
            border: 'none',
            color: 'inherit',
            cursor: 'pointer',
            fontSize: '0.9rem',
            padding: '0 0.35rem',
            opacity: 0.75,
          }}
        >
          ›
        </button>
      )}
    </div>
  )
}
