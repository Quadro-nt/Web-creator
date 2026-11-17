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
    .map((s) => ({ id: s.id, label: getSectionLabel(s.type) }))

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
            borderRight: '1px solid rgba(0,0,0,0.08)',
            display: 'flex',
            flexDirection: 'column',
            padding: '2.5rem 1.5rem',
            zIndex: 100,
          }}
        >
          <div style={{ flex: 1 }}>
            <p
              style={{
                fontSize: '0.75rem',
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                opacity: 0.4,
                marginBottom: '2rem',
              }}
            >
              {config.identity.siteTitle}
            </p>
            <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
              {visibleSections.map((item) => (
                <li key={item.id} style={{ marginBottom: '1rem' }}>
                  <a
                    href={`#${item.id}`}
                    style={{
                      textDecoration: 'none',
                      color: 'var(--color-text)',
                      fontSize: '0.9rem',
                      letterSpacing: '0.05em',
                      opacity: 0.7,
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
              fontSize: '0.7rem',
              opacity: 0.3,
              color: 'var(--color-text)',
              textDecoration: 'none',
              letterSpacing: '0.05em',
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
            borderBottom: menuOpen ? 'none' : '1px solid rgba(0,0,0,0.08)',
            zIndex: 100,
            padding: '1rem 1.5rem',
            display: 'flex',
            justifyContent: 'flex-end',
          }}
        >
          <button
            onClick={() => setMenuOpen((prev) => !prev)}
            aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--color-text)',
              fontSize: '1.5rem',
              lineHeight: 1,
              padding: '0.25rem',
            }}
          >
            {menuOpen ? '✕' : '☰'}
          </button>
        </nav>
        {menuOpen && (
          <div
            style={{
              backgroundColor: 'var(--color-bg)',
              borderBottom: '1px solid rgba(0,0,0,0.08)',
              padding: '1rem 1.5rem 2rem',
              zIndex: 99,
            }}
          >
            <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
              {visibleSections.map((item) => (
                <li key={item.id} style={{ marginBottom: '1rem' }}>
                  <a
                    href={`#${item.id}`}
                    onClick={() => setMenuOpen(false)}
                    style={{
                      textDecoration: 'none',
                      color: 'var(--color-text)',
                      fontSize: '1rem',
                      display: 'block',
                      padding: '0.25rem 0',
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
                fontSize: '0.7rem',
                opacity: 0.3,
                color: 'var(--color-text)',
                textDecoration: 'none',
                display: 'block',
                marginTop: '1.5rem',
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
          borderBottom: '1px solid rgba(0,0,0,0.08)',
          zIndex: 100,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '1rem 2rem',
        }}
      >
        <span
          style={{
            fontSize: '0.85rem',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: 'var(--color-text)',
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
            gap: '2rem',
          }}
        >
          {visibleSections.map((item) => (
            <li key={item.id}>
              <a
                href={`#${item.id}`}
                style={{
                  textDecoration: 'none',
                  color: 'var(--color-text)',
                  fontSize: '0.85rem',
                  letterSpacing: '0.05em',
                  opacity: 0.7,
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
            fontSize: '0.7rem',
            opacity: 0.3,
            color: 'var(--color-text)',
            textDecoration: 'none',
          }}
        >
          Hecho con Quadro
        </a>
      </footer>
    </>
  )
}
