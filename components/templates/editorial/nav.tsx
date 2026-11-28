'use client'

import { useState } from 'react'
import type { CSSProperties } from 'react'
import type { SiteConfig } from '@/lib/schemas/site-config.schema'
import { getNavItems } from '@/components/templates/shared/template-helpers'

type Props = {
  config: SiteConfig
  artistSlug: string
  inPreview?: boolean
}

export default function Nav({ config, inPreview = false }: Props) {
  const [menuOpen, setMenuOpen] = useState(false)
  const visibleSections = getNavItems(config)
  const { type, sticky } = config.navigation
  const positionStyle: CSSProperties = sticky ? { position: 'sticky', top: 0 } : {}
  const logoUrl = config.identity.logoUrl

  const brandNode = (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.6rem' }}>
      {logoUrl && (
        <img
          src={logoUrl}
          alt={config.identity.siteTitle}
          style={{ height: '24px', width: 'auto', objectFit: 'contain' }}
        />
      )}
      <span>{config.identity.siteTitle}</span>
    </span>
  )

  if (type === 'side') {
    return (
      <>
        <nav
          style={{
            position: inPreview ? 'absolute' : 'fixed',
            top: 0,
            left: 0,
            bottom: 0,
            width: '220px',
            backgroundColor: 'var(--color-bg)',
            borderRight: '1px solid rgba(128,128,128,0.2)',
            display: 'flex',
            flexDirection: 'column',
            padding: '3rem 2rem',
            zIndex: 100,
          }}
        >
          <div style={{ flex: 1 }}>
            <p
              style={{
                fontSize: '0.75rem',
                letterSpacing: '0.22em',
                textTransform: 'uppercase',
                opacity: 0.72,
                marginBottom: '3rem',
              }}
            >
              {brandNode}
            </p>
            <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
              {visibleSections.map((item) => (
                <li key={item.id} style={{ marginBottom: '0.75rem', display: 'flex', alignItems: 'baseline', gap: '0.75rem' }}>
                  <span
                    style={{
                      fontSize: '0.75rem',
                      opacity: 0.72,
                      letterSpacing: '0.1em',
                      minWidth: '1.5rem',
                      fontWeight: 600,
                    }}
                  >
                    {String(item.index).padStart(2, '0')}
                  </span>
                  <a
                    href={`#${item.id}`}
                    style={{
                      textDecoration: 'none',
                      color: 'var(--color-text)',
                      fontSize: '0.9rem',
                      letterSpacing: '0.02em',
                      fontWeight: 600,
                      opacity: 0.82,
                    }}
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <a
            href="https://quadro-nt.com"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              fontSize: '0.75rem',
              opacity: 0.72,
              color: 'var(--color-text)',
              textDecoration: 'none',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
            }}
          >
            Hecho con Quadro
          </a>
        </nav>
        <div style={{ marginLeft: '220px' }} />
      </>
    )
  }

  if (type === 'hamburger') {
    return (
      <>
        <nav
          style={{
            ...positionStyle,
            top: 0,
            left: 0,
            right: 0,
            backgroundColor: 'var(--color-bg)',
            borderBottom: menuOpen ? 'none' : '1px solid rgba(128,128,128,0.18)',
            zIndex: 100,
            padding: '1.25rem 2rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span
            style={{
              fontSize: '0.75rem',
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
              fontWeight: 700,
              opacity: 0.85,
            }}
          >
            {brandNode}
          </span>
          <button
            onClick={() => setMenuOpen((prev) => !prev)}
            aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--color-text)',
              fontSize: '1.25rem',
              lineHeight: 1,
              padding: '0.25rem',
              fontWeight: 300,
            }}
          >
            {menuOpen ? '✕' : '☰'}
          </button>
        </nav>
        {menuOpen && (
          <div
            style={{
              backgroundColor: 'var(--color-bg)',
              borderBottom: '1px solid rgba(128,128,128,0.18)',
              padding: '1.5rem 2rem 2.5rem',
              zIndex: 99,
              position: sticky ? 'sticky' : 'relative',
              top: sticky ? '3.5rem' : undefined,
            }}
          >
            <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
              {visibleSections.map((item) => (
                <li
                  key={item.id}
                  style={{
                    display: 'flex',
                    alignItems: 'baseline',
                    gap: '1rem',
                    borderBottom: '1px solid rgba(128,128,128,0.12)',
                    padding: '0.9rem 0',
                  }}
                >
                  <span style={{ fontSize: '0.75rem', opacity: 0.72, fontWeight: 600 }}>
                    {String(item.index).padStart(2, '0')}
                  </span>
                  <a
                    href={`#${item.id}`}
                    onClick={() => setMenuOpen(false)}
                    style={{
                      textDecoration: 'none',
                      color: 'var(--color-text)',
                      fontSize: '1.1rem',
                      fontWeight: 700,
                      letterSpacing: '-0.01em',
                      display: 'block',
                    }}
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
            <a
              href="https://quadro-nt.com"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                fontSize: '0.75rem',
                opacity: 0.72,
                color: 'var(--color-text)',
                textDecoration: 'none',
                display: 'block',
                marginTop: '1.5rem',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
              }}
            >
              Hecho con Quadro
            </a>
          </div>
        )}
      </>
    )
  }

  return (
    <nav
      className="qs-section-pad"
      aria-label="Masthead"
      style={{
        ...positionStyle,
        top: 0,
        left: 0,
        right: 0,
        backgroundColor: 'var(--color-bg)',
        borderBottom: '2px solid var(--color-text)',
        zIndex: 100,
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem',
        padding: 'clamp(1.25rem, 3vw, 2rem) clamp(1.5rem, 4vw, 3rem) 0.75rem',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          gap: '1rem',
          flexWrap: 'wrap',
        }}
      >
        <span
          style={{
            fontFamily: 'var(--font-heading)',
            fontSize: 'clamp(1.6rem, 3.4vw, 2.5rem)',
            letterSpacing: '-0.015em',
            color: 'var(--color-text)',
            fontWeight: 700,
            lineHeight: 1,
          }}
        >
          {brandNode}
        </span>
        <span
          style={{
            fontSize: '0.75rem',
            letterSpacing: '0.24em',
            textTransform: 'uppercase',
            opacity: 0.72,
            fontWeight: 600,
          }}
        >
          Catálogo razonado
        </span>
      </div>
      <ul
        className="qs-nav-links"
        style={{
          listStyle: 'none',
          margin: 0,
          padding: '0.5rem 0 0',
          display: 'flex',
          gap: '0',
          alignItems: 'center',
          borderTop: '1px solid rgba(128,128,128,0.22)',
          flexWrap: 'wrap',
        }}
      >
        {visibleSections.map((item, i) => (
          <li key={item.id} style={{ display: 'flex', alignItems: 'center' }}>
            {i > 0 && (
              <span
                style={{
                  padding: '0 0.9rem',
                  opacity: 0.72,
                  fontSize: '0.75rem',
                  color: 'var(--color-text)',
                }}
              >
                ·
              </span>
            )}
            <a
              href={`#${item.id}`}
              style={{
                textDecoration: 'none',
                color: 'var(--color-text)',
                fontSize: '0.75rem',
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                fontWeight: 700,
                opacity: 0.85,
                padding: '0.35rem 0',
              }}
            >
              {item.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  )
}
