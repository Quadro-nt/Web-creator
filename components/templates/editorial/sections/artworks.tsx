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
          padding: '5rem 0',
          backgroundColor: 'var(--color-bg)',
          color: 'var(--color-text)',
          borderTop: '1px solid rgba(0,0,0,0.1)',
        }}
      >
        <div style={{ padding: '0 5rem', marginBottom: '2rem' }}>
          <h2
            style={{
              fontSize: 'clamp(2rem, 4vw, 3.5rem)',
              fontWeight: 700,
              letterSpacing: '-0.02em',
              margin: 0,
            }}
          >
            Obras
          </h2>
        </div>
        <div
          style={{
            display: 'flex',
            gap: '2px',
            overflowX: 'auto',
            scrollSnapType: 'x mandatory',
            paddingBottom: '0.5rem',
          }}
        >
          {works.map((work) => (
            <EditorialCard
              key={work.slug}
              work={work}
              artistSlug={artistSlug}
              style={{
                flex: `0 0 ${imgSize}`,
                scrollSnapAlign: 'start',
              }}
              showCaption
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
          padding: '5rem 5rem',
          backgroundColor: 'var(--color-bg)',
          color: 'var(--color-text)',
          borderTop: '1px solid rgba(0,0,0,0.1)',
        }}
      >
        <h2
          style={{
            fontSize: 'clamp(2rem, 4vw, 3.5rem)',
            fontWeight: 700,
            letterSpacing: '-0.02em',
            margin: '0 0 3rem',
          }}
        >
          Obras
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
          {works.map((work, i) => (
            <Link
              key={work.slug}
              href={`/_sites/${artistSlug}/obras/${work.slug}`}
              style={{
                display: 'grid',
                gridTemplateColumns: `${imgSize} 1fr auto`,
                gap: '3rem',
                alignItems: 'center',
                textDecoration: 'none',
                color: 'inherit',
                padding: '2rem 0',
                borderTop: i === 0 ? '2px solid var(--color-text)' : '1px solid rgba(0,0,0,0.12)',
              }}
            >
              <div style={{ position: 'relative', aspectRatio: '4/3', overflow: 'hidden' }}>
                <Image
                  src={work.images[0]}
                  alt={work.title}
                  fill
                  unoptimized
                  style={{ objectFit: 'cover' }}
                />
              </div>
              <div>
                <h3
                  style={{
                    margin: '0 0 0.75rem',
                    fontWeight: 700,
                    fontSize: 'clamp(1.1rem, 2vw, 1.6rem)',
                    letterSpacing: '-0.01em',
                  }}
                >
                  {work.title}
                </h3>
                <p style={{ margin: '0 0 0.3rem', opacity: 0.5, fontSize: '0.85rem', letterSpacing: '0.08em' }}>
                  {work.medium} — {work.year}
                </p>
                <p style={{ margin: 0, opacity: 0.4, fontSize: '0.8rem' }}>{work.dimensions}</p>
              </div>
              <span
                style={{
                  fontSize: '0.7rem',
                  letterSpacing: '0.15em',
                  textTransform: 'uppercase',
                  opacity: 0.3,
                }}
              >
                Ver
              </span>
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
          padding: '5rem 2rem',
          backgroundColor: 'var(--color-bg)',
          color: 'var(--color-text)',
          borderTop: '1px solid rgba(0,0,0,0.1)',
        }}
      >
        <div style={{ padding: '0 3rem', marginBottom: '2rem' }}>
          <h2
            style={{
              fontSize: 'clamp(2rem, 4vw, 3.5rem)',
              fontWeight: 700,
              letterSpacing: '-0.02em',
              margin: 0,
            }}
          >
            Obras
          </h2>
        </div>
        <div
          style={{
            columnCount: colCount,
            columnGap: '3px',
          }}
        >
          {works.map((work) => (
            <Link
              key={work.slug}
              href={`/_sites/${artistSlug}/obras/${work.slug}`}
              style={{
                display: 'block',
                marginBottom: '3px',
                breakInside: 'avoid',
                textDecoration: 'none',
                color: 'inherit',
                position: 'relative',
                overflow: 'hidden',
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
              <div
                style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  padding: '1.5rem 1rem 0.75rem',
                  background: 'linear-gradient(to top, rgba(26,26,26,0.7), transparent)',
                }}
              >
                <p
                  style={{
                    margin: 0,
                    color: '#f5f0e8',
                    fontWeight: 600,
                    fontSize: '0.9rem',
                    letterSpacing: '-0.01em',
                  }}
                >
                  {work.title}
                </p>
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
        padding: '5rem 5rem',
        backgroundColor: 'var(--color-bg)',
        color: 'var(--color-text)',
        borderTop: '1px solid rgba(0,0,0,0.1)',
      }}
    >
      <h2
        style={{
          fontSize: 'clamp(2rem, 4vw, 3.5rem)',
          fontWeight: 700,
          letterSpacing: '-0.02em',
          margin: '0 0 3rem',
        }}
      >
        Obras
      </h2>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${colCount}, 1fr)`,
          gap: '3px',
        }}
      >
        {works.map((work) => (
          <EditorialCard key={work.slug} work={work} artistSlug={artistSlug} showCaption />
        ))}
      </div>
    </section>
  )
}

type EditorialCardProps = {
  work: Artwork
  artistSlug: string
  style?: CSSProperties
  showCaption?: boolean
}

function EditorialCard({ work, artistSlug, style, showCaption }: EditorialCardProps) {
  return (
    <Link
      href={`/_sites/${artistSlug}/obras/${work.slug}`}
      style={{ textDecoration: 'none', color: 'inherit', display: 'block', position: 'relative', ...style }}
    >
      <div style={{ position: 'relative', aspectRatio: '1', overflow: 'hidden' }}>
        <Image
          src={work.images[0]}
          alt={work.title}
          fill
          unoptimized
          style={{ objectFit: 'cover' }}
        />
        {showCaption && (
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              padding: '2rem 1.25rem 1rem',
              background: 'linear-gradient(to top, rgba(26,26,26,0.72), transparent)',
            }}
          >
            <p
              style={{
                margin: 0,
                color: '#f5f0e8',
                fontWeight: 700,
                fontSize: '0.95rem',
                letterSpacing: '-0.01em',
              }}
            >
              {work.title}
            </p>
            <p style={{ margin: '0.2rem 0 0', color: 'rgba(245,240,232,0.6)', fontSize: '0.75rem' }}>
              {work.medium}, {work.year}
            </p>
          </div>
        )}
      </div>
    </Link>
  )
}
