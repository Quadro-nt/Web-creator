import type { Artwork } from '@/lib/schemas/works.schema'
import { ImageGallery } from './ImageGallery'
import { BuyButton } from './BuyButton'

type Props = {
  artwork: Artwork
  artistSlug: string
}

function formatPrice(price: number, currency: Artwork['currency']): string {
  const prefix = currency === 'USD' ? 'USD' : 'S/'
  const formatted = new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 0,
  }).format(price)
  return `${prefix} ${formatted}`
}

export function ArtworkDetail({ artwork, artistSlug }: Props) {
  const showPrice = artwork.price !== undefined && !artwork.sold
  const showBuyButton = !artwork.sold && artwork.price !== undefined

  return (
    <main
      style={{
        maxWidth: '1100px',
        margin: '0 auto',
        padding: '2rem',
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)',
        gap: '3rem',
        alignItems: 'start',
      }}
    >
      <div>
        <ImageGallery images={artwork.images} alt={artwork.title} />
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
          <dt style={{ opacity: 0.6 }}>Ano</dt>
          <dd style={{ margin: 0 }}>{artwork.year}</dd>
          <dt style={{ opacity: 0.6 }}>Tecnica</dt>
          <dd style={{ margin: 0 }}>{artwork.medium}</dd>
          <dt style={{ opacity: 0.6 }}>Dimensiones</dt>
          <dd style={{ margin: 0 }}>{artwork.dimensions}</dd>
        </dl>
        {artwork.description && (
          <p style={{ margin: 0, lineHeight: 1.6, opacity: 0.85 }}>{artwork.description}</p>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {showPrice && (
            <p style={{ margin: 0, fontSize: '1.5rem', fontWeight: 500 }}>
              {formatPrice(artwork.price as number, artwork.currency)}
            </p>
          )}
          {artwork.sold && (
            <p
              style={{
                margin: 0,
                fontSize: '1.1rem',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                opacity: 0.7,
              }}
            >
              Vendida
            </p>
          )}
          {showBuyButton && <BuyButton artwork={artwork} artistSlug={artistSlug} />}
        </div>
      </div>
    </main>
  )
}
