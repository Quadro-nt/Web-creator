import type { SectionConfig, SiteConfig } from '@/lib/schemas/site-config.schema'
import type { Artwork } from '@/lib/schemas/works.schema'
import { ArtworkFrame } from '@/components/ArtworkFrame'
import { Button } from '@/components/Button'
import { ContentWrapper } from '@/components/ContentWrapper'
import CategoryGridClient from './CategoryGridClient'
import NewsletterSection from './NewsletterSection'
import { buildWhatsappUrl, parseVideoEmbedUrl, sanitizeExternalUrl, sanitizeHref } from './template-helpers'

type Props = {
  section: SectionConfig
  config: SiteConfig
  works: Artwork[]
  artistSlug: string
  inPreview?: boolean
}

export default function ExtraSection({ section, config, works, artistSlug, inPreview = false }: Props) {
  switch (section.type) {
    case 'featured-work':
      return <FeaturedWorkSection section={section} config={config} works={works} artistSlug={artistSlug} />
    case 'statement':
      return <StatementSection section={section} config={config} />
    case 'gallery':
      return <GallerySection section={section} config={config} />
    case 'press':
      return <PressSection section={section} config={config} />
    case 'video':
      return <VideoSection section={section} config={config} />
    case 'cta':
      return <CtaSection section={section} config={config} artistSlug={artistSlug} />
    case 'divider':
      return <DividerSection section={section} />
    case 'marquee':
      return <MarqueeSection section={section} />
    case 'category-grid':
      return <CategoryGridClient section={section} config={config} />
    case 'feature-split':
      return <FeatureSplitSection section={section} config={config} />
    case 'social-strip':
      return <SocialStripSection section={section} config={config} works={works} />
    case 'reviews':
      return <ReviewsSection section={section} config={config} />
    case 'newsletter':
      return <NewsletterSection section={section} config={config} artistSlug={artistSlug} inPreview={inPreview} />
    default:
      return null
  }
}

function formatPrice(price: number, currency: Artwork['currency']): string {
  const prefix = currency === 'USD' ? 'USD' : 'S/'
  return `${prefix} ${new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(price)}`
}

function FeaturedWorkSection({ section, config, works, artistSlug }: Props) {
  const workSlug = typeof section.content.workSlug === 'string' ? section.content.workSlug : ''
  const work = works.find((w) => w.slug === workSlug) ?? works[0]
  const eyebrow = (section.content.eyebrow as string) ?? 'Obra destacada'
  const note = (section.content.note as string) ?? ''
  const buttonText = (section.content.buttonText as string)?.trim() || config.button.buyText

  if (!work) {
    return (
      <section className="qs-section-pad" style={{ padding: '4rem 2rem' }}>
        <ContentWrapper width={config.sizes.contentWidth}>
          <div style={{ border: '1px dashed currentColor', opacity: 0.45, padding: '2rem', textAlign: 'center', borderRadius: 'var(--radius-card)' }}>
            <p style={{ margin: 0 }}>Obra destacada — agrega obras al catálogo para mostrar esta pieza.</p>
          </div>
        </ContentWrapper>
      </section>
    )
  }

  const waHref = buildWhatsappUrl(
    section.content.whatsapp,
    `Hola, me interesa la obra destacada '${work.title}' (${work.year}) de ${artistSlug}.`
  )
  const href = work.sold ? `/obras/${work.slug}` : waHref ?? `/obras/${work.slug}`
  const ctaLabel = work.sold ? 'Ver detalle' : buttonText
  const hoverClass =
    config.animations.hoverEffect === 'zoom'
      ? 'qs-hover-zoom'
      : config.animations.hoverEffect === 'info'
        ? 'qs-hover-info'
        : ''

  const imageBlock = (
    <ArtworkFrame treatment={config.styleTokens.artworkTreatment} className={hoverClass}>
      <div style={{ position: 'relative', aspectRatio: '4/3', overflow: 'hidden', borderRadius: 'var(--radius-media)', background: 'rgba(128,128,128,0.08)' }}>
        <img
          src={work.images[0]}
          alt={work.title}
          data-artwork-image="true"
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        />
      </div>
    </ArtworkFrame>
  )

  const detailsBlock = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
      {eyebrow && (
        <span style={{ fontSize: 'var(--text-xs)', letterSpacing: '0.25em', textTransform: 'uppercase', color: 'var(--color-accent)' }}>
          {eyebrow}
        </span>
      )}
      <h2 style={{ margin: 0, fontSize: 'var(--text-3xl)', fontWeight: 400 }}>{work.title}</h2>
      <p style={{ margin: 0, fontSize: 'var(--text-sm)', opacity: 0.7 }}>
        {work.medium} — {work.year} · {work.dimensions}
      </p>
      {work.price !== undefined && !work.sold && (
        <p style={{ margin: 0, fontSize: 'var(--text-xl)', fontWeight: 600 }}>
          {formatPrice(work.price, work.currency)}
        </p>
      )}
      {work.sold && (
        <span style={{ fontSize: 'var(--text-xs)', letterSpacing: '0.15em', textTransform: 'uppercase', opacity: 0.6 }}>
          Obra vendida
        </span>
      )}
      {(note || work.description) && (
        <p style={{ margin: 0, fontSize: 'var(--text-base)', lineHeight: 1.7, opacity: 0.85 }}>
          {note || work.description}
        </p>
      )}
      <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <Button shape={config.button.shape} style={config.button.style} href={href}>
          {ctaLabel}
        </Button>
      </div>
    </div>
  )

  if (section.variant === 'spotlight') {
    return (
      <section className="qs-section-pad" style={{ padding: '4rem 2rem' }}>
        <ContentWrapper width={config.sizes.contentWidth}>
          <div style={{ maxWidth: '720px', margin: '0 auto', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
            {imageBlock}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
              {detailsBlock}
            </div>
          </div>
        </ContentWrapper>
      </section>
    )
  }

  if (section.variant === 'card') {
    return (
      <section className="qs-section-pad" style={{ padding: '4rem 2rem' }}>
        <ContentWrapper width={config.sizes.contentWidth}>
          <div
            className="qs-split-responsive"
            style={{
              display: 'grid',
              gridTemplateColumns: '1.1fr 1fr',
              gap: '2.5rem',
              alignItems: 'center',
              padding: '2rem',
              border: '1px solid currentColor',
              borderRadius: 'var(--radius-card)',
            }}
          >
            {imageBlock}
            {detailsBlock}
          </div>
        </ContentWrapper>
      </section>
    )
  }

  return (
    <section className="qs-section-pad" style={{ padding: '4rem 2rem' }}>
      <ContentWrapper width={config.sizes.contentWidth}>
        <div
          className="qs-split-responsive"
          style={{ display: 'grid', gridTemplateColumns: '1.15fr 1fr', gap: '3rem', alignItems: 'center' }}
        >
          {imageBlock}
          {detailsBlock}
        </div>
      </ContentWrapper>
    </section>
  )
}

function StatementSection({ section, config }: { section: SectionConfig; config: SiteConfig }) {
  const eyebrow = (section.content.eyebrow as string) ?? ''
  const quote = (section.content.quote as string) ?? (section.content.text as string) ?? ''
  const author = (section.content.author as string) ?? ''

  if (section.variant === 'accent') {
    return (
      <section
        className="qs-section-pad"
        style={{
          padding: '4.5rem 2rem',
          backgroundColor: 'var(--color-accent)',
          color: 'var(--color-bg)',
        }}
      >
        <ContentWrapper width={config.sizes.contentWidth}>
          <div style={{ maxWidth: '760px', margin: '0 auto', textAlign: 'center' }}>
            {eyebrow && (
              <span style={{ display: 'block', fontSize: 'var(--text-xs)', letterSpacing: '0.25em', textTransform: 'uppercase', opacity: 0.8, marginBottom: '1rem' }}>
                {eyebrow}
              </span>
            )}
            <blockquote style={{ margin: 0, fontFamily: 'var(--font-heading)', fontSize: 'var(--text-3xl)', lineHeight: 1.35, fontWeight: 400 }}>
              “{quote}”
            </blockquote>
            {author && (
              <p style={{ margin: '1.5rem 0 0', fontSize: 'var(--text-sm)', letterSpacing: '0.12em', textTransform: 'uppercase', opacity: 0.85 }}>
                — {author}
              </p>
            )}
          </div>
        </ContentWrapper>
      </section>
    )
  }

  if (section.variant === 'editorial') {
    return (
      <section className="qs-section-pad" style={{ padding: '4rem 2rem' }}>
        <ContentWrapper width={config.sizes.contentWidth}>
          <div style={{ borderLeft: '3px solid var(--color-accent)', paddingLeft: '2rem', maxWidth: '780px' }}>
            {eyebrow && (
              <span style={{ display: 'block', fontSize: 'var(--text-xs)', letterSpacing: '0.25em', textTransform: 'uppercase', color: 'var(--color-accent)', marginBottom: '0.75rem' }}>
                {eyebrow}
              </span>
            )}
            <blockquote style={{ margin: 0, fontFamily: 'var(--font-heading)', fontSize: 'var(--text-2xl)', lineHeight: 1.45, fontWeight: 400 }}>
              {quote}
            </blockquote>
            {author && <p style={{ margin: '1rem 0 0', fontSize: 'var(--text-sm)', opacity: 0.65 }}>— {author}</p>}
          </div>
        </ContentWrapper>
      </section>
    )
  }

  return (
    <section className="qs-section-pad" style={{ padding: '4.5rem 2rem' }}>
      <ContentWrapper width={config.sizes.contentWidth}>
        <div style={{ maxWidth: '720px', margin: '0 auto', textAlign: 'center' }}>
          {eyebrow && (
            <span style={{ display: 'block', fontSize: 'var(--text-xs)', letterSpacing: '0.25em', textTransform: 'uppercase', color: 'var(--color-accent)', marginBottom: '1rem' }}>
              {eyebrow}
            </span>
          )}
          <blockquote style={{ margin: 0, fontFamily: 'var(--font-heading)', fontSize: 'var(--text-3xl)', lineHeight: 1.4, fontStyle: 'italic', fontWeight: 400 }}>
            “{quote}”
          </blockquote>
          {author && <p style={{ margin: '1.25rem 0 0', fontSize: 'var(--text-sm)', opacity: 0.65 }}>— {author}</p>}
        </div>
      </ContentWrapper>
    </section>
  )
}

type GalleryImage = {
  url: string
  caption?: string
}

function normalizeGalleryImages(raw: unknown): GalleryImage[] {
  if (!Array.isArray(raw)) return []
  const items: GalleryImage[] = []
  for (const entry of raw) {
    if (typeof entry === 'string') {
      const safe = sanitizeExternalUrl(entry)
      if (safe) items.push({ url: safe })
    } else if (entry && typeof entry === 'object') {
      const record = entry as Record<string, unknown>
      const safe = sanitizeExternalUrl(record.url)
      if (safe) {
        items.push({
          url: safe,
          caption: typeof record.caption === 'string' ? record.caption : undefined,
        })
      }
    }
  }
  return items
}

function GallerySection({ section, config }: { section: SectionConfig; config: SiteConfig }) {
  const title = (section.content.title as string) ?? 'Galería de taller'
  const subtitle = (section.content.subtitle as string) ?? ''
  const images = normalizeGalleryImages(section.content.images)

  const header = (
    <div style={{ marginBottom: '2rem' }}>
      {title && <h2 style={{ margin: '0 0 0.4rem', fontSize: 'var(--text-2xl)', fontWeight: 400 }}>{title}</h2>}
      {subtitle && <p style={{ margin: 0, opacity: 0.65, fontSize: 'var(--text-sm)' }}>{subtitle}</p>}
    </div>
  )

  if (images.length === 0) {
    return (
      <section className="qs-section-pad" style={{ padding: '4rem 2rem' }}>
        <ContentWrapper width={config.sizes.contentWidth}>
          {header}
          <div style={{ border: '1px dashed currentColor', opacity: 0.45, padding: '2rem', textAlign: 'center', borderRadius: 'var(--radius-card)' }}>
            <p style={{ margin: 0 }}>Galería vacía — agrega o sube imágenes desde el inspector lateral.</p>
          </div>
        </ContentWrapper>
      </section>
    )
  }

  if (section.variant === 'carousel') {
    return (
      <section className="qs-section-pad" style={{ padding: '4rem 2rem' }}>
        <ContentWrapper width={config.sizes.contentWidth}>
          {header}
          <div style={{ display: 'flex', gap: '1.25rem', overflowX: 'auto', scrollSnapType: 'x mandatory', paddingBottom: '0.75rem' }}>
            {images.map((img, i) => (
              <figure key={i} style={{ margin: 0, flex: '0 0 300px', scrollSnapAlign: 'start' }}>
                <div style={{ aspectRatio: '4/3', overflow: 'hidden', borderRadius: 'var(--radius-media)', border: 'var(--card-border)' }}>
                  <img src={img.url} alt={img.caption ?? title} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                </div>
                {img.caption && <figcaption style={{ marginTop: '0.5rem', fontSize: 'var(--text-xs)', opacity: 0.7 }}>{img.caption}</figcaption>}
              </figure>
            ))}
          </div>
        </ContentWrapper>
      </section>
    )
  }

  if (section.variant === 'masonry') {
    return (
      <section className="qs-section-pad" style={{ padding: '4rem 2rem' }}>
        <ContentWrapper width={config.sizes.contentWidth}>
          {header}
          <div style={{ columnCount: 3, columnGap: '1rem' }}>
            {images.map((img, i) => (
              <figure key={i} style={{ margin: '0 0 1rem', breakInside: 'avoid' }}>
                <img src={img.url} alt={img.caption ?? title} style={{ width: '100%', height: 'auto', display: 'block', borderRadius: 'var(--radius-media)' }} />
                {img.caption && <figcaption style={{ marginTop: '0.4rem', fontSize: 'var(--text-xs)', opacity: 0.7 }}>{img.caption}</figcaption>}
              </figure>
            ))}
          </div>
        </ContentWrapper>
      </section>
    )
  }

  return (
    <section className="qs-section-pad" style={{ padding: '4rem 2rem' }}>
      <ContentWrapper width={config.sizes.contentWidth}>
        {header}
        <div
          className="qs-grid-responsive"
          style={{ display: 'grid', gridTemplateColumns: `repeat(${config.sizes.columns}, 1fr)`, gap: '1.25rem' }}
        >
          {images.map((img, i) => (
            <figure key={i} style={{ margin: 0 }}>
              <div style={{ aspectRatio: '1', overflow: 'hidden', borderRadius: 'var(--radius-media)', border: 'var(--card-border)' }}>
                <img src={img.url} alt={img.caption ?? title} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
              </div>
              {img.caption && <figcaption style={{ marginTop: '0.5rem', fontSize: 'var(--text-xs)', opacity: 0.7 }}>{img.caption}</figcaption>}
            </figure>
          ))}
        </div>
      </ContentWrapper>
    </section>
  )
}

type PressItem = {
  title: string
  publication: string
  year?: string | number
  url?: string
  quote?: string
}

function PressSection({ section, config }: { section: SectionConfig; config: SiteConfig }) {
  const title = (section.content.title as string) ?? 'Prensa y reconocimientos'
  const items = Array.isArray(section.content.items) ? (section.content.items as PressItem[]) : []

  if (section.variant === 'cards') {
    return (
      <section className="qs-section-pad" style={{ padding: '4rem 2rem' }}>
        <ContentWrapper width={config.sizes.contentWidth}>
          {title && <h2 style={{ margin: '0 0 2rem', fontSize: 'var(--text-2xl)', fontWeight: 400 }}>{title}</h2>}
          <div className="qs-grid-responsive" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.5rem' }}>
            {items.map((item, i) => {
              const safeUrl = sanitizeExternalUrl(item.url)
              return (
                <article
                  key={i}
                  style={{
                    border: '1px solid currentColor',
                    borderRadius: 'var(--radius-card)',
                    padding: '1.5rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.5rem',
                  }}
                >
                  <div style={{ fontSize: 'var(--text-xs)', opacity: 0.6, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                    {item.publication}{item.year ? ` · ${item.year}` : ''}
                  </div>
                  <h3 style={{ margin: 0, fontSize: 'var(--text-lg)', fontWeight: 500 }}>{item.title}</h3>
                  {item.quote && <p style={{ margin: 0, fontSize: 'var(--text-sm)', opacity: 0.8, lineHeight: 1.6 }}>“{item.quote}”</p>}
                  {safeUrl && (
                    <a href={safeUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-accent)', fontSize: 'var(--text-sm)', marginTop: 'auto' }}>
                      Leer publicación →
                    </a>
                  )}
                </article>
              )
            })}
          </div>
        </ContentWrapper>
      </section>
    )
  }

  return (
    <section className="qs-section-pad" style={{ padding: '4rem 2rem' }}>
      <ContentWrapper width={config.sizes.contentWidth}>
        {title && <h2 style={{ margin: '0 0 2rem', fontSize: 'var(--text-2xl)', fontWeight: 400 }}>{title}</h2>}
        <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
          {items.map((item, i) => {
            const safeUrl = sanitizeExternalUrl(item.url)
            return (
              <li key={i} style={{ padding: '1.25rem 0', borderBottom: '1px solid currentColor', display: 'flex', justifyContent: 'space-between', gap: '1.5rem', alignItems: 'baseline', flexWrap: 'wrap' }}>
                <div>
                  <span style={{ fontSize: 'var(--text-xs)', opacity: 0.55, marginRight: '0.75rem' }}>{item.year}</span>
                  <strong style={{ fontWeight: 500 }}>{item.title}</strong>
                  <span style={{ opacity: 0.65, marginLeft: '0.75rem', fontSize: 'var(--text-sm)' }}>{item.publication}</span>
                  {item.quote && <p style={{ margin: '0.4rem 0 0', fontSize: 'var(--text-sm)', opacity: 0.75 }}>“{item.quote}”</p>}
                </div>
                {safeUrl && (
                  <a href={safeUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-accent)', fontSize: 'var(--text-sm)' }}>
                    Leer →
                  </a>
                )}
              </li>
            )
          })}
        </ul>
      </ContentWrapper>
    </section>
  )
}

function VideoSection({ section, config }: { section: SectionConfig; config: SiteConfig }) {
  const title = (section.content.title as string) ?? ''
  const caption = (section.content.caption as string) ?? ''
  const embedUrl = parseVideoEmbedUrl(section.content.url)

  const player = embedUrl ? (
    <div style={{ position: 'relative', width: '100%', aspectRatio: '16/9', background: '#000', borderRadius: 'var(--radius-media)', overflow: 'hidden' }}>
      <iframe
        src={embedUrl}
        title={title || 'Video del artista'}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 0 }}
      />
    </div>
  ) : (
    <div style={{ aspectRatio: '16/9', border: '1px dashed currentColor', borderRadius: 'var(--radius-media)', opacity: 0.45, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem', textAlign: 'center' }}>
      <p style={{ margin: 0 }}>Pega un enlace válido de YouTube o Vimeo en el inspector.</p>
    </div>
  )

  if (section.variant === 'split') {
    return (
      <section className="qs-section-pad" style={{ padding: '4rem 2rem' }}>
        <ContentWrapper width={config.sizes.contentWidth}>
          <div className="qs-split-responsive" style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: '2.5rem', alignItems: 'center' }}>
            <div>
              {title && <h2 style={{ margin: '0 0 0.75rem', fontSize: 'var(--text-2xl)', fontWeight: 400 }}>{title}</h2>}
              {caption && <p style={{ margin: 0, opacity: 0.75, lineHeight: 1.7 }}>{caption}</p>}
            </div>
            {player}
          </div>
        </ContentWrapper>
      </section>
    )
  }

  return (
    <section className="qs-section-pad" style={{ padding: '4rem 2rem' }}>
      <ContentWrapper width={config.sizes.contentWidth}>
        {title && <h2 style={{ margin: '0 0 1.25rem', fontSize: 'var(--text-2xl)', fontWeight: 400 }}>{title}</h2>}
        {player}
        {caption && <p style={{ margin: '0.85rem 0 0', opacity: 0.7, fontSize: 'var(--text-sm)' }}>{caption}</p>}
      </ContentWrapper>
    </section>
  )
}

function CtaSection({ section, config, artistSlug }: { section: SectionConfig; config: SiteConfig; artistSlug: string }) {
  const isClosed = section.content.status === 'closed'
  const closedMessage =
    (section.content.closedMessage as string) ||
    'La lista de encargos está cerrada temporalmente. Déjanos tu correo en el newsletter para enterarte cuando abramos nuevos cupos.'
  const title = (section.content.title as string) ?? '¿Buscas una obra a medida?'
  const description = (section.content.description as string) ?? ''
  const buttonText = (section.content.buttonText as string)?.trim() || config.button.buyText
  const customHref = sanitizeHref(section.content.buttonHref)
  const waHref = buildWhatsappUrl(
    section.content.whatsapp,
    `Hola ${artistSlug}, me gustaría consultar por un encargo o pieza personalizada.`
  )
  const href = customHref ?? waHref ?? '#contact'

  if (isClosed) {
    return (
      <section className="qs-section-pad" style={{ padding: '4rem 2rem' }}>
        <ContentWrapper width={config.sizes.contentWidth}>
          <div
            style={{
              maxWidth: '720px',
              margin: '0 auto',
              padding: '2.5rem 2rem',
              border: '1px solid currentColor',
              borderRadius: 'var(--radius-card)',
              textAlign: 'center',
            }}
          >
            <span style={{ fontSize: 'var(--text-xs)', letterSpacing: '0.2em', textTransform: 'uppercase', opacity: 0.65, display: 'block', marginBottom: '0.6rem' }}>
              Lista de encargos
            </span>
            <h2 style={{ margin: '0 0 0.75rem', fontSize: 'var(--text-2xl)', fontWeight: 700 }}>
              Cupos cerrados por ahora
            </h2>
            <p style={{ margin: 0, opacity: 0.8, lineHeight: 1.65 }}>{closedMessage}</p>
          </div>
        </ContentWrapper>
      </section>
    )
  }

  if (section.variant === 'minimal') {
    return (
      <section className="qs-section-pad" style={{ padding: '4rem 2rem', textAlign: 'center' }}>
        <ContentWrapper width={config.sizes.contentWidth}>
          <h2 style={{ margin: '0 0 0.75rem', fontSize: 'var(--text-2xl)', fontWeight: 400 }}>{title}</h2>
          {description && <p style={{ margin: '0 auto 1.5rem', maxWidth: '580px', opacity: 0.75, lineHeight: 1.7 }}>{description}</p>}
          <Button shape={config.button.shape} style={config.button.style} href={href}>
            {buttonText}
          </Button>
        </ContentWrapper>
      </section>
    )
  }

  if (section.variant === 'split') {
    return (
      <section className="qs-section-pad" style={{ padding: '4rem 2rem' }}>
        <ContentWrapper width={config.sizes.contentWidth}>
          <div
            className="qs-split-responsive"
            style={{
              display: 'grid',
              gridTemplateColumns: '1.5fr auto',
              gap: '2rem',
              alignItems: 'center',
              padding: '2.5rem',
              border: '1px solid currentColor',
              borderRadius: 'var(--radius-card)',
            }}
          >
            <div>
              <h2 style={{ margin: '0 0 0.5rem', fontSize: 'var(--text-2xl)', fontWeight: 400 }}>{title}</h2>
              {description && <p style={{ margin: 0, opacity: 0.75, lineHeight: 1.65 }}>{description}</p>}
            </div>
            <Button shape={config.button.shape} style={config.button.style} href={href}>
              {buttonText}
            </Button>
          </div>
        </ContentWrapper>
      </section>
    )
  }

  return (
    <section className="qs-section-pad" style={{ padding: '4rem 2rem' }}>
      <ContentWrapper width={config.sizes.contentWidth}>
        <div
          style={{
            padding: '3rem 2rem',
            border: '1px solid var(--color-accent)',
            borderRadius: 'var(--radius-card)',
            textAlign: 'center',
          }}
        >
          <h2 style={{ margin: '0 0 0.75rem', fontSize: 'var(--text-3xl)', fontWeight: 400 }}>{title}</h2>
          {description && <p style={{ margin: '0 auto 1.75rem', maxWidth: '600px', opacity: 0.8, lineHeight: 1.7 }}>{description}</p>}
          <Button shape={config.button.shape} style={config.button.style} href={href}>
            {buttonText}
          </Button>
        </div>
      </ContentWrapper>
    </section>
  )
}

function DividerSection({ section }: { section: SectionConfig }) {
  const heightMap: Record<string, string> = { sm: '1.5rem', md: '3rem', lg: '5rem' }
  const py = heightMap[String(section.content.height ?? 'md')] ?? '3rem'
  const label = (section.content.label as string) ?? ''

  if (section.variant === 'space') {
    return <div style={{ height: py }} aria-hidden="true" />
  }

  if (section.variant === 'ornament') {
    return (
      <div style={{ padding: `${py} 2rem`, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem' }}>
        <span style={{ width: '40px', height: '1px', backgroundColor: 'var(--color-accent)', opacity: 0.6 }} />
        {label && (
          <span style={{ fontSize: 'var(--text-xs)', letterSpacing: '0.2em', textTransform: 'uppercase', opacity: 0.55 }}>
            {label}
          </span>
        )}
        <span style={{ width: '40px', height: '1px', backgroundColor: 'var(--color-accent)', opacity: 0.6 }} />
      </div>
    )
  }

  return (
    <div style={{ padding: `${py} 2rem` }}>
      <hr style={{ border: 0, borderTop: '1px solid currentColor', opacity: 0.15, margin: 0 }} />
    </div>
  )
}

function MarqueeSection({ section }: { section: SectionConfig }) {
  const items = Array.isArray(section.content.items)
    ? (section.content.items as unknown[]).map((v) => String(v)).filter((s) => s.trim().length > 0)
    : ['OBRAS ORIGINALES', 'EDICIONES LIMITADAS']
  const displayItems = items.length > 0 ? items : ['ARTE ORIGINAL']
  const repeated = [...displayItems, ...displayItems, ...displayItems, ...displayItems]

  const angle = Number(section.content.angle ?? 0) || 0
  const direction = section.content.direction === 'right' ? 'qs-marquee-right' : 'qs-marquee-left'
  const bgColor = (section.content.bgColor as string) || 'transparent'
  const textColor = (section.content.textColor as string) || 'var(--color-text)'
  const pillBg = (section.content.pillBg as string) || '#ec9fbf'
  const pillText = (section.content.pillText as string) || '#4b0303'
  const isPills = section.variant !== 'text'

  return (
    <div style={{ overflow: 'hidden', padding: angle !== 0 ? '1.85rem 0' : '1rem 0' }}>
      <div
        style={{
          transform: angle !== 0 ? `rotate(${angle}deg) scale(1.04)` : undefined,
          backgroundColor: bgColor,
          color: textColor,
          padding: '0.65rem 0',
          borderTop: bgColor !== 'transparent' ? '1px solid rgba(128,128,128,0.2)' : undefined,
          borderBottom: bgColor !== 'transparent' ? '1px solid rgba(128,128,128,0.2)' : undefined,
        }}
      >
        <div
          className="qs-marquee-track"
          style={{
            display: 'flex',
            width: 'max-content',
            gap: isPills ? '1rem' : '2.5rem',
            animation: `${direction} 24s linear infinite`,
          }}
        >
          {repeated.map((txt, idx) =>
            isPills ? (
              <span
                key={idx}
                style={{
                  padding: '0.45rem 1.25rem',
                  borderRadius: '9999px',
                  backgroundColor: pillBg,
                  color: pillText,
                  border: `1px solid ${pillText}`,
                  fontFamily: 'var(--font-heading)',
                  fontSize: 'var(--text-lg)',
                  fontWeight: 600,
                  letterSpacing: '0.04em',
                  whiteSpace: 'nowrap',
                }}
              >
                {txt}
              </span>
            ) : (
              <span
                key={idx}
                style={{
                  fontFamily: 'var(--font-heading)',
                  fontSize: 'var(--text-3xl)',
                  fontWeight: 700,
                  letterSpacing: '0.04em',
                  whiteSpace: 'nowrap',
                }}
              >
                {txt}
              </span>
            )
          )}
        </div>
      </div>
    </div>
  )
}

function FeatureSplitSection({ section, config }: { section: SectionConfig; config: SiteConfig }) {
  const eyebrow = (section.content.eyebrow as string) ?? ''
  const heading = (section.content.heading as string) ?? ''
  const text = (section.content.text as string) ?? ''
  const signature = (section.content.signature as string) ?? ''
  const buttonText = (section.content.buttonText as string)?.trim() || ''
  const buttonHref = sanitizeHref(section.content.buttonHref) ?? '#contact'
  const imageUrl = sanitizeExternalUrl(section.content.imageUrl)

  const isFramed = section.variant !== 'open'
  const isReversed = section.variant === 'reversed'

  const mediaPane = (
    <div style={{ position: 'relative', minHeight: '320px', height: '100%', backgroundColor: 'rgba(128,128,128,0.08)' }}>
      {imageUrl && (
        <img
          src={imageUrl}
          alt={heading || 'Imagen de historia'}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        />
      )}
    </div>
  )

  const textPane = (
    <div style={{ padding: '2.75rem 2.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '1rem' }}>
      {eyebrow && (
        <span style={{ fontSize: 'var(--text-xs)', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--color-accent)', fontWeight: 700 }}>
          {eyebrow}
        </span>
      )}
      {heading && <h2 style={{ margin: 0, fontSize: 'var(--text-3xl)', fontWeight: 700, lineHeight: 1.05 }}>{heading}</h2>}
      {text && <p style={{ margin: 0, fontSize: 'var(--text-base)', lineHeight: 1.75, opacity: 0.85, whiteSpace: 'pre-line' }}>{text}</p>}
      {signature && <p style={{ margin: 0, fontSize: 'var(--text-sm)', fontWeight: 600, opacity: 0.7 }}>{signature}</p>}
      {buttonText && (
        <div style={{ marginTop: '0.35rem' }}>
          <Button shape={config.button.shape} style={config.button.style} href={buttonHref}>
            {buttonText}
          </Button>
        </div>
      )}
    </div>
  )

  return (
    <section className="qs-section-pad" style={{ padding: '3rem 2rem' }}>
      <ContentWrapper width={config.sizes.contentWidth}>
        <div
          className="qs-split-responsive"
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            border: isFramed ? '1px solid currentColor' : 'none',
            borderRadius: 'var(--radius-card)',
            overflow: 'hidden',
          }}
        >
          {isReversed ? (
            <>
              {textPane}
              {mediaPane}
            </>
          ) : (
            <>
              {mediaPane}
              {textPane}
            </>
          )}
        </div>
      </ContentWrapper>
    </section>
  )
}

function SocialStripSection({
  section,
  config,
  works,
}: {
  section: SectionConfig
  config: SiteConfig
  works: Artwork[]
}) {
  const eyebrow = (section.content.eyebrow as string) || 'ENCUÉNTRANOS EN REDES'
  const handle = (section.content.handle as string) || '@TU.ESTUDIO'
  const customImages = normalizeGalleryImages(section.content.images)
  const fallbackImages: GalleryImage[] =
    customImages.length > 0
      ? customImages
      : works.slice(0, 8).map((w) => ({ url: w.images[0], caption: w.title }))

  const isGrid = section.variant === 'grid'
  const stripImages = isGrid ? fallbackImages : [...fallbackImages, ...fallbackImages]

  return (
    <section className="qs-section-pad" style={{ padding: '3.5rem 0', overflow: 'hidden' }}>
      <ContentWrapper width={config.sizes.contentWidth}>
        <div style={{ textAlign: 'center', marginBottom: '1.75rem', padding: '0 1.5rem' }}>
          {eyebrow && (
            <span style={{ display: 'block', fontSize: 'var(--text-xs)', letterSpacing: '0.25em', textTransform: 'uppercase', opacity: 0.55, marginBottom: '0.35rem' }}>
              {eyebrow}
            </span>
          )}
          <h2 style={{ margin: 0, fontSize: 'var(--text-3xl)', fontWeight: 700, opacity: 0.88 }}>{handle}</h2>
        </div>
      </ContentWrapper>

      {stripImages.length === 0 ? (
        <div style={{ maxWidth: '640px', margin: '0 auto', padding: '1.5rem', border: '1px dashed currentColor', opacity: 0.45, textAlign: 'center', borderRadius: 'var(--radius-card)' }}>
          Agrega fotos de estudio o usa tus obras registradas para poblar esta tira.
        </div>
      ) : isGrid ? (
        <ContentWrapper width={config.sizes.contentWidth}>
          <div className="qs-grid-responsive" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem', padding: '0 2rem' }}>
            {stripImages.map((img, i) => (
              <div key={i} style={{ aspectRatio: '1', overflow: 'hidden', borderRadius: 'var(--radius-media)', border: 'var(--card-border)' }}>
                <img src={img.url} alt={img.caption ?? handle} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
              </div>
            ))}
          </div>
        </ContentWrapper>
      ) : (
        <div
          className="qs-marquee-track"
          style={{
            display: 'flex',
            width: 'max-content',
            gap: '0.85rem',
            animation: 'qs-marquee-left 32s linear infinite',
          }}
        >
          {stripImages.map((img, i) => (
            <div
              key={i}
              style={{
                width: '210px',
                height: '210px',
                flexShrink: 0,
                overflow: 'hidden',
                borderRadius: 'var(--radius-media)',
                border: 'var(--card-border)',
              }}
            >
              <img src={img.url} alt={img.caption ?? handle} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

type ReviewItem = {
  author: string
  role?: string
  quote: string
  rating?: number
  imageUrl?: string
  videoUrl?: string
}

function ReviewsSection({ section, config }: { section: SectionConfig; config: SiteConfig }) {
  const eyebrow = (section.content.eyebrow as string) || ''
  const title = (section.content.title as string) || 'RESEÑAS'
  const items = Array.isArray(section.content.items) ? (section.content.items as ReviewItem[]) : []

  const header = (
    <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
      {eyebrow && (
        <span style={{ display: 'block', fontSize: 'var(--text-xs)', letterSpacing: '0.2em', textTransform: 'uppercase', opacity: 0.6, marginBottom: '0.35rem' }}>
          {eyebrow}
        </span>
      )}
      {title && <h2 style={{ margin: 0, fontSize: 'var(--text-3xl)', fontWeight: 700 }}>{title}</h2>}
    </div>
  )

  if (section.variant === 'video-strip') {
    return (
      <section className="qs-section-pad" style={{ padding: '4rem 2rem' }}>
        <ContentWrapper width={config.sizes.contentWidth}>
          {header}
          <div style={{ display: 'flex', gap: '1rem', overflowX: 'auto', scrollSnapType: 'x mandatory', paddingBottom: '0.75rem' }}>
            {items.map((item, idx) => {
              const thumb = sanitizeExternalUrl(item.imageUrl)
              const videoHref = sanitizeExternalUrl(item.videoUrl)
              return (
                <article
                  key={idx}
                  style={{
                    flex: '0 0 230px',
                    scrollSnapAlign: 'start',
                    borderRadius: 'var(--radius-media)',
                    border: '1px solid currentColor',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                  }}
                >
                  <div style={{ position: 'relative', aspectRatio: '9/14', backgroundColor: '#111', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {thumb && <img src={thumb} alt={item.author} style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.78 }} />}
                    <span
                      style={{
                        position: 'absolute',
                        width: '48px',
                        height: '48px',
                        borderRadius: '9999px',
                        border: '2px solid #fff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1rem',
                        backgroundColor: 'rgba(0,0,0,0.35)',
                      }}
                    >
                      ▶
                    </span>
                  </div>
                  <div style={{ padding: '0.85rem' }}>
                    <p style={{ margin: '0 0 0.35rem', fontSize: 'var(--text-xs)', lineHeight: 1.5, opacity: 0.85 }}>“{item.quote}”</p>
                    <strong style={{ fontSize: 'var(--text-xs)' }}>{item.author}</strong>
                    {videoHref && (
                      <a href={videoHref} target="_blank" rel="noopener noreferrer" style={{ display: 'block', marginTop: '0.3rem', fontSize: '0.7rem', color: 'var(--color-accent)' }}>
                        Ver clip →
                      </a>
                    )}
                  </div>
                </article>
              )
            })}
          </div>
        </ContentWrapper>
      </section>
    )
  }

  return (
    <section className="qs-section-pad" style={{ padding: '4rem 2rem' }}>
      <ContentWrapper width={config.sizes.contentWidth}>
        {header}
        <div
          className="qs-grid-responsive"
          style={{
            display: 'grid',
            gridTemplateColumns: section.variant === 'minimal' ? '1fr' : 'repeat(2, 1fr)',
            gap: '1.25rem',
            maxWidth: section.variant === 'minimal' ? '740px' : undefined,
            margin: section.variant === 'minimal' ? '0 auto' : undefined,
          }}
        >
          {items.map((item, idx) => (
            <article
              key={idx}
              style={{
                padding: '1.5rem',
                border: section.variant === 'minimal' ? 'none' : '1px solid currentColor',
                borderBottom: section.variant === 'minimal' ? '1px solid rgba(128,128,128,0.25)' : undefined,
                borderRadius: section.variant === 'minimal' ? undefined : 'var(--radius-card)',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.6rem',
              }}
            >
              <div style={{ color: 'var(--color-accent)', fontSize: '0.9rem' }} aria-label={`${item.rating ?? 5} de 5 estrellas`}>
                {'★'.repeat(Math.max(1, Math.min(5, item.rating ?? 5)))}
              </div>
              <p style={{ margin: 0, fontSize: 'var(--text-base)', lineHeight: 1.65 }}>“{item.quote}”</p>
              <div style={{ fontSize: 'var(--text-xs)', opacity: 0.7 }}>
                <strong>{item.author}</strong>
                {item.role ? ` · ${item.role}` : ''}
              </div>
            </article>
          ))}
        </div>
      </ContentWrapper>
    </section>
  )
}
