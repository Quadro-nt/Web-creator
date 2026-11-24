import Image from 'next/image'
import type { SiteConfig } from '@/lib/schemas/site-config.schema'
import { ContentWrapper } from '@/components/ContentWrapper'
import { sanitizeExternalUrl } from '@/components/templates/shared/template-helpers'

type SectionConfig = SiteConfig['sections'][number]

type Props = {
  section: SectionConfig
  config?: SiteConfig
}

export default function Bio({ section, config }: Props) {
  const heading = (section.content.heading as string) || 'Sobre el artista'
  const text = (section.content.text as string) ?? ''
  const photoUrl = sanitizeExternalUrl(section.content.photoUrl) ?? ''
  const width = config?.sizes.contentWidth ?? 'full'

  if (section.variant === 'with-photo' || section.variant === 'split') {
    return (
      <section
        className="qs-section-pad"
        style={{
          padding: '6rem 5rem',
          backgroundColor: 'var(--color-bg)',
          color: 'var(--color-text)',
          borderTop: '1px solid rgba(128,128,128,0.18)',
        }}
      >
        <ContentWrapper width={width}>
          <div
            className="qs-split-responsive"
            style={{
              display: 'grid',
              gridTemplateColumns: photoUrl ? '1fr 2fr' : '1fr',
              gap: '4rem',
              alignItems: 'start',
            }}
          >
            {photoUrl && (
              <div style={{ position: 'relative', aspectRatio: '2/3', overflow: 'hidden' }}>
                <Image src={photoUrl} alt="Artista" fill unoptimized style={{ objectFit: 'cover' }} />
              </div>
            )}
            <div>
              <h2
                style={{
                  fontSize: 'var(--text-3xl)',
                  fontWeight: 700,
                  letterSpacing: '-0.02em',
                  margin: '0 0 2rem',
                  borderBottom: '2px solid var(--color-accent)',
                  paddingBottom: '0.75rem',
                  display: 'inline-block',
                }}
              >
                {heading}
              </h2>
              <p style={{ fontSize: 'var(--text-base)', lineHeight: 1.85, whiteSpace: 'pre-line', margin: 0, opacity: 0.85 }}>
                {text}
              </p>
            </div>
          </div>
        </ContentWrapper>
      </section>
    )
  }

  if (section.variant === 'centered') {
    return (
      <section
        className="qs-section-pad"
        style={{
          padding: '6rem 5rem',
          backgroundColor: 'var(--color-bg)',
          color: 'var(--color-text)',
          borderTop: '1px solid rgba(128,128,128,0.18)',
          textAlign: 'center',
        }}
      >
        <ContentWrapper width={width}>
          <div style={{ maxWidth: '720px', margin: '0 auto' }}>
            <h2 style={{ fontSize: 'var(--text-3xl)', fontWeight: 700, margin: '0 0 1.5rem' }}>{heading}</h2>
            <p style={{ fontSize: 'var(--text-base)', lineHeight: 1.85, whiteSpace: 'pre-line', margin: 0, opacity: 0.85 }}>
              {text}
            </p>
          </div>
        </ContentWrapper>
      </section>
    )
  }

  if (section.variant === 'stacked') {
    return (
      <section
        className="qs-section-pad"
        style={{
          padding: '6rem 5rem',
          backgroundColor: 'var(--color-bg)',
          color: 'var(--color-text)',
          borderTop: '1px solid rgba(128,128,128,0.18)',
        }}
      >
        <ContentWrapper width={width}>
          <h2 style={{ fontSize: 'var(--text-3xl)', fontWeight: 700, margin: '0 0 1.5rem' }}>{heading}</h2>
          {photoUrl && (
            <div style={{ position: 'relative', width: '100%', aspectRatio: '16/9', overflow: 'hidden', marginBottom: '2rem' }}>
              <Image src={photoUrl} alt="Artista" fill unoptimized style={{ objectFit: 'cover' }} />
            </div>
          )}
          <p style={{ fontSize: 'var(--text-base)', lineHeight: 1.85, whiteSpace: 'pre-line', margin: 0, opacity: 0.85 }}>
            {text}
          </p>
        </ContentWrapper>
      </section>
    )
  }

  return (
    <section
      className="qs-section-pad"
      style={{
        padding: '6rem 5rem',
        backgroundColor: 'var(--color-bg)',
        color: 'var(--color-text)',
        borderTop: '1px solid rgba(128,128,128,0.18)',
      }}
    >
      <ContentWrapper width={width}>
        <div className="qs-split-responsive" style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '4rem' }}>
          <div>
            <h2 style={{ fontSize: 'var(--text-3xl)', fontWeight: 700, letterSpacing: '-0.02em', margin: 0, lineHeight: 1.05 }}>
              {heading}
            </h2>
            <div style={{ width: '40px', height: '3px', backgroundColor: 'var(--color-accent)', marginTop: '1.5rem' }} />
          </div>
          <p style={{ fontSize: 'var(--text-base)', lineHeight: 1.85, whiteSpace: 'pre-line', margin: 0, opacity: 0.85 }}>
            {text}
          </p>
        </div>
      </ContentWrapper>
    </section>
  )
}
