import Image from 'next/image'
import type { SiteConfig } from '@/lib/schemas/site-config.schema'

type SectionConfig = SiteConfig['sections'][number]

type Props = {
  section: SectionConfig
}

export default function Bio({ section }: Props) {
  const text = (section.content.text as string) ?? ''
  const photoUrl = (section.content.photoUrl as string) ?? ''

  if (section.variant === 'with-photo' || section.variant === 'split') {
    return (
      <section
        style={{
          padding: '4rem 2rem',
          maxWidth: '1000px',
          margin: '0 auto',
          backgroundColor: 'var(--color-bg)',
          color: 'var(--color-text)',
        }}
      >
        <div style={{ display: 'grid', gridTemplateColumns: photoUrl ? '1fr 2fr' : '1fr', gap: '3rem', alignItems: 'start' }}>
          {photoUrl && (
            <div style={{ position: 'relative', aspectRatio: '3/4', overflow: 'hidden' }}>
              <Image src={photoUrl} alt="Artista" fill unoptimized style={{ objectFit: 'cover' }} />
            </div>
          )}
          <div>
            <p
              style={{
                fontSize: '1.05rem',
                lineHeight: 1.8,
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

  // Default: 'simple'
  return (
    <section
      style={{
        padding: '4rem 2rem',
        maxWidth: '700px',
        margin: '0 auto',
        backgroundColor: 'var(--color-bg)',
        color: 'var(--color-text)',
      }}
    >
      <p
        style={{
          fontSize: '1.05rem',
          lineHeight: 1.8,
          whiteSpace: 'pre-line',
          margin: 0,
          opacity: 0.85,
        }}
      >
        {text}
      </p>
    </section>
  )
}
