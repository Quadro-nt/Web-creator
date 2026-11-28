'use client'

import { useState, useEffect } from 'react'
import type { SectionConfig, SiteConfig } from '@/lib/schemas/site-config.schema'

interface NavigationProps {
  config: SiteConfig
  sections: SectionConfig[]
  artistSlug: string
  inPreview?: boolean
}

export function Navigation({ config, sections, inPreview = false }: NavigationProps) {
  const { type, sticky } = config.navigation
  const visibleSections = sections.filter((s) => s.visible)
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    if (!sticky || type !== 'top') return
    const handler = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', handler, { passive: true })
    return () => window.removeEventListener('scroll', handler)
  }, [sticky, type])

  const links = visibleSections.map((section) => (
    <a
      key={section.id}
      href={`#${section.id}`}
      className="text-sm font-medium text-[var(--color-text)] hover:text-[var(--color-accent)] transition-colors"
    >
      {section.type.charAt(0).toUpperCase() + section.type.slice(1)}
    </a>
  ))

  const showStaticColophon = !config.footer?.enabled && !inPreview

  if (type === 'top') {
    return (
      <>
        <nav
          className={[
            'w-full px-6 py-4 flex items-center justify-between gap-6 bg-[var(--color-bg)]',
            sticky ? 'sticky top-0 z-50' : '',
            scrolled ? 'shadow-md' : '',
          ]
            .filter(Boolean)
            .join(' ')}
          aria-label="Site navigation"
        >
          <span className="font-semibold text-[var(--color-text)]">
            {config.identity.siteTitle}
          </span>
          <div className="flex items-center gap-6">{links}</div>
        </nav>
        {showStaticColophon && <StaticColophon />}
      </>
    )
  }

  if (type === 'side') {
    return (
      <>
        <nav
          className={[
            'hidden md:flex flex-col gap-4 p-6 bg-[var(--color-bg)] w-56 min-h-screen',
            sticky ? 'fixed top-0 left-0 z-50' : '',
          ]
            .filter(Boolean)
            .join(' ')}
          aria-label="Site navigation"
        >
          <span className="font-semibold text-[var(--color-text)] mb-2">
            {config.identity.siteTitle}
          </span>
          {links}
          <div className="mt-auto">
            <QuadroCredit />
          </div>
        </nav>
        <MobileMenu
          title={config.identity.siteTitle}
          links={links}
          open={menuOpen}
          onToggle={() => setMenuOpen((o) => !o)}
        />
        {showStaticColophon && <StaticColophon />}
      </>
    )
  }

  return (
    <>
      <MobileMenu
        title={config.identity.siteTitle}
        links={links}
        open={menuOpen}
        onToggle={() => setMenuOpen((o) => !o)}
        fullscreen
      />
      {showStaticColophon && <StaticColophon />}
    </>
  )
}

function StaticColophon() {
  return (
    <footer
      style={{
        padding: '1.5rem',
        textAlign: 'center',
        borderTop: '1px solid rgba(128,128,128,0.18)',
      }}
    >
      <QuadroCredit />
    </footer>
  )
}

function QuadroCredit() {
  return (
    <a
      href="https://quadro-nt.com"
      target="_blank"
      rel="noopener noreferrer"
      style={{
        color: 'var(--color-text)',
        opacity: 0.72,
        fontSize: '0.75rem',
        textDecoration: 'none',
        whiteSpace: 'nowrap',
      }}
    >
      Hecho con Quadro
    </a>
  )
}

interface MobileMenuProps {
  title: string
  links: React.ReactNode[]
  open: boolean
  onToggle: () => void
  fullscreen?: boolean
}

function MobileMenu({ title, links, open, onToggle, fullscreen }: MobileMenuProps) {
  return (
    <div className="md:hidden">
      <button
        onClick={onToggle}
        className="fixed top-4 right-4 z-50 p-2 bg-[var(--color-bg)] border border-[var(--color-text)] rounded"
        aria-label={open ? 'Cerrar menú' : 'Abrir menú'}
        aria-expanded={open}
      >
        <HamburgerIcon open={open} />
      </button>
      {open && (
        <div
          className={[
            'fixed z-40 bg-[var(--color-bg)] p-8 flex flex-col gap-6',
            fullscreen ? 'inset-0' : 'top-0 right-0 h-full w-64',
          ].join(' ')}
        >
          <span className="font-semibold text-[var(--color-text)]">{title}</span>
          {links}
          <div className="mt-auto">
            <QuadroCredit />
          </div>
        </div>
      )}
    </div>
  )
}

function HamburgerIcon({ open }: { open: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      {open ? (
        <>
          <line x1="4" y1="4" x2="16" y2="16" stroke="currentColor" strokeWidth="2" />
          <line x1="16" y1="4" x2="4" y2="16" stroke="currentColor" strokeWidth="2" />
        </>
      ) : (
        <>
          <line x1="3" y1="6" x2="17" y2="6" stroke="currentColor" strokeWidth="2" />
          <line x1="3" y1="10" x2="17" y2="10" stroke="currentColor" strokeWidth="2" />
          <line x1="3" y1="14" x2="17" y2="14" stroke="currentColor" strokeWidth="2" />
        </>
      )}
    </svg>
  )
}
