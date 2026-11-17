import Image from 'next/image'
import type { SiteConfig } from '@/lib/schemas/site-config.schema'

type SectionConfig = SiteConfig['sections'][number]

type Props = {
  section: SectionConfig
}

export default function ImmersiveBio({ section }: Props) {
  const text = (section.content.text as string) ?? ''
  const photoUrl = (section.content.photoUrl as string) ?? ''

  if (section.variant === 'with-photo') {
    return (
      <div
        style={{
          height: '100%',
          display: 'grid',
          gridTemplateColumns: photoUrl ? '1fr 1fr' : '1fr',
          backgroundColor: 'var(--color-bg)',
          color: 'var(--color-text)',
          overflow: 'hidden',
        }}
      >
        {photoUrl && (
          <div style={{ position: 'relative', overflow: 'hidden' }}>
            <Image
              src={photoUrl}
              alt="Artista"
              fill
              unoptimized
              style={{ objectFit: 'cover', filter: 'brightness(0.6) contrast(1.1)' }}
            />
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: 'linear-gradient(to right, transparent, rgba(10,10,10,0.3))',
              }}
            />
          </div>
        )}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            padding: '5rem',
            overflowY: 'auto',
          }}
        >
          <span
            style={{
              fontSize: '0.65rem',
              letterSpacing: '0.4em',
              textTransform: 'uppercase',
              color: 'var(--color-accent)',
              display: 'block',
              marginBottom: '2rem',
            }}
          >
            Sobre el artista
          </span>
          <p
            style={{
              fontSize: 'clamp(1rem, 1.8vw, 1.4rem)',
              lineHeight: 1.9,
              whiteSpace: 'pre-line',
              margin: 0,
              color: 'rgba(240,240,240,0.8)',
              fontWeight: 300,
            }}
          >
            {text}
          </p>
        </div>
      </div>
    )
  }

  // Default: 'simple'
  return (
    <div
      style={{
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        backgroundColor: 'var(--color-bg)',
        color: 'var(--color-text)',
        padding: '5rem',
        overflowY: 'auto',
      }}
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 2fr',
          gap: '6rem',
          alignItems: 'start',
          width: '100%',
        }}
      >
        <div>
          <h2
            style={{
              fontSize: 'clamp(2.5rem, 5vw, 5rem)',
              fontWeight: 300,
              letterSpacing: '0.05em',
              margin: 0,
              lineHeight: 1.1,
              color: '#f0f0f0',
            }}
          >
            Sobre<br />el<br />artista
          </h2>
          <div
            style={{
              width: '40px',
              height: '1px',
              backgroundColor: 'var(--color-accent)',
              marginTop: '2rem',
            }}
          />
        </div>
        <div>
          <p
            style={{
              fontSize: 'clamp(1rem, 1.8vw, 1.3rem)',
              lineHeight: 2,
              whiteSpace: 'pre-line',
              margin: 0,
              color: 'rgba(240,240,240,0.7)',
              fontWeight: 300,
            }}
          >
            {text}
          </p>
        </div>
      </div>
    </div>
  )
}
