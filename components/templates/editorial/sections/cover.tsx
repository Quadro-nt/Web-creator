import Image from 'next/image'
import type { SiteConfig } from '@/lib/schemas/site-config.schema'

type SectionConfig = SiteConfig['sections'][number]

type Props = {
  section: SectionConfig
  config: SiteConfig
}

export default function Cover({ section, config }: Props) {
  const { siteTitle, coverImageUrl } = config.identity

  if (section.variant === 'magazine') {
    return (
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '3fr 2fr',
          minHeight: '90vh',
          backgroundColor: 'var(--color-bg)',
          color: 'var(--color-text)',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-end',
            padding: '5rem 4rem 5rem 5rem',
            borderRight: '1px solid rgba(0,0,0,0.12)',
          }}
        >
          <span
            style={{
              fontSize: '0.75rem',
              letterSpacing: '0.3em',
              textTransform: 'uppercase',
              opacity: 0.4,
              marginBottom: '1.5rem',
              display: 'block',
            }}
          >
            Portfolio
          </span>
          <h1
            style={{
              fontSize: 'clamp(3.5rem, 8vw, 7rem)',
              fontWeight: 700,
              lineHeight: 0.9,
              letterSpacing: '-0.02em',
              margin: 0,
            }}
          >
            {siteTitle}
          </h1>
        </div>
        {coverImageUrl && (
          <div style={{ position: 'relative', overflow: 'hidden' }}>
            <Image
              src={coverImageUrl}
              alt={siteTitle}
              fill
              unoptimized
              style={{ objectFit: 'cover' }}
            />
          </div>
        )}
      </div>
    )
  }

  if (section.variant === 'headline') {
    return (
      <div
        style={{
          backgroundColor: 'var(--color-bg)',
          color: 'var(--color-text)',
          padding: '8rem 5rem 6rem',
          borderBottom: '3px solid var(--color-text)',
        }}
      >
        <div style={{ maxWidth: '66vw' }}>
          <span
            style={{
              fontSize: '0.75rem',
              letterSpacing: '0.3em',
              textTransform: 'uppercase',
              opacity: 0.4,
              display: 'block',
              marginBottom: '2rem',
            }}
          >
            — Arte
          </span>
          <h1
            style={{
              fontSize: 'clamp(4rem, 11vw, 10rem)',
              fontWeight: 800,
              lineHeight: 0.85,
              letterSpacing: '-0.03em',
              margin: 0,
            }}
          >
            {siteTitle}
          </h1>
        </div>
      </div>
    )
  }

  if (section.variant === 'poster') {
    return (
      <div
        style={{
          position: 'relative',
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'flex-end',
          backgroundColor: 'var(--color-bg)',
        }}
      >
        {coverImageUrl && (
          <Image
            src={coverImageUrl}
            alt={siteTitle}
            fill
            unoptimized
            style={{ objectFit: 'cover', zIndex: 0 }}
          />
        )}
        <div
          style={{
            position: 'relative',
            zIndex: 1,
            margin: '3rem',
            padding: '2.5rem 3rem',
            backgroundColor: 'rgba(245,240,232,0.88)',
            backdropFilter: 'blur(4px)',
            maxWidth: '480px',
          }}
        >
          <span
            style={{
              fontSize: '0.7rem',
              letterSpacing: '0.3em',
              textTransform: 'uppercase',
              opacity: 0.5,
              display: 'block',
              marginBottom: '1rem',
            }}
          >
            — Portfolio
          </span>
          <h1
            style={{
              fontSize: 'clamp(2.5rem, 5vw, 4.5rem)',
              fontWeight: 700,
              lineHeight: 0.95,
              letterSpacing: '-0.02em',
              margin: 0,
              color: 'var(--color-text)',
            }}
          >
            {siteTitle}
          </h1>
        </div>
      </div>
    )
  }

  // Default: 'typographic'
  return (
    <div
      style={{
        backgroundColor: 'var(--color-bg)',
        color: 'var(--color-text)',
        minHeight: '70vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '6rem 5rem',
      }}
    >
      <div
        style={{
          borderTop: '3px solid var(--color-accent)',
          paddingTop: '2rem',
          display: 'inline-block',
        }}
      >
        <h1
          style={{
            fontSize: 'clamp(4rem, 10vw, 9rem)',
            fontWeight: 800,
            lineHeight: 0.85,
            letterSpacing: '-0.03em',
            margin: 0,
          }}
        >
          {siteTitle}
        </h1>
      </div>
      <div
        style={{
          marginTop: '3rem',
          borderTop: '1px solid rgba(0,0,0,0.15)',
          paddingTop: '1.5rem',
          display: 'flex',
          gap: '3rem',
          opacity: 0.4,
          fontSize: '0.75rem',
          letterSpacing: '0.2em',
          textTransform: 'uppercase',
        }}
      >
        <span>Arte</span>
        <span>—</span>
        <span>Portfolio</span>
        <span>—</span>
        <span>Obras originales</span>
      </div>
    </div>
  )
}
