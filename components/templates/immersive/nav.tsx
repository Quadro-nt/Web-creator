'use client'

import { useState, useEffect } from 'react'
import type { SiteConfig } from '@/lib/schemas/site-config.schema'

type SectionConfig = SiteConfig['sections'][number]

type Props = {
  config: SiteConfig
  sections: SectionConfig[]
  artistSlug: string
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

export default function ImmersiveNav({ sections }: Props) {
  const [activeId, setActiveId] = useState<string>('')

  useEffect(() => {
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
  }, [sections])

  if (sections.length === 0) return null

  return (
    <nav
      aria-label="Navegación de secciones"
      style={{
        position: 'fixed',
        right: '1.5rem',
        top: '50%',
        transform: 'translateY(-50%)',
        zIndex: 200,
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem',
        alignItems: 'center',
      }}
    >
      {sections.map((section) => {
        const isActive = activeId === section.id
        return (
          <a
            key={section.id}
            href={`#${section.id}`}
            aria-label={getSectionLabel(section.type)}
            title={getSectionLabel(section.type)}
            style={{
              display: 'block',
              width: isActive ? '24px' : '8px',
              height: '2px',
              backgroundColor: isActive ? 'var(--color-accent)' : 'rgba(240,240,240,0.4)',
              transition: 'all 0.3s ease',
              textDecoration: 'none',
            }}
          />
        )
      })}
    </nav>
  )
}
