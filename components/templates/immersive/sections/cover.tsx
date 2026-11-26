import Image from 'next/image'
import type { SectionConfig, SiteConfig } from '@/lib/schemas/site-config.schema'
import { Button } from '@/components/Button'
import { sanitizeExternalUrl, sanitizeHref } from '@/components/templates/shared/template-helpers'


type Props = {
  section: SectionConfig
  config: SiteConfig
}

export default function ImmersiveCover({ section, config }: Props) {
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

  if (section.variant === 'fullscreen-video') {
    return (
      <div
        style={{
          position: 'relative',
          width: '100%',
          minHeight: '520px',
          height: '100%',
          backgroundColor: 'var(--qs-text)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
        }}
      >
        {coverImageUrl && (
          <Image src={coverImageUrl} alt={headline} fill unoptimized style={{ objectFit: 'cover', opacity: 0.5 }} />
        )}
        <div
          style={{
            position: 'relative',
            zIndex: 1,
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '1.75rem',
            padding: '3rem 2rem',
          }}
        >
          <h1
            style={{
              fontFamily: 'var(--qs-font-heading)',
              fontSize: 'clamp(2.5rem, 7vw, 6rem)',
              fontWeight: 300,
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              color: 'var(--qs-bg)',
              margin: 0,
              lineHeight: 1,
            }}
          >
            {headline}
          </h1>
          {subtitle && (
            <p style={{ margin: 0, color: 'var(--qs-bg)', opacity: 0.8, fontSize: 'var(--text-lg)' }}>{subtitle}</p>
          )}
          {ctaButton}
        </div>
      </div>
    )
  }

  if (section.variant === 'parallax' || section.variant === 'fullscreen' || section.variant === 'full-screen') {
    return (
      <div
        style={{
          position: 'relative',
          width: '100%',
          minHeight: '520px',
          height: '100%',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'flex-end',
          backgroundColor: 'var(--qs-text)',
        }}
      >
        {coverImageUrl && (
          <Image src={coverImageUrl} alt={headline} fill unoptimized style={{ objectFit: 'cover', opacity: 0.6 }} />
        )}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(to top, rgba(10,10,10,0.9) 0%, transparent 60%)',
          }}
        />
        <div className="qs-section-pad" style={{ position: 'relative', zIndex: 1, padding: '4rem 5rem' }}>
          <span
            style={{
              fontSize: '0.7rem',
              letterSpacing: '0.4em',
              textTransform: 'uppercase',
              opacity: 0.6,
              display: 'block',
              marginBottom: '1.25rem',
              color: 'var(--qs-bg)',
            }}
          >
            Portfolio
          </span>
          <h1
            style={{
              fontFamily: 'var(--qs-font-heading)',
              fontSize: 'clamp(2.5rem, 6vw, 5.5rem)',
              fontWeight: 300,
              letterSpacing: '0.08em',
              color: 'var(--qs-bg)',
              margin: 0,
              lineHeight: 1,
            }}
          >
            {headline}
          </h1>
          {subtitle && (
            <p style={{ margin: '1rem 0 0', color: 'var(--qs-bg)', opacity: 0.8, fontSize: 'var(--text-lg)' }}>
              {subtitle}
            </p>
          )}
          {ctaButton}
        </div>
      </div>
    )
  }

  if (section.variant === 'split-dark' || section.variant === 'split') {
    return (
      <div
        className="qs-split-responsive"
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          width: '100%',
          minHeight: '520px',
          height: '100%',
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
            padding: '4rem 5rem',
            borderRight: '1px solid var(--qs-border)',
          }}
        >
          <span
            style={{
              fontSize: '0.7rem',
              letterSpacing: '0.4em',
              textTransform: 'uppercase',
              color: 'var(--color-accent)',
              display: 'block',
              marginBottom: '1.5rem',
            }}
          >
            Arte
          </span>
          <h1 style={{ fontFamily: 'var(--qs-font-heading)', fontSize: 'clamp(2.75rem, 5.5vw, 5rem)', fontWeight: 700, lineHeight: 0.95, letterSpacing: '-0.02em', margin: 0 }}>
            {headline}
          </h1>
          {subtitle && (
            <p style={{ margin: '1.25rem 0 0', opacity: 0.75, fontSize: 'var(--text-lg)' }}>{subtitle}</p>
          )}
          {ctaButton}
        </div>
        {coverImageUrl ? (
          <div style={{ position: 'relative', overflow: 'hidden', minHeight: '340px' }}>
            <Image
              src={coverImageUrl}
              alt={headline}
              fill
              unoptimized
              style={{ objectFit: 'cover', filter: 'brightness(0.8)' }}
            />
          </div>
        ) : (
          <div style={{ backgroundColor: 'var(--qs-secondary-bg)' }} />
        )}
      </div>
    )
  }

  if (section.variant === 'minimal') {
    return (
      <div
        className="qs-section-pad"
        style={{
          width: '100%',
          minHeight: '420px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          padding: '5rem 2rem',
          backgroundColor: 'var(--color-bg)',
          color: 'var(--color-text)',
        }}
      >
        <h1 style={{ fontFamily: 'var(--qs-font-heading)', fontSize: 'clamp(2.75rem, 7vw, 6rem)', fontWeight: 300, letterSpacing: '0.08em', margin: 0 }}>
          {headline}
        </h1>
        {subtitle && (
          <p style={{ margin: '1rem 0 0', opacity: 0.75, fontSize: 'var(--text-lg)' }}>{subtitle}</p>
        )}
        {ctaButton}
      </div>
    )
  }

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        minHeight: '520px',
        height: '100%',
        backgroundColor: 'var(--qs-text)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {coverImageUrl && (
        <Image src={coverImageUrl} alt={headline} fill unoptimized style={{ objectFit: 'cover', filter: 'brightness(0.4)' }} />
      )}
      <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', padding: '2rem' }}>
        <span
          style={{
            fontSize: '0.65rem',
            letterSpacing: '0.5em',
            textTransform: 'uppercase',
            color: 'var(--color-accent)',
            display: 'block',
            marginBottom: '1.75rem',
          }}
        >
          — Portfolio —
        </span>
        <h1
          style={{
            fontFamily: 'var(--qs-font-heading)',
            fontSize: 'clamp(3rem, 8vw, 7rem)',
            fontWeight: 300,
            letterSpacing: '0.1em',
            color: 'var(--qs-bg)',
            margin: 0,
            lineHeight: 1,
          }}
        >
          {headline}
        </h1>
        {subtitle && (
          <p style={{ margin: '1.25rem 0 0', color: 'var(--qs-bg)', opacity: 0.8, fontSize: 'var(--text-lg)' }}>
            {subtitle}
          </p>
        )}
        {ctaButton}
        <div
          style={{
            width: '60px',
            height: '1px',
            backgroundColor: 'var(--color-accent)',
            margin: '2rem auto 0',
          }}
        />
      </div>
    </div>
  )
}
