'use client'

import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import Link from 'next/link'
import type { SectionConfig, SiteConfig } from '@/lib/schemas/site-config.schema'
import type { Artwork } from '@/lib/schemas/works.schema'
import { ArtworkFrame } from '@/components/ArtworkFrame'
import { ContentWrapper } from '@/components/ContentWrapper'

type Props = {
  section: SectionConfig
  works: Artwork[]
  artistSlug: string
  config?: SiteConfig
  templateVariant?: 'minimal-gallery' | 'editorial' | 'immersive'
}

type SortOption = 'featured' | 'newest' | 'price-asc' | 'price-desc' | 'alpha'

const artworkSizeMap: Record<string, string> = {
  small: '200px',
  medium: '320px',
  large: '440px',
}

function formatPrice(price: number, currency: Artwork['currency']): string {
  const prefix = currency === 'USD' ? 'USD' : 'S/'
  return `${prefix} ${new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(price)}`
}

export default function InteractiveArtworksGrid({
  section,
  works,
  config,
  templateVariant = 'minimal-gallery',
}: Props) {
  const initialTag =
    typeof section.content.filterTag === 'string' ? section.content.filterTag.trim() : ''
  const [selectedTag, setSelectedTag] = useState<string>(initialTag)
  const [onlyAvailable, setOnlyAvailable] = useState<boolean>(section.content.showSold === false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchVisible, setSearchVisible] = useState(Boolean(section.content.enableSearch))
  const [sortBy, setSortBy] = useState<SortOption>('featured')
  const searchInputRef = useRef<HTMLInputElement | null>(null)
  const sectionRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    setSelectedTag(initialTag)
  }, [initialTag])

  useEffect(() => {
    setOnlyAvailable(section.content.showSold === false)
  }, [section.content.showSold])

  useEffect(() => {
    const onFilterEvent = (e: Event) => {
      const detail = (e as CustomEvent<{ tag?: string }>).detail
      if (typeof detail?.tag === 'string') {
        setSelectedTag(detail.tag)
        sectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    }
    const onFocusSearch = () => {
      setSearchVisible(true)
      sectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      window.setTimeout(() => searchInputRef.current?.focus(), 200)
    }
    window.addEventListener('qs:filter-works', onFilterEvent)
    window.addEventListener('qs:focus-search', onFocusSearch)
    return () => {
      window.removeEventListener('qs:filter-works', onFilterEvent)
      window.removeEventListener('qs:focus-search', onFocusSearch)
    }
  }, [])

  const uniqueTags = useMemo(() => {
    const set = new Set<string>()
    for (const w of works) {
      for (const t of w.tags) {
        if (t.trim()) set.add(t.trim())
      }
    }
    return Array.from(set)
  }, [works])

  const filteredWorks = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    const tagLower = selectedTag.trim().toLowerCase()
    const list = works.filter((w) => {
      if (onlyAvailable && w.sold) return false
      if (tagLower && !w.tags.some((t) => t.toLowerCase().includes(tagLower))) return false
      if (q) {
        const hay = `${w.title} ${w.medium} ${w.year} ${w.tags.join(' ')}`.toLowerCase()
        if (!hay.includes(q)) return false
      }
      return true
    })

    if (sortBy === 'newest') {
      return [...list].sort((a, b) => b.year - a.year)
    }
    if (sortBy === 'price-asc') {
      return [...list].sort((a, b) => (a.price ?? Number.MAX_SAFE_INTEGER) - (b.price ?? Number.MAX_SAFE_INTEGER))
    }
    if (sortBy === 'price-desc') {
      return [...list].sort((a, b) => (b.price ?? -1) - (a.price ?? -1))
    }
    if (sortBy === 'alpha') {
      return [...list].sort((a, b) => a.title.localeCompare(b.title))
    }
    return list
  }, [onlyAvailable, searchQuery, selectedTag, sortBy, works])

  const columns = (section.content.columns as string) ?? config?.sizes.columns ?? '3'
  const artworkSize = (section.content.artworkSize as string) ?? config?.sizes.artworkSize ?? 'medium'
  const imgSize = artworkSizeMap[artworkSize] ?? '320px'
  const colCount = parseInt(columns, 10) || 3
  const title = (section.content.title as string) ?? (templateVariant === 'minimal-gallery' ? '' : 'Obras')
  const subtitle = (section.content.subtitle as string) ?? ''
  const showPrices = Boolean(section.content.showPrices)
  const showFiltersBar = Boolean(section.content.enableFilters) || Boolean(section.content.enableSearch) || searchVisible

  const treatment = config?.styleTokens.artworkTreatment ?? (templateVariant === 'immersive' ? 'bleed' : 'margin')
  const contentWidth = config?.sizes.contentWidth ?? (templateVariant === 'minimal-gallery' ? 'mid' : 'full')
  const hoverEffect = config?.animations.hoverEffect ?? 'none'
  const hoverClass = hoverEffect === 'zoom' ? 'qs-hover-zoom' : hoverEffect === 'info' ? 'qs-hover-info' : ''

  const headingNode =
    title || subtitle ? (
      <div style={{ marginBottom: '1.75rem' }}>
        {title && (
          <h2
            style={{
              margin: '0 0 0.4rem',
              fontSize: templateVariant === 'editorial' ? 'var(--text-3xl)' : 'var(--text-2xl)',
              fontWeight: templateVariant === 'editorial' ? 700 : 300,
              color: templateVariant === 'immersive' ? 'var(--color-accent)' : undefined,
            }}
          >
            {title}
          </h2>
        )}
        {subtitle && <p style={{ margin: 0, opacity: 0.68, fontSize: 'var(--text-sm)' }}>{subtitle}</p>}
      </div>
    ) : null

  const controlsBar = showFiltersBar ? (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '0.85rem',
        marginBottom: '2rem',
        paddingBottom: '1rem',
        borderBottom: '1px solid rgba(128,128,128,0.2)',
      }}
    >
      {(Boolean(section.content.enableFilters) && uniqueTags.length > 0) && (
        <div style={{ display: 'flex', gap: '0.45rem', flexWrap: 'wrap' }}>
          <FilterPill active={!selectedTag} onClick={() => setSelectedTag('')}>
            Todas ({works.length})
          </FilterPill>
          {uniqueTags.map((tag) => (
            <FilterPill
              key={tag}
              active={selectedTag.toLowerCase() === tag.toLowerCase()}
              onClick={() => setSelectedTag(tag)}
            >
              {tag}
            </FilterPill>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', flexWrap: 'wrap' }}>
          {(Boolean(section.content.enableSearch) || searchVisible) && (
            <input
              ref={searchInputRef}
              type="search"
              aria-label="Buscar obra por título o técnica"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar obra o técnica…"
              style={{
                padding: '0.45rem 0.75rem',
                border: '1px solid currentColor',
                borderRadius: 'var(--radius-card)',
                background: 'transparent',
                color: 'inherit',
                fontSize: 'var(--text-sm)',
                minWidth: '210px',
              }}
            />
          )}
          <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: 'var(--text-xs)', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={onlyAvailable}
              onChange={(e) => setOnlyAvailable(e.target.checked)}
            />
            Solo disponibles
          </label>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <span style={{ fontSize: 'var(--text-xs)', opacity: 0.65 }}>
            {filteredWorks.length} {filteredWorks.length === 1 ? 'obra' : 'obras'}
          </span>
          <select
            aria-label="Ordenar obras"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            style={{
              padding: '0.4rem 0.6rem',
              border: '1px solid currentColor',
              borderRadius: 'var(--radius-card)',
              background: 'var(--color-bg)',
              color: 'var(--color-text)',
              fontSize: 'var(--text-xs)',
            }}
          >
            <option value="featured">Destacadas</option>
            <option value="newest">Más recientes</option>
            <option value="price-asc">Menor precio</option>
            <option value="price-desc">Mayor precio</option>
            <option value="alpha">A – Z</option>
          </select>
        </div>
      </div>
    </div>
  ) : null

  return (
    <section
      ref={sectionRef}
      className="qs-section-pad"
      style={{
        padding: templateVariant === 'minimal-gallery' ? '4rem 2rem' : '5rem 2rem',
        backgroundColor: 'var(--color-bg)',
        color: 'var(--color-text)',
      }}
    >
      <ContentWrapper width={contentWidth}>
        {headingNode}
        {controlsBar}

        {filteredWorks.length === 0 ? (
          <div style={{ padding: '2.5rem', textAlign: 'center', opacity: 0.6, border: '1px dashed currentColor', borderRadius: 'var(--radius-card)' }}>
            No hay obras que coincidan con los filtros seleccionados.
          </div>
        ) : section.variant === 'carousel' ? (
          <div style={{ display: 'flex', gap: '1.25rem', overflowX: 'auto', scrollSnapType: 'x mandatory', paddingBottom: '1rem' }}>
            {filteredWorks.map((work) => (
              <ArtworkCard
                key={work.slug}
                work={work}
                treatment={treatment}
                hoverClass={hoverClass}
                showPrices={showPrices}
                style={{ flex: `0 0 ${imgSize}`, scrollSnapAlign: 'start' }}
              />
            ))}
          </div>
        ) : section.variant === 'list' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2.25rem' }}>
            {filteredWorks.map((work) => (
              <Link
                key={work.slug}
                href={`/obras/${work.slug}`}
                className="qs-split-responsive"
                style={{
                  display: 'grid',
                  gridTemplateColumns: `${imgSize} 1fr`,
                  gap: '2rem',
                  textDecoration: 'none',
                  color: 'inherit',
                  alignItems: 'center',
                }}
              >
                <ArtworkFrame treatment={treatment} className={hoverClass}>
                  <WorkThumbnail work={work} />
                </ArtworkFrame>
                <div>
                  <h3 style={{ margin: '0 0 0.45rem', fontWeight: 500, fontSize: 'var(--text-xl)' }}>{work.title}</h3>
                  <p style={{ margin: '0 0 0.25rem', opacity: 0.65, fontSize: 'var(--text-sm)' }}>
                    {work.medium}, {work.year}
                  </p>
                  <p style={{ margin: 0, opacity: 0.5, fontSize: 'var(--text-xs)' }}>{work.dimensions}</p>
                  {showPrices && work.price !== undefined && !work.sold && (
                    <p style={{ margin: '0.5rem 0 0', fontSize: 'var(--text-sm)', fontWeight: 600 }}>
                      {formatPrice(work.price, work.currency)}
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        ) : section.variant === 'mosaic' || section.variant === 'masonry' ? (
          <div style={{ columnCount: colCount, columnGap: '1rem' }}>
            {filteredWorks.map((work) => (
              <Link
                key={work.slug}
                href={`/obras/${work.slug}`}
                style={{ display: 'block', marginBottom: '1rem', breakInside: 'avoid', textDecoration: 'none', color: 'inherit' }}
              >
                <ArtworkFrame treatment={treatment} className={hoverClass}>
                  <WorkThumbnail work={work} aspectRatio="4/3" />
                </ArtworkFrame>
                <p style={{ margin: '0.45rem 0 0', fontSize: 'var(--text-sm)', fontWeight: 500 }}>{work.title}</p>
              </Link>
            ))}
          </div>
        ) : (
          <div
            className="qs-grid-responsive"
            style={{
              display: 'grid',
              gridTemplateColumns: `repeat(${colCount}, 1fr)`,
              gap: 'var(--spacing-md)',
            }}
          >
            {filteredWorks.map((work) => (
              <ArtworkCard
                key={work.slug}
                work={work}
                treatment={treatment}
                hoverClass={hoverClass}
                showPrices={showPrices}
              />
            ))}
          </div>
        )}
      </ContentWrapper>
    </section>
  )
}

function FilterPill({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: '0.35rem 0.9rem',
        borderRadius: '9999px',
        border: '1px solid currentColor',
        backgroundColor: active ? 'var(--color-text)' : 'transparent',
        color: active ? 'var(--color-bg)' : 'var(--color-text)',
        fontSize: 'var(--text-xs)',
        fontWeight: 600,
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
        cursor: 'pointer',
      }}
    >
      {children}
    </button>
  )
}

function WorkThumbnail({ work, aspectRatio = '1' }: { work: Artwork; aspectRatio?: string }) {
  const [hovered, setHovered] = useState(false)
  const secondaryImg = work.images.length > 1 ? work.images[1] : null
  const activeSrc = hovered && secondaryImg ? secondaryImg : work.images[0]

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: 'relative',
        aspectRatio,
        overflow: 'hidden',
        borderRadius: 'var(--radius-media)',
        backgroundColor: 'rgba(128,128,128,0.08)',
      }}
    >
      <img
        src={activeSrc}
        alt={work.title}
        data-artwork-image="true"
        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
      />
      {work.sold && (
        <span
          style={{
            position: 'absolute',
            left: '0.65rem',
            bottom: '0.65rem',
            padding: '0.2rem 0.6rem',
            borderRadius: '9999px',
            backgroundColor: 'var(--color-text)',
            color: 'var(--color-bg)',
            fontSize: '0.68rem',
            fontWeight: 700,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
          }}
        >
          Vendida
        </span>
      )}
    </div>
  )
}

function ArtworkCard({
  work,
  treatment,
  hoverClass,
  showPrices,
  style,
}: {
  work: Artwork
  treatment: SiteConfig['styleTokens']['artworkTreatment']
  hoverClass: string
  showPrices: boolean
  style?: CSSProperties
}) {
  return (
    <Link
      href={`/obras/${work.slug}`}
      style={{ textDecoration: 'none', color: 'inherit', display: 'block', ...style }}
    >
      <ArtworkFrame treatment={treatment} className={hoverClass}>
        <div style={{ position: 'relative' }}>
          <WorkThumbnail work={work} />
          {hoverClass === 'qs-hover-info' && (
            <div className="qs-hover-info-overlay">
              <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{work.title}</span>
              <span style={{ fontSize: '0.75rem', opacity: 0.8 }}>{work.year}</span>
            </div>
          )}
        </div>
      </ArtworkFrame>
      <div style={{ padding: '0.65rem 0.15rem' }}>
        <p style={{ margin: '0 0 0.25rem', fontWeight: 600, fontSize: 'var(--text-base)' }}>{work.title}</p>
        <p style={{ margin: 0, opacity: 0.65, fontSize: 'var(--text-xs)' }}>
          {work.medium}, {work.year}
          {showPrices && work.price !== undefined && !work.sold
            ? ` · ${formatPrice(work.price, work.currency)}`
            : ''}
        </p>
      </div>
    </Link>
  )
}
