'use client'

import type { SectionConfig, SiteConfig } from '@/lib/schemas/site-config.schema'
import { ContentWrapper } from '@/components/ContentWrapper'
import { sanitizeExternalUrl, sanitizeHref } from './template-helpers'

type CategoryCard = {
  title: string
  ctaLabel?: string
  imageUrl?: string
  filterTag?: string
  href?: string
}

type Props = {
  section: SectionConfig
  config: SiteConfig
}

export default function CategoryGridClient({ section, config }: Props) {
  const cards = Array.isArray(section.content.cards) ? (section.content.cards as CategoryCard[]) : []
  const cols = Number(section.content.columns) || 2
  const isFramed = section.variant === 'framed'

  if (cards.length === 0) {
    return (
      <section className="qs-section-pad" style={{ padding: '3rem 2rem' }}>
        <ContentWrapper width={config.sizes.contentWidth}>
          <div style={{ padding: '2rem', border: '1px dashed currentColor', opacity: 0.45, textAlign: 'center' }}>
            Agrega tarjetas de colecciones (ej. Originales, Prints) desde el inspector.
          </div>
        </ContentWrapper>
      </section>
    )
  }

  return (
    <section className="qs-section-pad" style={{ padding: '3rem 2rem' }}>
      <ContentWrapper width={config.sizes.contentWidth}>
        <div
          className="qs-grid-responsive"
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${Math.min(4, Math.max(2, cols))}, 1fr)`,
            gap: '0.85rem',
          }}
        >
          {cards.map((card, idx) => {
            const imgUrl = sanitizeExternalUrl(card.imageUrl)
            const targetHref = sanitizeHref(card.href)
            const hasTag = typeof card.filterTag === 'string' && card.filterTag.trim().length > 0

            const inner = (
              <div
                style={{
                  position: 'relative',
                  aspectRatio: '4/3',
                  overflow: 'hidden',
                  borderRadius: 'var(--radius-media)',
                  border: isFramed ? '1px solid currentColor' : 'var(--card-border)',
                  backgroundColor: 'rgba(128,128,128,0.12)',
                }}
              >
                {imgUrl && (
                  <img
                    src={imgUrl}
                    alt={card.title}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                  />
                )}
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 55%)',
                  }}
                />
                <div style={{ position: 'absolute', left: '1.5rem', bottom: '1.35rem', right: '1.5rem', color: '#ffffff' }}>
                  <h3 style={{ margin: '0 0 0.25rem', fontSize: 'var(--text-3xl)', fontWeight: 700, color: '#ffffff' }}>
                    {card.title}
                  </h3>
                  <span style={{ fontSize: 'var(--text-xs)', letterSpacing: '0.16em', textTransform: 'uppercase', fontWeight: 600, opacity: 0.9 }}>
                    {card.ctaLabel || 'VER COLECCIÓN'}
                  </span>
                </div>
              </div>
            )

            if (hasTag) {
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    window.dispatchEvent(
                      new CustomEvent('qs:filter-works', { detail: { tag: card.filterTag!.trim() } })
                    )
                  }}
                  style={{
                    border: 'none',
                    padding: 0,
                    background: 'transparent',
                    textAlign: 'left',
                    cursor: 'pointer',
                    color: 'inherit',
                  }}
                >
                  {inner}
                </button>
              )
            }

            return (
              <a
                key={idx}
                href={targetHref ?? '#artworks'}
                style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}
              >
                {inner}
              </a>
            )
          })}
        </div>
      </ContentWrapper>
    </section>
  )
}
