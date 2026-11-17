import Image from 'next/image'
import type { SiteConfig } from '@/lib/schemas/site-config.schema'

type SectionConfig = SiteConfig['sections'][number]

type Props = {
  section: SectionConfig
  config: SiteConfig
}

export default function ImmersiveCover({ section, config }: Props) {
  const { siteTitle, coverImageUrl } = config.identity

  if (section.variant === 'fullscreen-video') {
    return (
      <div
        style={{
          position: 'relative',
          width: '100%',
          height: '100%',
          backgroundColor: '#000',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
        }}
      >
        {coverImageUrl && (
          <Image
            src={coverImageUrl}
            alt={siteTitle}
            fill
            unoptimized
            style={{ objectFit: 'cover', opacity: 0.5 }}
          />
        )}
        <div
          style={{
            position: 'relative',
            zIndex: 1,
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '2.5rem',
          }}
        >
          <h1
            style={{
              fontSize: 'clamp(3rem, 8vw, 7rem)',
              fontWeight: 300,
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              color: '#f0f0f0',
              margin: 0,
              lineHeight: 1,
            }}
          >
            {siteTitle}
          </h1>
          <button
            aria-label="Reproducir video"
            style={{
              width: '72px',
              height: '72px',
              borderRadius: '50%',
              border: '2px solid rgba(240,240,240,0.6)',
              backgroundColor: 'transparent',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#f0f0f0',
              fontSize: '1.5rem',
            }}
          >
            ▶
          </button>
        </div>
      </div>
    )
  }

  if (section.variant === 'parallax') {
    return (
      <div
        style={{
          position: 'relative',
          width: '100%',
          height: '100%',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'flex-end',
        }}
      >
        {coverImageUrl && (
          <div
            style={{
              position: 'absolute',
              inset: '-20%',
              backgroundImage: `url(${coverImageUrl})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundAttachment: 'fixed',
            }}
          />
        )}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(to top, rgba(10,10,10,0.9) 0%, transparent 60%)',
          }}
        />
        <div
          style={{
            position: 'relative',
            zIndex: 1,
            padding: '4rem 5rem',
          }}
        >
          <span
            style={{
              fontSize: '0.7rem',
              letterSpacing: '0.4em',
              textTransform: 'uppercase',
              opacity: 0.4,
              display: 'block',
              marginBottom: '1.5rem',
              color: '#f0f0f0',
            }}
          >
            Portfolio
          </span>
          <h1
            style={{
              fontSize: 'clamp(3rem, 7vw, 6rem)',
              fontWeight: 300,
              letterSpacing: '0.08em',
              color: '#f0f0f0',
              margin: 0,
              lineHeight: 1,
            }}
          >
            {siteTitle}
          </h1>
        </div>
      </div>
    )
  }

  if (section.variant === 'split-dark') {
    return (
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          width: '100%',
          height: '100%',
          backgroundColor: '#0a0a0a',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            padding: '5rem',
            borderRight: '1px solid rgba(240,240,240,0.08)',
          }}
        >
          <span
            style={{
              fontSize: '0.7rem',
              letterSpacing: '0.4em',
              textTransform: 'uppercase',
              color: 'var(--color-accent)',
              display: 'block',
              marginBottom: '2rem',
            }}
          >
            Arte
          </span>
          <h1
            style={{
              fontSize: 'clamp(3.5rem, 6vw, 6rem)',
              fontWeight: 700,
              lineHeight: 0.9,
              letterSpacing: '-0.02em',
              color: '#f0f0f0',
              margin: 0,
            }}
          >
            {siteTitle}
          </h1>
        </div>
        {coverImageUrl ? (
          <div style={{ position: 'relative', overflow: 'hidden' }}>
            <Image
              src={coverImageUrl}
              alt={siteTitle}
              fill
              unoptimized
              style={{ objectFit: 'cover', filter: 'brightness(0.75)' }}
            />
          </div>
        ) : (
          <div style={{ backgroundColor: '#111' }} />
        )}
      </div>
    )
  }

  // Default: 'cinematic'
  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        backgroundColor: '#000',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {coverImageUrl && (
        <Image
          src={coverImageUrl}
          alt={siteTitle}
          fill
          unoptimized
          style={{ objectFit: 'cover', filter: 'brightness(0.4)' }}
        />
      )}
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          textAlign: 'center',
          padding: '2rem',
        }}
      >
        <span
          style={{
            fontSize: '0.65rem',
            letterSpacing: '0.5em',
            textTransform: 'uppercase',
            color: 'var(--color-accent)',
            display: 'block',
            marginBottom: '2rem',
          }}
        >
          — Portfolio —
        </span>
        <h1
          style={{
            fontSize: 'clamp(3.5rem, 9vw, 8rem)',
            fontWeight: 300,
            letterSpacing: '0.1em',
            color: '#f0f0f0',
            margin: 0,
            lineHeight: 1,
          }}
        >
          {siteTitle}
        </h1>
        <div
          style={{
            width: '60px',
            height: '1px',
            backgroundColor: 'var(--color-accent)',
            margin: '2.5rem auto 0',
          }}
        />
      </div>
    </div>
  )
}
