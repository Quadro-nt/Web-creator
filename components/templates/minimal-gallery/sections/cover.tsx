import Image from 'next/image'
import type { SiteConfig } from '@/lib/schemas/site-config.schema'

type SectionConfig = SiteConfig['sections'][number]

type Props = {
  section: SectionConfig
  config: SiteConfig
}

export default function Cover({ section, config }: Props) {
  const { siteTitle, coverImageUrl } = config.identity

  if (section.variant === 'minimal') {
    return (
      <div
        style={{
          padding: '8rem 2rem',
          textAlign: 'center',
          backgroundColor: 'var(--color-bg)',
          color: 'var(--color-text)',
        }}
      >
        <h1 style={{ fontSize: '3rem', fontWeight: 300, letterSpacing: '0.08em', margin: 0 }}>
          {siteTitle}
        </h1>
      </div>
    )
  }

  if (section.variant === 'split') {
    return (
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          minHeight: '100vh',
          backgroundColor: 'var(--color-bg)',
          color: 'var(--color-text)',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            padding: '4rem',
          }}
        >
          <h1 style={{ fontSize: '3rem', fontWeight: 300, letterSpacing: '0.08em', margin: 0 }}>
            {siteTitle}
          </h1>
        </div>
        {coverImageUrl && (
          <div style={{ position: 'relative', overflow: 'hidden' }}>
            <Image
              src={coverImageUrl}
              alt={siteTitle}
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
      <div style={{ position: 'relative', minHeight: '100vh', display: 'flex', alignItems: 'flex-end' }}>
        {coverImageUrl && (
          <Image
            src={coverImageUrl}
            alt={siteTitle}
            fill
            unoptimized
            style={{ objectFit: 'cover', zIndex: 0 }}
          />
        )}
        <div
          style={{
            position: 'relative',
            zIndex: 1,
            padding: '4rem',
            color: '#ffffff',
          }}
        >
          <h1 style={{ fontSize: '4rem', fontWeight: 300, letterSpacing: '0.08em', margin: 0 }}>
            {siteTitle}
          </h1>
        </div>
      </div>
    )
  }

  // Default: 'centered' — image background with overlay
  return (
    <div
      style={{
        position: 'relative',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
      }}
    >
      {coverImageUrl && (
        <>
          <Image
            src={coverImageUrl}
            alt={siteTitle}
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
        <h1 style={{ fontSize: '4rem', fontWeight: 300, letterSpacing: '0.08em', margin: 0 }}>
          {siteTitle}
        </h1>
      </div>
    </div>
  )
}
