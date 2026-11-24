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

export default function Exhibitions({ section, config }: Props) {
  const heading = (section.content.heading as string) || 'Exposiciones'
  const exhibitions = Array.isArray(section.content.exhibitions)
    ? (section.content.exhibitions as Exhibition[])
    : []
  const width = config?.sizes.contentWidth ?? 'full'

  if (section.variant === 'cards') {
    return (
      <section
        className="qs-section-pad"
        style={{
          padding: '6rem 5rem',
          backgroundColor: 'var(--color-bg)',
          color: 'var(--color-text)',
          borderTop: '1px solid var(--qs-border)',
        }}
      >
        <ContentWrapper width={width}>
          <h2 style={{ fontFamily: 'var(--qs-font-heading)', fontSize: 'var(--text-3xl)', fontWeight: 700, letterSpacing: '-0.02em', margin: '0 0 2.5rem' }}>
            {heading}
          </h2>
          <div className="qs-grid-responsive" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem' }}>
            {exhibitions.map((exhibition, i) => (
              <div key={i} style={{ border: '2px solid var(--color-text)', padding: '1.5rem' }}>
                <span style={{ fontSize: 'var(--text-xs)', letterSpacing: '0.15em', opacity: 0.55 }}>{exhibition.year}</span>
                <h3 style={{ margin: '0.5rem 0 0.25rem', fontWeight: 700, fontSize: 'var(--text-lg)' }}>{exhibition.title}</h3>
                <p style={{ margin: 0, opacity: 0.65, fontSize: 'var(--text-sm)' }}>{exhibition.place}</p>
              </div>
            ))}
          </div>
        </ContentWrapper>
      </section>
    )
  }

  if (section.variant === 'timeline') {
    return (
      <section
        className="qs-section-pad"
        style={{
          padding: '6rem 5rem',
          backgroundColor: 'var(--color-bg)',
          color: 'var(--color-text)',
          borderTop: '1px solid var(--qs-border)',
        }}
      >
        <ContentWrapper width={width}>
          <div className="qs-split-responsive" style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '4rem' }}>
            <div>
              <h2 style={{ fontFamily: 'var(--qs-font-heading)', fontSize: 'var(--text-3xl)', fontWeight: 700, letterSpacing: '-0.02em', margin: 0, lineHeight: 1.05 }}>
                {heading}
              </h2>
            </div>
            <div style={{ position: 'relative', paddingLeft: '3rem' }}>
              <div
                style={{
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  bottom: 0,
                  width: '2px',
                  backgroundColor: 'var(--color-accent)',
                  opacity: 0.3,
                }}
              />
              {exhibitions.map((exhibition, i) => (
                <div key={i} style={{ position: 'relative', marginBottom: '2.5rem' }}>
                  <div
                    style={{
                      position: 'absolute',
                      left: '-3.4rem',
                      top: '0.3rem',
                      width: '10px',
                      height: '10px',
                      backgroundColor: 'var(--color-accent)',
                    }}
                  />
                  <span style={{ fontSize: 'var(--text-xs)', letterSpacing: '0.2em', textTransform: 'uppercase', opacity: 0.5, display: 'block', marginBottom: '0.4rem' }}>
                    {exhibition.year}
                  </span>
                  <h3 style={{ margin: '0 0 0.3rem', fontWeight: 700, fontSize: 'var(--text-lg)' }}>{exhibition.title}</h3>
                  <p style={{ margin: 0, opacity: 0.6, fontSize: 'var(--text-sm)' }}>{exhibition.place}</p>
                </div>
              ))}
            </div>
          </div>
        </ContentWrapper>
      </section>
    )
  }

  return (
    <section
      className="qs-section-pad"
      style={{
        padding: '6rem 5rem',
        backgroundColor: 'var(--color-bg)',
        color: 'var(--color-text)',
        borderTop: '1px solid var(--qs-border)',
      }}
    >
      <ContentWrapper width={width}>
        <h2
          style={{
            fontFamily: 'var(--qs-font-heading)',
            fontSize: 'var(--text-3xl)',
            fontWeight: 700,
            letterSpacing: '-0.02em',
            margin: '0 0 3rem',
            borderBottom: '3px solid var(--color-text)',
            paddingBottom: '1rem',
          }}
        >
          {heading}
        </h2>
        <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
          {exhibitions.map((exhibition, i) => (
            <li
              key={i}
              style={{
                display: 'grid',
                gridTemplateColumns: '5rem 1fr',
                gap: '2rem',
                alignItems: 'baseline',
                padding: '1.25rem 0',
                borderBottom: '1px solid var(--qs-border)',
              }}
            >
              <span style={{ fontSize: 'var(--text-xs)', letterSpacing: '0.1em', opacity: 0.5, fontWeight: 600 }}>
                {exhibition.year}
              </span>
              <div>
                <span style={{ fontWeight: 700, fontSize: 'var(--text-base)', display: 'block', marginBottom: '0.2rem' }}>
                  {exhibition.title}
                </span>
                <span style={{ opacity: 0.6, fontSize: 'var(--text-sm)' }}>{exhibition.place}</span>
              </div>
            </li>
          ))}
        </ul>
      </ContentWrapper>
    </section>
  )
}
