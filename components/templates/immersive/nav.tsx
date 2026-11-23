'use client'

import { useState, useEffect } from 'react'
import type { SiteConfig } from '@/lib/schemas/site-config.schema'
import { getNavItems } from '@/components/templates/shared/template-helpers'

type SectionConfig = SiteConfig['sections'][number]

type Props = {
  config: SiteConfig
  sections: SectionConfig[]
  artistSlug: string
  inPreview?: boolean
}

export default function ImmersiveNav({ config, sections, inPreview = false }: Props) {
  const [activeId, setActiveId] = useState<string>('')
  const navItems = getNavItems({ ...config, sections })

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

  if (navItems.length === 0) return null

  return (
    <nav
      aria-label="Navegación de secciones"
      style={{
        position: inPreview ? 'absolute' : 'fixed',
        right: '1.5rem',
        top: inPreview ? '1.5rem' : '50%',
        transform: inPreview ? undefined : 'translateY(-50%)',
        zIndex: 200,
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem',
        alignItems: 'center',
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
              display: 'block',
              width: isActive ? '24px' : '8px',
              height: '2px',
              backgroundColor: isActive ? 'var(--color-accent)' : 'currentColor',
              opacity: isActive ? 1 : 0.4,
              transition: 'all 0.3s ease',
              textDecoration: 'none',
            }}
          />
        )
      })}
    </nav>
  )
}
