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
  const heading = (section.content.heading as string) ?? ''
  const text = (section.content.text as string) ?? ''
  const photoUrl = sanitizeExternalUrl(section.content.photoUrl) ?? ''
  const width = config?.sizes.contentWidth ?? 'mid'

  if (section.variant === 'with-photo' || section.variant === 'split') {
    return (
      <section
        className="qs-section-pad"
        style={{
          padding: '4rem 2rem',
          backgroundColor: 'var(--color-bg)',
          color: 'var(--color-text)',
        }}
      >
        <ContentWrapper width={width}>
          <div
            className="qs-split-responsive"
            style={{ display: 'grid', gridTemplateColumns: photoUrl ? '1fr 2fr' : '1fr', gap: '3rem', alignItems: 'start' }}
          >
            {photoUrl && (
              <div style={{ position: 'relative', aspectRatio: '3/4', overflow: 'hidden' }}>
                <Image src={photoUrl} alt="Artista" fill unoptimized style={{ objectFit: 'cover' }} />
              </div>
            )}
            <div>
              {heading && <h2 style={{ fontFamily: 'var(--qs-font-heading)', margin: '0 0 1rem', fontSize: 'var(--text-2xl)', fontWeight: 400 }}>{heading}</h2>}
              <p
                style={{
                  fontSize: 'var(--text-base)',
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
        </ContentWrapper>
      </section>
    )
  }

  if (section.variant === 'centered') {
    return (
      <section
        className="qs-section-pad"
        style={{
          padding: '4rem 2rem',
          backgroundColor: 'var(--color-bg)',
          color: 'var(--color-text)',
          textAlign: 'center',
        }}
      >
        <ContentWrapper width={width}>
          <div style={{ maxWidth: '680px', margin: '0 auto' }}>
            {photoUrl && (
              <div style={{ position: 'relative', width: '140px', height: '140px', borderRadius: '9999px', overflow: 'hidden', margin: '0 auto 1.5rem' }}>
                <Image src={photoUrl} alt="Artista" fill unoptimized style={{ objectFit: 'cover' }} />
              </div>
            )}
            {heading && <h2 style={{ margin: '0 0 1rem', fontSize: 'var(--text-2xl)', fontWeight: 400 }}>{heading}</h2>}
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
          padding: '4rem 2rem',
          backgroundColor: 'var(--color-bg)',
          color: 'var(--color-text)',
        }}
      >
        <ContentWrapper width={width}>
          {heading && <h2 style={{ fontFamily: 'var(--qs-font-heading)', margin: '0 0 1.25rem', fontSize: 'var(--text-2xl)', fontWeight: 400 }}>{heading}</h2>}
          {photoUrl && (
            <div style={{ position: 'relative', width: '100%', aspectRatio: '16/9', overflow: 'hidden', marginBottom: '1.75rem' }}>
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
        padding: '4rem 2rem',
        backgroundColor: 'var(--color-bg)',
        color: 'var(--color-text)',
      }}
    >
      <ContentWrapper width={width}>
        <div style={{ maxWidth: '700px', margin: '0 auto' }}>
          {heading && <h2 style={{ margin: '0 0 1rem', fontSize: 'var(--text-2xl)', fontWeight: 400 }}>{heading}</h2>}
          <p
            style={{
              fontSize: 'var(--text-base)',
              lineHeight: 1.8,
              whiteSpace: 'pre-line',
              margin: 0,
              opacity: 0.85,
            }}
          >
            {text}
          </p>
        </div>
      </ContentWrapper>
    </section>
  )
}
