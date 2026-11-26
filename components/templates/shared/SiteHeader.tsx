'use client'

import { useState } from 'react'
import type { SiteConfig } from '@/lib/schemas/site-config.schema'
import { buildWhatsappUrl, getNavItems } from './template-helpers'
import SafeLink from './SafeLink'

type Props = {
  config: SiteConfig
  artistSlug: string
  inPreview?: boolean
  onSelectChrome?: (target: 'announcement' | 'header' | 'footer') => void
}

const LOGO_HEIGHT_MAP = {
  sm: '24px',
  md: '36px',
  lg: '50px',
} as const

export default function SiteHeader({ config, artistSlug, inPreview = false, onSelectChrome }: Props) {
  const [menuOpen, setMenuOpen] = useState(false)
  const header = config.header
  if (!header) return null

  const navPages = (config.pages ?? []).filter((p) => p.showInNav)
  const navLinks =
    navPages.length > 0
      ? navPages.map((p) => ({
          href: p.isHome ? '/' : `/${p.slug}`,
          label: p.navLabel ?? p.title,
        }))
      : header.customLinks && header.customLinks.length > 0
        ? header.customLinks.filter((l) => l.label.trim().length > 0)
        : getNavItems(config).map((item) => ({ label: item.label, href: `#${item.id}` }))

  const bgColor = header.transparentOverCover ? 'transparent' : header.backgroundColor || 'var(--color-bg)'
  const fgColor = header.textColor || 'var(--color-text)'
  const logoHeight = LOGO_HEIGHT_MAP[header.logoHeight ?? 'md']
  const uppercase = header.uppercaseLinks ?? true
  const sticky = config.navigation.sticky
  const waHref = buildWhatsappUrl(header.whatsappNumber, `Hola ${artistSlug}, vi tu sitio web.`)
  const igHandle = header.instagramHandle?.replace(/^@/, '').trim()

  const brandNode = (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.6rem' }}>
      {config.identity.logoUrl ? (
        <img
          src={config.identity.logoUrl}
          alt={config.identity.siteTitle}
          style={{ height: logoHeight, width: 'auto', objectFit: 'contain', display: 'block' }}
        />
      ) : (
        <span
          style={{
            fontFamily: 'var(--font-heading)',
            fontSize: header.logoHeight === 'lg' ? '1.35rem' : header.logoHeight === 'sm' ? '0.95rem' : '1.15rem',
            fontWeight: 700,
            letterSpacing: '0.06em',
            textTransform: uppercase ? 'uppercase' : 'none',
            whiteSpace: 'nowrap',
          }}
        >
          {config.identity.siteTitle}
        </span>
      )}
    </span>
  )

  const linkStyle: React.CSSProperties = {
    textDecoration: 'none',
    color: fgColor,
    fontSize: '0.78rem',
    fontWeight: 600,
    letterSpacing: '0.1em',
    textTransform: uppercase ? 'uppercase' : 'none',
    whiteSpace: 'nowrap',
    opacity: 0.9,
  }

  const iconsNode = (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.85rem' }}>
      {header.showSearchIcon && (
        <button
          type="button"
          aria-label="Buscar obras"
          onClick={(e) => {
            if (inPreview && onSelectChrome) {
              e.stopPropagation()
              onSelectChrome('header')
              return
            }
            window.dispatchEvent(new CustomEvent('qs:focus-search'))
          }}
          style={{
            background: 'none',
            border: 'none',
            color: fgColor,
            cursor: 'pointer',
            padding: '0.2rem',
            display: 'inline-flex',
            alignItems: 'center',
          }}
        >
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <circle cx="11" cy="11" r="7" />
            <line x1="20" y1="20" x2="16.2" y2="16.2" />
          </svg>
        </button>
      )}
      {igHandle && (
        <a
          href={`https://instagram.com/${igHandle}`}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Instagram"
          style={{ color: fgColor, display: 'inline-flex', alignItems: 'center' }}
        >
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <rect x="3" y="3" width="18" height="18" rx="5" />
            <circle cx="12" cy="12" r="4" />
            <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
          </svg>
        </a>
      )}
      {header.showWhatsappIcon && waHref && (
        <a
          href={waHref}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="WhatsApp"
          style={{ color: fgColor, display: 'inline-flex', alignItems: 'center' }}
        >
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
          </svg>
        </a>
      )}
    </div>
  )

  return (
    <header
      onClick={(e) => {
        if (onSelectChrome) {
          e.stopPropagation()
          onSelectChrome('header')
        }
      }}
      onClickCapture={(e) => {
        if (inPreview && (e.target as HTMLElement | null)?.closest('a')) {
          e.preventDefault()
        }
      }}
      title={inPreview ? 'Clic para editar encabezado' : undefined}
      className="qs-section-pad"
      style={{
        position: sticky ? 'sticky' : 'relative',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        backgroundColor: bgColor,
        color: fgColor,
        borderBottom: header.transparentOverCover ? 'none' : '1px solid rgba(128,128,128,0.18)',
        padding: '0.9rem 2.25rem',
        cursor: onSelectChrome ? 'pointer' : undefined,
      }}
    >
      {header.layout === 'centered' ? (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr auto 1fr',
            alignItems: 'center',
            gap: '1rem',
          }}
        >
          <ul
            className="qs-nav-links"
            style={{
              listStyle: 'none',
              margin: 0,
              padding: 0,
              display: 'flex',
              alignItems: 'center',
              gap: '1.25rem',
              flexWrap: 'wrap',
            }}
          >
            {navLinks.map((item, idx) => (
              <li key={idx}>
                <SafeLink href={item.href} artistSlug={artistSlug} style={linkStyle}>
                  {item.label}
                </SafeLink>
              </li>
            ))}
          </ul>
          <div style={{ justifySelf: 'center' }}>{brandNode}</div>
          <div style={{ justifySelf: 'end' }}>{iconsNode}</div>
        </div>
      ) : header.layout === 'minimal' ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
          {brandNode}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            {iconsNode}
            <button
              type="button"
              aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'}
              onClick={(e) => {
                e.stopPropagation()
                setMenuOpen((v) => !v)
              }}
              style={{
                background: 'none',
                border: 'none',
                color: fgColor,
                fontSize: '1.35rem',
                cursor: 'pointer',
                padding: '0.2rem',
                lineHeight: 1,
              }}
            >
              {menuOpen ? '✕' : '☰'}
            </button>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1.25rem', flexWrap: 'wrap' }}>
          {brandNode}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
            <ul
              className="qs-nav-links"
              style={{
                listStyle: 'none',
                margin: 0,
                padding: 0,
                display: 'flex',
                alignItems: 'center',
                gap: '1.25rem',
                flexWrap: 'wrap',
              }}
            >
              {navLinks.map((item, idx) => (
                <li key={idx}>
                  <SafeLink href={item.href} artistSlug={artistSlug} style={linkStyle}>
                    {item.label}
                  </SafeLink>
                </li>
              ))}
            </ul>
            {iconsNode}
          </div>
        </div>
      )}

      {header.layout === 'minimal' && menuOpen && (
        <div style={{ marginTop: '0.85rem', paddingTop: '0.85rem', borderTop: '1px solid rgba(128,128,128,0.2)' }}>
          <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            {navLinks.map((item, idx) => (
              <li key={idx}>
                <SafeLink
                  href={item.href}
                  artistSlug={artistSlug}
                  onClick={() => setMenuOpen(false)}
                  style={{ ...linkStyle, fontSize: '0.95rem' }}
                >
                  {item.label}
                </SafeLink>
              </li>
            ))}
          </ul>
        </div>
      )}
    </header>
  )
}
