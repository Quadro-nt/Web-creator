import type { SiteConfig } from '@/lib/schemas/site-config.schema'
import { ContentWrapper } from '@/components/ContentWrapper'

type SectionConfig = SiteConfig['sections'][number]

type Exhibition = {
  title: string
  year: number | string
  place: string
}

type Props = {
  section: SectionConfig
  config?: SiteConfig
}

export default function ImmersiveExhibitions({ section, config }: Props) {
  const heading = (section.content.heading as string) || 'Exposiciones'
  const exhibitions = Array.isArray(section.content.exhibitions)
    ? (section.content.exhibitions as Exhibition[])
    : []
  const width = config?.sizes.contentWidth ?? 'full'

  if (section.variant === 'cards') {
    return (
      <div className="qs-section-pad" style={{ backgroundColor: 'var(--color-bg)', color: 'var(--color-text)', padding: '5rem' }}>
        <ContentWrapper width={width}>
          <span style={{ fontSize: '0.65rem', letterSpacing: '0.4em', textTransform: 'uppercase', color: 'var(--color-accent)', display: 'block', marginBottom: '1rem' }}>
            Trayectoria
          </span>
          <h2 style={{ fontFamily: 'var(--qs-font-heading)', fontSize: 'var(--text-3xl)', fontWeight: 300, margin: '0 0 2.5rem' }}>{heading}</h2>
          <div className="qs-grid-responsive" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem' }}>
            {exhibitions.map((exhibition, i) => (
              <div key={i} style={{ border: '1px solid var(--qs-border)', padding: '1.5rem' }}>
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-accent)', letterSpacing: '0.2em' }}>{exhibition.year}</span>
                <h3 style={{ margin: '0.5rem 0 0.25rem', fontWeight: 400, fontSize: 'var(--text-lg)' }}>{exhibition.title}</h3>
                <p style={{ margin: 0, opacity: 0.6, fontSize: 'var(--text-sm)' }}>{exhibition.place}</p>
              </div>
            ))}
          </div>
        </ContentWrapper>
      </div>
    )
  }

  if (section.variant === 'timeline') {
    return (
      <div className="qs-section-pad" style={{ height: '100%', display: 'flex', alignItems: 'center', backgroundColor: 'var(--color-bg)', color: 'var(--color-text)', padding: '5rem' }}>
        <ContentWrapper width={width}>
          <div className="qs-split-responsive" style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '4rem', alignItems: 'start', width: '100%' }}>
            <div>
              <span style={{ fontSize: '0.65rem', letterSpacing: '0.4em', textTransform: 'uppercase', color: 'var(--color-accent)', display: 'block', marginBottom: '1rem' }}>
                Trayectoria
              </span>
              <h2 style={{ fontFamily: 'var(--qs-font-heading)', fontSize: 'var(--text-3xl)', fontWeight: 300, letterSpacing: '0.05em', margin: 0, lineHeight: 1.1 }}>
                {heading}
              </h2>
            </div>
            <div style={{ position: 'relative', paddingLeft: '2.5rem' }}>
              <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '1px', backgroundColor: 'var(--color-accent)', opacity: 0.3 }} />
              {exhibitions.map((exhibition, i) => (
                <div key={i} style={{ position: 'relative', marginBottom: '2.5rem' }}>
                  <div style={{ position: 'absolute', left: '-2.9rem', top: '0.3rem', width: '8px', height: '8px', backgroundColor: 'var(--color-accent)', opacity: 0.85 }} />
                  <span style={{ fontSize: '0.65rem', letterSpacing: '0.3em', textTransform: 'uppercase', color: 'var(--color-accent)', display: 'block', marginBottom: '0.4rem' }}>
                    {exhibition.year}
                  </span>
                  <h3 style={{ margin: '0 0 0.3rem', fontWeight: 400, fontSize: 'var(--text-lg)' }}>{exhibition.title}</h3>
                  <p style={{ margin: 0, opacity: 0.55, fontSize: 'var(--text-sm)' }}>{exhibition.place}</p>
                </div>
              ))}
            </div>
          </div>
        </ContentWrapper>
      </div>
    )
  }

  return (
    <div className="qs-section-pad" style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', backgroundColor: 'var(--color-bg)', color: 'var(--color-text)', padding: '5rem' }}>
      <ContentWrapper width={width}>
        <span style={{ fontSize: '0.65rem', letterSpacing: '0.4em', textTransform: 'uppercase', color: 'var(--color-accent)', display: 'block', marginBottom: '1rem' }}>
          Trayectoria
        </span>
        <h2 style={{ fontFamily: 'var(--qs-font-heading)', fontSize: 'var(--text-3xl)', fontWeight: 300, letterSpacing: '0.05em', margin: '0 0 2.5rem' }}>
          {heading}
        </h2>
        <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
          {exhibitions.map((exhibition, i) => (
            <li
              key={i}
              style={{
                display: 'grid',
                gridTemplateColumns: '5rem 1fr',
                gap: '2.5rem',
                alignItems: 'baseline',
                padding: '1.5rem 0',
                borderBottom: '1px solid var(--qs-border)',
              }}
            >
              <span style={{ fontSize: '0.75rem', letterSpacing: '0.15em', color: 'var(--color-accent)', fontWeight: 400 }}>
                {exhibition.year}
              </span>
              <div>
                <span style={{ fontWeight: 400, fontSize: 'var(--text-base)', display: 'block', marginBottom: '0.3rem' }}>
                  {exhibition.title}
                </span>
                <span style={{ opacity: 0.55, fontSize: 'var(--text-sm)' }}>{exhibition.place}</span>
              </div>
            </li>
          ))}
        </ul>
      </ContentWrapper>
    </div>
  )
}
