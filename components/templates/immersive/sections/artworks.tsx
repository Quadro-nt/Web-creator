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
  small: '220px',
  medium: '340px',
  large: '500px',
}

export default function ImmersiveArtworks({ section, works, artistSlug }: Props) {
  const columns = (section.content.columns as string) ?? '3'
  const artworkSize = (section.content.artworkSize as string) ?? 'medium'
  const imgSize = artworkSizeMap[artworkSize] ?? '340px'
  const colCount = parseInt(columns, 10)

  if (section.variant === 'carousel') {
    return (
      <div
        style={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: 'var(--color-bg)',
          color: 'var(--color-text)',
          padding: '4rem 0',
        }}
      >
        <div style={{ padding: '0 5rem', marginBottom: '2.5rem' }}>
          <h2
            style={{
              fontSize: 'clamp(1.5rem, 3vw, 2.5rem)',
              fontWeight: 300,
              letterSpacing: '0.3em',
              textTransform: 'uppercase',
              margin: 0,
              color: 'var(--color-accent)',
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
            flex: 1,
            paddingBottom: '0.5rem',
          }}
        >
          {works.map((work) => (
            <ImmersiveCard
              key={work.slug}
              work={work}
              artistSlug={artistSlug}
              style={{ flex: `0 0 ${imgSize}`, scrollSnapAlign: 'start', height: '100%' }}
            />
          ))}
        </div>
      </div>
    )
  }

  if (section.variant === 'list') {
    return (
      <div
        style={{
          minHeight: '100%',
          backgroundColor: 'var(--color-bg)',
          color: 'var(--color-text)',
          padding: '5rem',
          overflowY: 'auto',
        }}
      >
        <h2
          style={{
            fontSize: 'clamp(1.5rem, 3vw, 2.5rem)',
            fontWeight: 300,
            letterSpacing: '0.3em',
            textTransform: 'uppercase',
            margin: '0 0 3rem',
            color: 'var(--color-accent)',
          }}
        >
          Obras
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {works.map((work, i) => (
            <Link
              key={work.slug}
              href={`/obras/${work.slug}`}
              style={{
                display: 'grid',
                gridTemplateColumns: `${imgSize} 1fr`,
                gap: '3rem',
                alignItems: 'center',
                textDecoration: 'none',
                color: 'inherit',
                padding: '2rem 0',
                borderTop: i === 0
                  ? '1px solid rgba(240,240,240,0.15)'
                  : '1px solid rgba(240,240,240,0.07)',
              }}
            >
              <div
                style={{
                  position: 'relative',
                  aspectRatio: '4/3',
                  overflow: 'hidden',
                  filter: 'brightness(0.8)',
                }}
              >
                <Image
                  src={work.images[0]}
                  alt={work.title}
                  fill
                  unoptimized
                  style={{ objectFit: 'cover', transition: 'transform 0.4s ease' }}
                />
              </div>
              <div>
                <h3
                  style={{
                    margin: '0 0 0.75rem',
                    fontWeight: 300,
                    fontSize: 'clamp(1.2rem, 2.5vw, 2rem)',
                    letterSpacing: '0.02em',
                    color: '#f0f0f0',
                  }}
                >
                  {work.title}
                </h3>
                <p
                  style={{
                    margin: '0 0 0.3rem',
                    opacity: 0.4,
                    fontSize: '0.8rem',
                    letterSpacing: '0.15em',
                    textTransform: 'uppercase',
                  }}
                >
                  {work.medium} — {work.year}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    )
  }

  if (section.variant === 'mosaic') {
    return (
      <div
        style={{
          minHeight: '100%',
          backgroundColor: 'var(--color-bg)',
          color: 'var(--color-text)',
          padding: '4rem 2rem',
          overflowY: 'auto',
        }}
      >
        <div style={{ padding: '0 2rem', marginBottom: '2rem' }}>
          <h2
            style={{
              fontSize: 'clamp(1.5rem, 3vw, 2.5rem)',
              fontWeight: 300,
              letterSpacing: '0.3em',
              textTransform: 'uppercase',
              margin: 0,
              color: 'var(--color-accent)',
            }}
          >
            Obras
          </h2>
        </div>
        <div style={{ columnCount: colCount, columnGap: '2px' }}>
          {works.map((work) => (
            <Link
              key={work.slug}
              href={`/obras/${work.slug}`}
              style={{
                display: 'block',
                marginBottom: '2px',
                breakInside: 'avoid',
                textDecoration: 'none',
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
                  style={{ objectFit: 'cover', filter: 'brightness(0.75)' }}
                />
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'linear-gradient(to top, rgba(10,10,10,0.8) 0%, transparent 50%)',
                  }}
                />
                <div
                  style={{
                    position: 'absolute',
                    bottom: '1rem',
                    left: '1rem',
                    right: '1rem',
                  }}
                >
                  <p
                    style={{
                      margin: 0,
                      color: '#f0f0f0',
                      fontSize: '0.9rem',
                      fontWeight: 400,
                      letterSpacing: '0.02em',
                    }}
                  >
                    {work.title}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    )
  }

  // Default: 'grid'
  return (
    <div
      style={{
        minHeight: '100%',
        backgroundColor: 'var(--color-bg)',
        color: 'var(--color-text)',
        padding: '4rem 4rem',
        overflowY: 'auto',
      }}
    >
      <h2
        style={{
          fontSize: 'clamp(1.5rem, 3vw, 2.5rem)',
          fontWeight: 300,
          letterSpacing: '0.3em',
          textTransform: 'uppercase',
          margin: '0 0 2.5rem',
          color: 'var(--color-accent)',
        }}
      >
        Obras
      </h2>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${colCount}, 1fr)`,
          gap: '2px',
        }}
      >
        {works.map((work) => (
          <ImmersiveCard key={work.slug} work={work} artistSlug={artistSlug} />
        ))}
      </div>
    </div>
  )
}

type ImmersiveCardProps = {
  work: Artwork
  artistSlug: string
  style?: CSSProperties
}

function ImmersiveCard({ work, artistSlug, style }: ImmersiveCardProps) {
  return (
    <Link
      href={`/obras/${work.slug}`}
      style={{
        display: 'block',
        textDecoration: 'none',
        color: 'inherit',
        position: 'relative',
        overflow: 'hidden',
        ...style,
      }}
    >
      <div style={{ position: 'relative', aspectRatio: '1', overflow: 'hidden' }}>
        <Image
          src={work.images[0]}
          alt={work.title}
          fill
          unoptimized
          style={{ objectFit: 'cover', filter: 'brightness(0.7)' }}
        />
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(to top, rgba(10,10,10,0.85) 0%, transparent 55%)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '1.25rem',
            left: '1.25rem',
            right: '1.25rem',
          }}
        >
          <p
            style={{
              margin: 0,
              color: '#f0f0f0',
              fontWeight: 400,
              fontSize: '0.95rem',
              letterSpacing: '0.02em',
            }}
          >
            {work.title}
          </p>
          <p style={{ margin: '0.25rem 0 0', color: 'rgba(240,240,240,0.5)', fontSize: '0.75rem' }}>
            {work.medium}, {work.year}
          </p>
        </div>
      </div>
    </Link>
  )
}
