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

  if (section.variant === 'magazine' || section.variant === 'split') {
    return (
      <div
        className="qs-split-responsive"
        style={{
          display: 'grid',
          gridTemplateColumns: '3fr 2fr',
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
            justifyContent: 'flex-end',
            padding: '5rem 4rem 5rem 5rem',
            borderRight: '1px solid rgba(128,128,128,0.18)',
          }}
        >
          <span
            style={{
              fontSize: '0.75rem',
              letterSpacing: '0.3em',
              textTransform: 'uppercase',
              opacity: 0.45,
              marginBottom: '1.5rem',
              display: 'block',
            }}
          >
            Portfolio
          </span>
          <h1
            style={{
              fontSize: 'clamp(3rem, 7vw, 6rem)',
              fontWeight: 700,
              lineHeight: 0.92,
              letterSpacing: '-0.02em',
              margin: 0,
            }}
          >
            {headline}
          </h1>
          {subtitle && (
            <p style={{ margin: '1.25rem 0 0', opacity: 0.75, fontSize: 'var(--text-lg)' }}>
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

  if (section.variant === 'headline' || section.variant === 'minimal') {
    return (
      <div
        className="qs-section-pad"
        style={{
          backgroundColor: 'var(--color-bg)',
          color: 'var(--color-text)',
          padding: '7rem 5rem 5rem',
          borderBottom: '3px solid var(--color-text)',
        }}
      >
        <div style={{ maxWidth: '820px' }}>
          <span
            style={{
              fontSize: '0.75rem',
              letterSpacing: '0.3em',
              textTransform: 'uppercase',
              opacity: 0.45,
              display: 'block',
              marginBottom: '1.75rem',
            }}
          >
            — Arte
          </span>
          <h1
            style={{
              fontSize: 'clamp(3.25rem, 9vw, 7.5rem)',
              fontWeight: 800,
              lineHeight: 0.88,
              letterSpacing: '-0.03em',
              margin: 0,
            }}
          >
            {headline}
          </h1>
          {subtitle && (
            <p style={{ margin: '1.5rem 0 0', opacity: 0.75, fontSize: 'var(--text-lg)' }}>
              {subtitle}
            </p>
          )}
          {ctaButton}
        </div>
      </div>
    )
  }

  if (section.variant === 'poster' || section.variant === 'fullscreen' || section.variant === 'full-screen') {
    return (
      <div
        style={{
          position: 'relative',
          minHeight: '85vh',
          display: 'flex',
          alignItems: 'flex-end',
          backgroundColor: 'var(--color-bg)',
        }}
      >
        {coverImageUrl && (
          <Image
            src={coverImageUrl}
            alt={headline}
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
            backgroundColor: 'rgba(245,240,232,0.9)',
            backdropFilter: 'blur(4px)',
            maxWidth: '500px',
            color: '#1a1a1a',
          }}
        >
          <span
            style={{
              fontSize: '0.7rem',
              letterSpacing: '0.3em',
              textTransform: 'uppercase',
              opacity: 0.55,
              display: 'block',
              marginBottom: '1rem',
            }}
          >
            — Portfolio
          </span>
          <h1
            style={{
              fontSize: 'clamp(2.25rem, 5vw, 4rem)',
              fontWeight: 700,
              lineHeight: 0.95,
              letterSpacing: '-0.02em',
              margin: 0,
            }}
          >
            {headline}
          </h1>
          {subtitle && (
            <p style={{ margin: '1rem 0 0', opacity: 0.75, fontSize: 'var(--text-base)' }}>
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
      className="qs-section-pad"
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
            fontSize: 'clamp(3.25rem, 9vw, 7.5rem)',
            fontWeight: 800,
            lineHeight: 0.88,
            letterSpacing: '-0.03em',
            margin: 0,
          }}
        >
          {headline}
        </h1>
        {subtitle && (
          <p style={{ margin: '1.25rem 0 0', opacity: 0.75, fontSize: 'var(--text-lg)' }}>
            {subtitle}
          </p>
        )}
        {ctaButton}
      </div>
      <div
        style={{
          marginTop: '3rem',
          borderTop: '1px solid rgba(128,128,128,0.2)',
          paddingTop: '1.5rem',
          display: 'flex',
          gap: '2rem',
          flexWrap: 'wrap',
          opacity: 0.45,
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
