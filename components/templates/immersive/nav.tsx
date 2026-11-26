'use client'

import { useState, useEffect } from 'react'
import type { SectionConfig, SiteConfig } from '@/lib/schemas/site-config.schema'
import { getNavItems } from '@/components/templates/shared/template-helpers'


type Props = {
  config: SiteConfig
  sections: SectionConfig[]
  artistSlug: string
  inPreview?: boolean
}

export default function ImmersiveNav({ config, sections, inPreview = false }: Props) {
  const [activeId, setActiveId] = useState<string>('')
  const navItems = getNavItems(config)

  useEffect(() => {
    if (inPreview || typeof IntersectionObserver === 'undefined') return
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting)
        if (visible.length > 0) {
          setActiveId(visible[0].target.id)
        }
      },
      { threshold: 0.5 }
    )
    sections.forEach((s) => {
      const el = document.getElementById(s.id)
      if (el) observer.observe(el)
    })
    return () => observer.disconnect()
  }, [sections, inPreview])

  const siteTitle = config.identity.siteTitle

  const brandNode = siteTitle ? (
    <div
      style={{
        position: inPreview ? 'absolute' : 'fixed',
        top: 'clamp(1rem, 2.5vw, 1.75rem)',
        left: 'clamp(1rem, 3vw, 2rem)',
        zIndex: 200,
        color: '#f5f5f5',
        textShadow: '0 1px 12px rgba(0,0,0,0.5)',
        pointerEvents: 'auto',
        fontFamily: 'var(--font-heading)',
        fontSize: '0.95rem',
        letterSpacing: '0.16em',
        textTransform: 'uppercase',
        fontWeight: 600,
      }}
    >
      {siteTitle}
    </div>
  ) : null

  return (
    <>
      {brandNode}
      {navItems.length > 0 && (
        <nav
          aria-label="Navegación de secciones"
          style={{
            position: inPreview ? 'absolute' : 'fixed',
            right: 'clamp(1rem, 3vw, 2rem)',
            top: inPreview ? '50%' : '50%',
            transform: 'translateY(-50%)',
            zIndex: 200,
            display: 'flex',
            flexDirection: 'column',
            gap: '0.85rem',
            alignItems: 'flex-end',
          }}
        >
          {navItems.map((item) => {
            const isActive = activeId === item.id
            return (
              <a
                key={item.id}
                href={`#${item.id}`}
                aria-label={item.label}
                title={item.label}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.6rem',
                  textDecoration: 'none',
                  color: '#f5f5f5',
                }}
              >
                <span
                  style={{
                    fontSize: '0.65rem',
                    letterSpacing: '0.2em',
                    textTransform: 'uppercase',
                    opacity: isActive ? 0.9 : 0,
                    transform: isActive ? 'translateX(0)' : 'translateX(0.5rem)',
                    transition: 'all 0.35s ease',
                    textShadow: '0 1px 8px rgba(0,0,0,0.6)',
                  }}
                >
                  {item.label}
                </span>
                <span
                  style={{
                    display: 'block',
                    width: isActive ? '28px' : '10px',
                    height: '2px',
                    backgroundColor: isActive ? 'var(--color-accent)' : '#f5f5f5',
                    opacity: isActive ? 1 : 0.5,
                    transition: 'all 0.35s ease',
                    boxShadow: isActive ? '0 0 10px rgba(255,255,255,0.3)' : undefined,
                  }}
                />
              </a>
            )
          })}
        </nav>
      )}
    </>
  )
}
