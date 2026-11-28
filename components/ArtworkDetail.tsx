import type { Artwork } from '@/lib/schemas/works.schema'
import type { SiteConfig } from '@/lib/schemas/site-config.schema'
import { generateTokenStyles } from '@/lib/tokens'
import AnnouncementBar from '@/components/templates/shared/AnnouncementBar'
import SafeLink from '@/components/templates/shared/SafeLink'
import SiteFooter from '@/components/templates/shared/SiteFooter'
import SiteHeader from '@/components/templates/shared/SiteHeader'
import { ImageGallery } from './ImageGallery'
import { BuyButton } from './BuyButton'

type Props = {
  artwork: Artwork
  artistSlug: string
  config?: SiteConfig | null
  relatedWorks?: Artwork[]
}

function formatPrice(price: number, currency: Artwork['currency']): string {
  const prefix = currency === 'USD' ? 'USD' : 'S/'
  const formatted = new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 0,
  }).format(price)
  return `${prefix} ${formatted}`
}

export function ArtworkDetail({ artwork, artistSlug, config, relatedWorks }: Props) {
  const showBuyButton = !artwork.sold

  const catalog = relatedWorks ?? []
  const currentIndex = catalog.findIndex((w) => w.slug === artwork.slug)
  const prevWork = currentIndex > 0 ? catalog[currentIndex - 1] : null
  const nextWork = currentIndex >= 0 && currentIndex < catalog.length - 1 ? catalog[currentIndex + 1] : null

  const moreWorks = (() => {
    const others = catalog.filter((w) => w.slug !== artwork.slug)
    if (others.length <= 4) return others
    if (currentIndex >= 0) {
      const rotated = [...catalog.slice(currentIndex + 1), ...catalog.slice(0, currentIndex)]
      return rotated.filter((w) => w.slug !== artwork.slug).slice(0, 4)
    }
    return others.slice(0, 4)
  })()

  const inner = (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '2rem' }}>
      <nav
        aria-label="Navegación de obra"
        style={{
          marginBottom: '2rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          flexWrap: 'wrap',
        }}
      >
        <SafeLink
          href="/"
          artistSlug={artistSlug}
          style={{
            color: 'inherit',
            textDecoration: 'none',
            fontSize: '0.95rem',
            opacity: 0.8,
          }}
        >
          ← Volver al portafolio
        </SafeLink>

        {(prevWork || nextWork) && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', fontSize: '0.875rem' }}>
            {prevWork && (
              <SafeLink
                href={`/obras/${prevWork.slug}`}
                artistSlug={artistSlug}
                aria-label={`Obra anterior: ${prevWork.title}`}
                style={{ color: 'inherit', textDecoration: 'none', opacity: 0.8 }}
              >
                ← Anterior
              </SafeLink>
            )}
            {nextWork && (
              <SafeLink
                href={`/obras/${nextWork.slug}`}
                artistSlug={artistSlug}
                aria-label={`Obra siguiente: ${nextWork.title}`}
                style={{ color: 'inherit', textDecoration: 'none', opacity: 0.8 }}
              >
                Siguiente →
              </SafeLink>
            )}
          </div>
        )}
      </nav>

      <main
        className="qs-split-responsive"
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)',
          gap: '3rem',
          alignItems: 'start',
        }}
      >
        <div>
          <ImageGallery images={artwork.images} alt={artwork.title} dimensions={artwork.dimensions} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <h1 style={{ margin: 0, fontSize: '2rem', fontWeight: 400 }}>{artwork.title}</h1>
          <dl
            style={{
              display: 'grid',
              gridTemplateColumns: 'auto 1fr',
              columnGap: '1.5rem',
              rowGap: '0.5rem',
              margin: 0,
            }}
          >
            <dt style={{ opacity: 0.72 }}>Año</dt>
            <dd style={{ margin: 0 }}>{artwork.year}</dd>
            <dt style={{ opacity: 0.72 }}>Técnica</dt>
            <dd style={{ margin: 0 }}>{artwork.medium}</dd>
            <dt style={{ opacity: 0.72 }}>Dimensiones</dt>
            <dd style={{ margin: 0 }}>{artwork.dimensions}</dd>
          </dl>
          {artwork.description && (
            <p style={{ margin: 0, lineHeight: 1.6, opacity: 0.85 }}>{artwork.description}</p>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {!artwork.sold && (
              <p style={{ margin: 0, fontSize: '1.5rem', fontWeight: 500 }}>
                {artwork.price !== undefined
                  ? formatPrice(artwork.price, artwork.currency)
                  : 'Consultar precio'}
              </p>
            )}
            {artwork.sold && (
              <p
                style={{
                  margin: 0,
                  fontSize: '1.1rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  opacity: 0.75,
                }}
              >
                Vendida
              </p>
            )}
            {showBuyButton && (
              <BuyButton artwork={artwork} artistSlug={artistSlug} config={config} />
            )}
          </div>
        </div>
      </main>

      {moreWorks.length > 0 && (
        <section
          aria-labelledby="more-works-heading"
          style={{
            marginTop: '4.5rem',
            paddingTop: '2.5rem',
            borderTop: '1px solid rgba(128,128,128,0.2)',
          }}
        >
          <h2
            id="more-works-heading"
            style={{ margin: '0 0 1.5rem', fontSize: '1.35rem', fontWeight: 400 }}
          >
            Más obras del catálogo
          </h2>
          <div
            className="qs-grid-responsive"
            style={{
              display: 'grid',
              gridTemplateColumns: `repeat(${Math.min(4, moreWorks.length)}, minmax(0, 1fr))`,
              gap: '1.25rem',
            }}
          >
            {moreWorks.map((item) => (
              <SafeLink
                key={item.slug}
                href={`/obras/${item.slug}`}
                artistSlug={artistSlug}
                style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}
              >
                <div
                  style={{
                    aspectRatio: '4/5',
                    backgroundColor: 'var(--color-surface, rgba(128,128,128,0.08))',
                    borderRadius: 'var(--radius-media, 4px)',
                    padding: '0.65rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                    boxSizing: 'border-box',
                  }}
                >
                  <img
                    src={item.images[0]}
                    alt={item.title}
                    loading="lazy"
                    decoding="async"
                    style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
                  />
                </div>
                <p style={{ margin: '0.6rem 0 0.2rem', fontWeight: 600, fontSize: '0.95rem' }}>
                  {item.title}
                </p>
                <p style={{ margin: 0, fontSize: '0.78rem', opacity: 0.72 }}>
                  {item.medium}, {item.year}
                </p>
              </SafeLink>
            ))}
          </div>
        </section>
      )}
    </div>
  )

  if (config) {
    return (
      <div
        className="qs-site-root"
        style={{
          backgroundColor: 'var(--color-bg)',
          color: 'var(--color-text)',
          minHeight: '100vh',
          containerType: 'inline-size',
          containerName: 'qs-canvas',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <style
          dangerouslySetInnerHTML={{ __html: generateTokenStyles(config, '.qs-site-root') }}
        />
        <AnnouncementBar config={config} />
        {config.header && <SiteHeader config={config} artistSlug={artistSlug} />}
        <div style={{ flex: 1 }}>{inner}</div>
        <SiteFooter config={config} artistSlug={artistSlug} />
      </div>
    )
  }

  return inner
}
