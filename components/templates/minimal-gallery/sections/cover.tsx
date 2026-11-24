import Image from 'next/image'
import type { SiteConfig } from '@/lib/schemas/site-config.schema'
import { Button } from '@/components/Button'
import { sanitizeExternalUrl, sanitizeHref } from '@/components/templates/shared/template-helpers'

type SectionConfig = SiteConfig['sections'][number]

type Props = {
  section: SectionConfig
  config: SiteConfig
}

export default function Cover({ section, config }: Props) {
  const headline = (section.content.headline as string)?.trim() || config.identity.siteTitle
  const subtitle = (section.content.subtitle as string)?.trim() || ''
  const ctaText = (section.content.ctaText as string)?.trim() || ''
  const ctaHref = sanitizeHref(section.content.ctaHref) ?? '#artworks'
  const coverImageUrl =
    sanitizeExternalUrl(section.content.imageUrl) ?? config.identity.coverImageUrl

  const ctaButton = ctaText ? (
    <div style={{ marginTop: '1.75rem' }}>
      <Button shape={config.button.shape} style={config.button.style} href={ctaHref}>
        {ctaText}
      </Button>
    </div>
  ) : null

  if (section.variant === 'minimal') {
    return (
      <div
        className="qs-section-pad"
        style={{
          padding: '8rem 2rem',
          textAlign: 'center',
          backgroundColor: 'var(--color-bg)',
          color: 'var(--color-text)',
        }}
      >
        <h1 style={{ fontSize: 'var(--text-4xl)', fontWeight: 300, letterSpacing: '0.08em', margin: 0 }}>
          {headline}
        </h1>
        {subtitle && (
          <p style={{ margin: '1rem auto 0', maxWidth: '580px', opacity: 0.7, fontSize: 'var(--text-lg)' }}>
            {subtitle}
          </p>
        )}
        {ctaButton}
      </div>
    )
  }

  if (section.variant === 'split') {
    return (
      <div
        className="qs-split-responsive"
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          minHeight: '85vh',
          backgroundColor: 'var(--color-bg)',
          color: 'var(--color-text)',
        }}
      >
        <div
          className="qs-section-pad"
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            padding: '4rem',
          }}
        >
          <h1 style={{ fontSize: 'var(--text-4xl)', fontWeight: 300, letterSpacing: '0.06em', margin: 0 }}>
            {headline}
          </h1>
          {subtitle && (
            <p style={{ margin: '1rem 0 0', opacity: 0.75, fontSize: 'var(--text-lg)', lineHeight: 1.6 }}>
              {subtitle}
            </p>
          )}
          {ctaButton}
        </div>
        {coverImageUrl && (
          <div style={{ position: 'relative', overflow: 'hidden', minHeight: '340px' }}>
            <Image
              src={coverImageUrl}
              alt={headline}
              fill
              unoptimized
              style={{ objectFit: 'cover' }}
            />
          </div>
        )}
      </div>
    )
  }

  if (section.variant === 'full-screen' || section.variant === 'fullscreen') {
    return (
      <div style={{ position: 'relative', minHeight: '85vh', display: 'flex', alignItems: 'flex-end', backgroundColor: '#111' }}>
        {coverImageUrl && (
          <>
            <Image
              src={coverImageUrl}
              alt={headline}
              fill
              unoptimized
              style={{ objectFit: 'cover', zIndex: 0 }}
            />
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: 'linear-gradient(to top, rgba(0,0,0,0.6), rgba(0,0,0,0.1))',
                zIndex: 0,
              }}
            />
          </>
        )}
        <div
          className="qs-section-pad"
          style={{
            position: 'relative',
            zIndex: 1,
            padding: '4rem',
            color: '#ffffff',
          }}
        >
          <h1 style={{ fontSize: 'var(--text-4xl)', fontWeight: 300, letterSpacing: '0.08em', margin: 0 }}>
            {headline}
          </h1>
          {subtitle && (
            <p style={{ margin: '0.9rem 0 0', opacity: 0.85, fontSize: 'var(--text-lg)' }}>
              {subtitle}
            </p>
          )}
          {ctaButton}
        </div>
      </div>
    )
  }

  return (
    <div
      style={{
        position: 'relative',
        minHeight: '85vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        backgroundColor: '#111',
      }}
    >
      {coverImageUrl && (
        <>
          <Image
            src={coverImageUrl}
            alt={headline}
            fill
            unoptimized
            style={{ objectFit: 'cover', zIndex: 0 }}
          />
          <div
            style={{
              position: 'absolute',
              inset: 0,
              backgroundColor: 'rgba(0,0,0,0.45)',
              zIndex: 1,
            }}
          />
        </>
      )}
      <div style={{ position: 'relative', zIndex: 2, color: '#ffffff', padding: '2rem' }}>
        <h1 style={{ fontSize: 'var(--text-4xl)', fontWeight: 300, letterSpacing: '0.08em', margin: 0 }}>
          {headline}
        </h1>
        {subtitle && (
          <p style={{ margin: '1rem auto 0', maxWidth: '580px', opacity: 0.9, fontSize: 'var(--text-lg)' }}>
            {subtitle}
          </p>
        )}
        {ctaButton}
      </div>
    </div>
  )
}
