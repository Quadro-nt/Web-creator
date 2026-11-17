import Image from 'next/image'
import type { SiteConfig } from '@/lib/schemas/site-config.schema'

type SectionConfig = SiteConfig['sections'][number]

type Props = {
  section: SectionConfig
}

export default function Bio({ section }: Props) {
  const text = (section.content.text as string) ?? ''
  const photoUrl = (section.content.photoUrl as string) ?? ''

  if (section.variant === 'with-photo') {
    return (
      <section
        style={{
          padding: '6rem 5rem',
          backgroundColor: 'var(--color-bg)',
          color: 'var(--color-text)',
          borderTop: '1px solid rgba(0,0,0,0.1)',
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: photoUrl ? '1fr 2fr' : '1fr',
            gap: '5rem',
            alignItems: 'start',
          }}
        >
          {photoUrl && (
            <div>
              <div style={{ position: 'relative', aspectRatio: '2/3', overflow: 'hidden' }}>
                <Image src={photoUrl} alt="Artista" fill unoptimized style={{ objectFit: 'cover' }} />
              </div>
            </div>
          )}
          <div>
            <h2
              style={{
                fontSize: 'clamp(2rem, 3.5vw, 3rem)',
                fontWeight: 700,
                letterSpacing: '-0.02em',
                margin: '0 0 2.5rem',
                borderBottom: '2px solid var(--color-accent)',
                paddingBottom: '1rem',
                display: 'inline-block',
              }}
            >
              Sobre el artista
            </h2>
            <div
              style={{
                columns: 2,
                columnGap: '3rem',
              }}
            >
              <p
                style={{
                  fontSize: '1rem',
                  lineHeight: 1.85,
                  whiteSpace: 'pre-line',
                  margin: 0,
                  opacity: 0.85,
                }}
              >
                {text}
              </p>
            </div>
          </div>
        </div>
      </section>
    )
  }

  // Default: 'simple'
  return (
    <section
      style={{
        padding: '6rem 5rem',
        backgroundColor: 'var(--color-bg)',
        color: 'var(--color-text)',
        borderTop: '1px solid rgba(0,0,0,0.1)',
      }}
    >
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '4rem' }}>
        <div>
          <h2
            style={{
              fontSize: 'clamp(2rem, 3.5vw, 3rem)',
              fontWeight: 700,
              letterSpacing: '-0.02em',
              margin: 0,
              lineHeight: 1,
            }}
          >
            Sobre<br />el<br />artista
          </h2>
          <div
            style={{
              width: '40px',
              height: '3px',
              backgroundColor: 'var(--color-accent)',
              marginTop: '1.5rem',
            }}
          />
        </div>
        <div
          style={{
            columns: 2,
            columnGap: '2.5rem',
          }}
        >
          <p
            style={{
              fontSize: '1rem',
              lineHeight: 1.85,
              whiteSpace: 'pre-line',
              margin: 0,
              opacity: 0.85,
            }}
          >
            {text}
          </p>
        </div>
      </div>
    </section>
  )
}
