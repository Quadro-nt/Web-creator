import type { SectionConfig, SiteConfig } from '@/lib/schemas/site-config.schema'
import { ContentWrapper } from '@/components/ContentWrapper'


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
  const heading = (section.content.heading as string) ?? ''
  const exhibitions = Array.isArray(section.content.exhibitions)
    ? (section.content.exhibitions as Exhibition[])
    : []
  const width = config?.sizes.contentWidth ?? 'mid'

  if (section.variant === 'cards') {
    return (
      <section
        className="qs-section-pad"
        style={{
          padding: '4rem 2rem',
          backgroundColor: 'var(--color-bg)',
          color: 'var(--color-text)',
        }}
      >
        <ContentWrapper width={width}>
          {heading && <h2 style={{ fontFamily: 'var(--qs-font-heading)', margin: '0 0 2rem', fontSize: 'var(--text-2xl)', fontWeight: 400 }}>{heading}</h2>}
          <div className="qs-grid-responsive" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.25rem' }}>
            {exhibitions.map((exhibition, i) => (
              <div key={i} style={{ border: '1px solid var(--qs-border)', padding: '1.25rem' }}>
                <span style={{ fontSize: 'var(--text-xs)', opacity: 0.6, letterSpacing: '0.1em' }}>
                  {exhibition.year}
                </span>
                <h3 style={{ margin: '0.4rem 0 0.25rem', fontWeight: 500, fontSize: 'var(--text-lg)' }}>
                  {exhibition.title}
                </h3>
                <p style={{ margin: 0, opacity: 0.7, fontSize: 'var(--text-sm)' }}>{exhibition.place}</p>
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
          padding: '4rem 2rem',
          backgroundColor: 'var(--color-bg)',
          color: 'var(--color-text)',
        }}
      >
        <ContentWrapper width={width}>
          <div style={{ maxWidth: '700px', margin: '0 auto' }}>
            {heading && <h2 style={{ fontFamily: 'var(--qs-font-heading)', margin: '0 0 2rem', fontSize: 'var(--text-2xl)', fontWeight: 400 }}>{heading}</h2>}
            <div style={{ position: 'relative', paddingLeft: '2rem' }}>
              <div
                style={{
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  bottom: 0,
                  width: '1px',
                  backgroundColor: 'var(--color-accent)',
                  opacity: 0.35,
                }}
              />
              {exhibitions.map((exhibition, i) => (
                <div key={i} style={{ position: 'relative', marginBottom: '2.25rem' }}>
                  <div
                    style={{
                      position: 'absolute',
                      left: '-2.4rem',
                      top: '0.4rem',
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      backgroundColor: 'var(--color-accent)',
                    }}
                  />
                  <span style={{ fontSize: 'var(--text-xs)', opacity: 0.6, letterSpacing: '0.1em' }}>
                    {exhibition.year}
                  </span>
                  <h3 style={{ margin: '0.25rem 0 0.1rem', fontWeight: 400, fontSize: 'var(--text-lg)' }}>
                    {exhibition.title}
                  </h3>
                  <p style={{ margin: 0, opacity: 0.65, fontSize: 'var(--text-sm)' }}>{exhibition.place}</p>
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
        padding: '4rem 2rem',
        backgroundColor: 'var(--color-bg)',
        color: 'var(--color-text)',
      }}
    >
      <ContentWrapper width={width}>
        <div style={{ maxWidth: '700px', margin: '0 auto' }}>
          {heading && <h2 style={{ fontFamily: 'var(--qs-font-heading)', margin: '0 0 1.5rem', fontSize: 'var(--text-2xl)', fontWeight: 400 }}>{heading}</h2>}
          <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
            {exhibitions.map((exhibition, i) => (
              <li
                key={i}
                style={{
                  display: 'flex',
                  gap: '1.5rem',
                  alignItems: 'baseline',
                  padding: '1rem 0',
                  borderBottom: '1px solid var(--qs-border)',
                  opacity: 0.85,
                }}
              >
                <span style={{ opacity: 0.6, fontSize: 'var(--text-sm)', minWidth: '3rem' }}>
                  {exhibition.year}
                </span>
                <div>
                  <span style={{ fontWeight: 400 }}>{exhibition.title}</span>
                  <span style={{ opacity: 0.6, marginLeft: '0.75rem', fontSize: 'var(--text-sm)' }}>
                    {exhibition.place}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </ContentWrapper>
    </section>
  )
}
