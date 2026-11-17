'use client'

import { useState } from 'react'
import type { CSSProperties } from 'react'
import type { SiteConfig } from '@/lib/schemas/site-config.schema'

type Props = {
  config: SiteConfig
  artistSlug: string
}

type NavItem = {
  id: string
  label: string
  index: number
}

function getSectionLabel(type: string): string {
  const labels: Record<string, string> = {
    cover: 'Inicio',
    artworks: 'Obras',
    bio: 'Sobre mí',
    exhibitions: 'Exposiciones',
    contact: 'Contacto',
  }
  return labels[type] ?? type
}

export default function Nav({ config }: Props) {
  const [menuOpen, setMenuOpen] = useState(false)

  const visibleSections: NavItem[] = config.sections
    .filter((s) => s.visible && s.type !== 'cover')
    .map((s, i) => ({ id: s.id, label: getSectionLabel(s.type), index: i + 1 }))

  const { type, sticky } = config.navigation
  const positionStyle: CSSProperties = sticky ? { position: 'sticky', top: 0 } : {}

  if (type === 'side') {
    return (
      <>
        <nav
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            bottom: 0,
            width: '220px',
            backgroundColor: 'var(--color-bg)',
            borderRight: '1px solid rgba(0,0,0,0.12)',
            display: 'flex',
            flexDirection: 'column',
            padding: '3rem 2rem',
            zIndex: 100,
          }}
        >
          <div style={{ flex: 1 }}>
            <p
              style={{
                fontSize: '0.65rem',
                letterSpacing: '0.3em',
                textTransform: 'uppercase',
                opacity: 0.3,
                marginBottom: '3rem',
              }}
            >
              {config.identity.siteTitle}
            </p>
            <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
              {visibleSections.map((item) => (
                <li key={item.id} style={{ marginBottom: '0.75rem', display: 'flex', alignItems: 'baseline', gap: '0.75rem' }}>
                  <span
                    style={{
                      fontSize: '0.6rem',
                      opacity: 0.3,
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
                      opacity: 0.75,
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
              fontSize: '0.65rem',
              opacity: 0.25,
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
            borderBottom: menuOpen ? 'none' : '1px solid rgba(0,0,0,0.1)',
            zIndex: 100,
            padding: '1.25rem 2rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span
            style={{
              fontSize: '0.65rem',
              letterSpacing: '0.3em',
              textTransform: 'uppercase',
              fontWeight: 700,
              opacity: 0.6,
            }}
          >
            {config.identity.siteTitle}
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
              borderBottom: '1px solid rgba(0,0,0,0.1)',
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
                    borderBottom: '1px solid rgba(0,0,0,0.07)',
                    padding: '0.9rem 0',
                  }}
                >
                  <span style={{ fontSize: '0.6rem', opacity: 0.3, fontWeight: 600 }}>
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
                fontSize: '0.65rem',
                opacity: 0.25,
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

  // Default: 'top'
  return (
    <>
      <nav
        style={{
          ...positionStyle,
          top: 0,
          left: 0,
          right: 0,
          backgroundColor: 'var(--color-bg)',
          borderBottom: '1px solid rgba(0,0,0,0.1)',
          zIndex: 100,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '1.25rem 3rem',
        }}
      >
        <span
          style={{
            fontSize: '0.7rem',
            letterSpacing: '0.25em',
            textTransform: 'uppercase',
            color: 'var(--color-text)',
            fontWeight: 700,
            opacity: 0.9,
          }}
        >
          {config.identity.siteTitle}
        </span>
        <ul
          style={{
            listStyle: 'none',
            margin: 0,
            padding: 0,
            display: 'flex',
            gap: '0',
            alignItems: 'center',
          }}
        >
          {visibleSections.map((item, i) => (
            <li key={item.id} style={{ display: 'flex', alignItems: 'center' }}>
              {i > 0 && (
                <span
                  style={{
                    padding: '0 0.75rem',
                    opacity: 0.2,
                    fontSize: '0.7rem',
                    color: 'var(--color-text)',
                  }}
                >
                  —
                </span>
              )}
              <a
                href={`#${item.id}`}
                style={{
                  textDecoration: 'none',
                  color: 'var(--color-text)',
                  fontSize: '0.75rem',
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  fontWeight: 600,
                  opacity: 0.6,
                }}
              >
                {item.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>
      <footer
        style={{
          position: 'fixed',
          bottom: '1rem',
          right: '1.5rem',
          zIndex: 50,
        }}
      >
        <a
          href="https://quadro-nt.com"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            fontSize: '0.65rem',
            opacity: 0.25,
            color: 'var(--color-text)',
            textDecoration: 'none',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
          }}
        >
          Hecho con Quadro
        </a>
      </footer>
    </>
  )
}
