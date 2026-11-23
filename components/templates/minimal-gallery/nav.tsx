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
            borderRight: '1px solid rgba(128,128,128,0.18)',
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
                opacity: 0.65,
                marginBottom: '2rem',
              }}
            >
              {brandNode}
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
              fontSize: '0.7rem',
              opacity: 0.4,
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
            borderBottom: menuOpen ? 'none' : '1px solid rgba(128,128,128,0.16)',
            zIndex: 100,
            padding: '1rem 1.5rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span style={{ fontSize: '0.85rem', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
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
              borderBottom: '1px solid rgba(128,128,128,0.16)',
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
                opacity: 0.4,
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

  return (
    <>
      <nav
        className="qs-section-pad"
        style={{
          ...positionStyle,
          top: 0,
          left: 0,
          right: 0,
          backgroundColor: 'var(--color-bg)',
          borderBottom: '1px solid rgba(128,128,128,0.16)',
          zIndex: 100,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          flexWrap: 'wrap',
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
          {brandNode}
        </span>
        <ul
          className="qs-nav-links"
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
                  opacity: 0.75,
                }}
              >
                {item.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>
      {!inPreview && !config.footer?.enabled && (
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
              opacity: 0.35,
              color: 'var(--color-text)',
              textDecoration: 'none',
            }}
          >
            Hecho con Quadro
          </a>
        </footer>
      )}
    </>
  )
}
