import Image from 'next/image'
import type { SiteConfig } from '@/lib/schemas/site-config.schema'
import { ContentWrapper } from '@/components/ContentWrapper'
import { sanitizeExternalUrl } from '@/components/templates/shared/template-helpers'

type SectionConfig = SiteConfig['sections'][number]

type Props = {
  section: SectionConfig
  config?: SiteConfig
}

export default function ImmersiveBio({ section, config }: Props) {
  const heading = (section.content.heading as string) || 'Sobre el artista'
  const text = (section.content.text as string) ?? ''
  const photoUrl = sanitizeExternalUrl(section.content.photoUrl) ?? ''
  const width = config?.sizes.contentWidth ?? 'full'

  if (section.variant === 'with-photo' || section.variant === 'split') {
    return (
      <div
        className="qs-split-responsive"
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
          <div style={{ position: 'relative', overflow: 'hidden', minHeight: '320px' }}>
            <Image
              src={photoUrl}
              alt="Artista"
              fill
              unoptimized
              style={{ objectFit: 'cover', filter: 'brightness(0.7) contrast(1.05)' }}
            />
          </div>
        )}
        <div className="qs-section-pad" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '5rem' }}>
          <span style={{ fontSize: '0.65rem', letterSpacing: '0.4em', textTransform: 'uppercase', color: 'var(--color-accent)', display: 'block', marginBottom: '1.5rem' }}>
            {heading}
          </span>
          <p style={{ fontSize: 'var(--text-lg)', lineHeight: 1.9, whiteSpace: 'pre-line', margin: 0, opacity: 0.85, fontWeight: 300 }}>
            {text}
          </p>
        </div>
      </div>
    )
  }

  if (section.variant === 'centered') {
    return (
      <div className="qs-section-pad" style={{ backgroundColor: 'var(--color-bg)', color: 'var(--color-text)', padding: '5rem 2rem', textAlign: 'center' }}>
        <ContentWrapper width={width}>
          <div style={{ maxWidth: '720px', margin: '0 auto' }}>
            <h2 style={{ fontSize: 'var(--text-3xl)', fontWeight: 300, margin: '0 0 1.5rem' }}>{heading}</h2>
            <p style={{ fontSize: 'var(--text-lg)', lineHeight: 1.95, whiteSpace: 'pre-line', margin: 0, opacity: 0.85, fontWeight: 300 }}>
              {text}
            </p>
          </div>
        </ContentWrapper>
      </div>
    )
  }

  if (section.variant === 'stacked') {
    return (
      <div className="qs-section-pad" style={{ backgroundColor: 'var(--color-bg)', color: 'var(--color-text)', padding: '5rem' }}>
        <ContentWrapper width={width}>
          <h2 style={{ fontSize: 'var(--text-3xl)', fontWeight: 300, margin: '0 0 1.5rem' }}>{heading}</h2>
          {photoUrl && (
            <div style={{ position: 'relative', width: '100%', aspectRatio: '16/9', overflow: 'hidden', marginBottom: '2rem' }}>
              <Image src={photoUrl} alt="Artista" fill unoptimized style={{ objectFit: 'cover' }} />
            </div>
          )}
          <p style={{ fontSize: 'var(--text-lg)', lineHeight: 1.95, whiteSpace: 'pre-line', margin: 0, opacity: 0.85, fontWeight: 300 }}>
            {text}
          </p>
        </ContentWrapper>
      </div>
    )
  }

  return (
    <div className="qs-section-pad" style={{ height: '100%', display: 'flex', alignItems: 'center', backgroundColor: 'var(--color-bg)', color: 'var(--color-text)', padding: '5rem' }}>
      <ContentWrapper width={width}>
        <div className="qs-split-responsive" style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '4rem', alignItems: 'start', width: '100%' }}>
          <div>
            <h2 style={{ fontSize: 'var(--text-3xl)', fontWeight: 300, letterSpacing: '0.05em', margin: 0, lineHeight: 1.1 }}>
              {heading}
            </h2>
            <div style={{ width: '40px', height: '1px', backgroundColor: 'var(--color-accent)', marginTop: '1.5rem' }} />
          </div>
          <p style={{ fontSize: 'var(--text-lg)', lineHeight: 1.95, whiteSpace: 'pre-line', margin: 0, opacity: 0.8, fontWeight: 300 }}>
            {text}
          </p>
        </div>
      </ContentWrapper>
    </div>
  )
}
