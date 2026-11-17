import type { SiteConfig } from '@/lib/schemas/site-config.schema'

type SectionConfig = SiteConfig['sections'][number]

type Exhibition = {
  title: string
  year: number
  place: string
}

type Props = {
  section: SectionConfig
}

export default function Exhibitions({ section }: Props) {
  const exhibitions = (section.content.exhibitions as Exhibition[]) ?? []

  if (section.variant === 'timeline') {
    return (
      <section
        style={{
          padding: '4rem 2rem',
          maxWidth: '700px',
          margin: '0 auto',
          backgroundColor: 'var(--color-bg)',
          color: 'var(--color-text)',
        }}
      >
        <div style={{ position: 'relative', paddingLeft: '2rem' }}>
          <div
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              bottom: 0,
              width: '1px',
              backgroundColor: 'var(--color-accent)',
              opacity: 0.3,
            }}
          />
          {exhibitions.map((exhibition, i) => (
            <div
              key={i}
              style={{ position: 'relative', marginBottom: '2.5rem' }}
            >
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
              <span style={{ fontSize: '0.8rem', opacity: 0.5, letterSpacing: '0.1em' }}>
                {exhibition.year}
              </span>
              <h3 style={{ margin: '0.25rem 0 0.1rem', fontWeight: 400, fontSize: '1rem' }}>
                {exhibition.title}
              </h3>
              <p style={{ margin: 0, opacity: 0.6, fontSize: '0.9rem' }}>{exhibition.place}</p>
            </div>
          ))}
        </div>
      </section>
    )
  }

  // Default: 'list'
  return (
    <section
      style={{
        padding: '4rem 2rem',
        maxWidth: '700px',
        margin: '0 auto',
        backgroundColor: 'var(--color-bg)',
        color: 'var(--color-text)',
      }}
    >
      <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
        {exhibitions.map((exhibition, i) => (
          <li
            key={i}
            style={{
              display: 'flex',
              gap: '1.5rem',
              alignItems: 'baseline',
              padding: '1rem 0',
              borderBottom: '1px solid currentColor',
              opacity: 0.85,
            }}
          >
            <span style={{ opacity: 0.5, fontSize: '0.85rem', minWidth: '3rem' }}>
              {exhibition.year}
            </span>
            <div>
              <span style={{ fontWeight: 400 }}>{exhibition.title}</span>
              <span style={{ opacity: 0.5, marginLeft: '0.75rem', fontSize: '0.9rem' }}>
                {exhibition.place}
              </span>
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}
