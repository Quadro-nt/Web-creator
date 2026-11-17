import Image from 'next/image'
import Link from 'next/link'
import type { CSSProperties } from 'react'
import type { SiteConfig } from '@/lib/schemas/site-config.schema'
import type { Artwork } from '@/lib/schemas/works.schema'

type SectionConfig = SiteConfig['sections'][number]

type Props = {
  section: SectionConfig
  works: Artwork[]
  artistSlug: string
}

const artworkSizeMap: Record<string, string> = {
  small: '200px',
  medium: '320px',
  large: '480px',
}

export default function ArtworksSection({ section, works, artistSlug }: Props) {
  const columns = (section.content.columns as string) ?? '3'
  const artworkSize = (section.content.artworkSize as string) ?? 'medium'
  const imgSize = artworkSizeMap[artworkSize] ?? '320px'
  const colCount = parseInt(columns, 10)

  if (section.variant === 'carousel') {
    return (
      <section
        style={{
          padding: '4rem 2rem',
          backgroundColor: 'var(--color-bg)',
          color: 'var(--color-text)',
        }}
      >
        <div
          style={{
            display: 'flex',
            gap: '1.5rem',
            overflowX: 'auto',
            scrollSnapType: 'x mandatory',
            paddingBottom: '1rem',
          }}
        >
          {works.map((work) => (
            <ArtworkCard
              key={work.slug}
              work={work}
              artistSlug={artistSlug}
              style={{
                flex: `0 0 ${imgSize}`,
                scrollSnapAlign: 'start',
              }}
            />
          ))}
        </div>
      </section>
    )
  }

  if (section.variant === 'list') {
    return (
      <section
        style={{
          padding: '4rem 2rem',
          maxWidth: '900px',
          margin: '0 auto',
          backgroundColor: 'var(--color-bg)',
          color: 'var(--color-text)',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>
          {works.map((work) => (
            <Link
              key={work.slug}
              href={`/obras/${work.slug}`}
              style={{
                display: 'grid',
                gridTemplateColumns: `${imgSize} 1fr`,
                gap: '2rem',
                textDecoration: 'none',
                color: 'inherit',
              }}
            >
              <div style={{ position: 'relative', aspectRatio: '1' }}>
                <Image
                  src={work.images[0]}
                  alt={work.title}
                  fill
                  unoptimized
                  style={{ objectFit: 'cover' }}
                />
              </div>
              <div>
                <h3 style={{ margin: '0 0 0.5rem', fontWeight: 400 }}>{work.title}</h3>
                <p style={{ margin: '0 0 0.25rem', opacity: 0.6, fontSize: '0.9rem' }}>
                  {work.medium}, {work.year}
                </p>
                <p style={{ margin: 0, opacity: 0.5, fontSize: '0.85rem' }}>{work.dimensions}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>
    )
  }

  if (section.variant === 'mosaic') {
    return (
      <section
        style={{
          padding: '4rem 2rem',
          backgroundColor: 'var(--color-bg)',
          color: 'var(--color-text)',
        }}
      >
        <div
          style={{
            columnCount: colCount,
            columnGap: '1rem',
          }}
        >
          {works.map((work) => (
            <Link
              key={work.slug}
              href={`/obras/${work.slug}`}
              style={{
                display: 'block',
                marginBottom: '1rem',
                breakInside: 'avoid',
                textDecoration: 'none',
                color: 'inherit',
              }}
            >
              <div style={{ position: 'relative', width: '100%', paddingBottom: '75%' }}>
                <Image
                  src={work.images[0]}
                  alt={work.title}
                  fill
                  unoptimized
                  style={{ objectFit: 'cover' }}
                />
              </div>
            </Link>
          ))}
        </div>
      </section>
    )
  }

  // Default: 'grid'
  return (
    <section
      style={{
        padding: '4rem 2rem',
        backgroundColor: 'var(--color-bg)',
        color: 'var(--color-text)',
      }}
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${colCount}, 1fr)`,
          gap: '1.5rem',
        }}
      >
        {works.map((work) => (
          <ArtworkCard key={work.slug} work={work} artistSlug={artistSlug} />
        ))}
      </div>
    </section>
  )
}

type ArtworkCardProps = {
  work: Artwork
  artistSlug: string
  style?: CSSProperties
}

function ArtworkCard({ work, artistSlug, style }: ArtworkCardProps) {
  return (
    <Link
      href={`/obras/${work.slug}`}
      style={{ textDecoration: 'none', color: 'inherit', display: 'block', ...style }}
    >
      <div style={{ position: 'relative', aspectRatio: '1', overflow: 'hidden' }}>
        <Image
          src={work.images[0]}
          alt={work.title}
          fill
          unoptimized
          style={{ objectFit: 'cover' }}
        />
      </div>
      <div style={{ padding: '0.75rem 0' }}>
        <p style={{ margin: '0 0 0.25rem', fontWeight: 400, fontSize: '0.95rem' }}>{work.title}</p>
        <p style={{ margin: 0, opacity: 0.5, fontSize: '0.8rem' }}>
          {work.medium}, {work.year}
        </p>
      </div>
    </Link>
  )
}
