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
          padding: '6rem 5rem',
          backgroundColor: 'var(--color-bg)',
          color: 'var(--color-text)',
          borderTop: '1px solid rgba(0,0,0,0.1)',
        }}
      >
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '4rem' }}>
          <div>
            <h2
              style={{
                fontSize: 'clamp(2rem, 3.5vw, 3rem)',
                fontWeight: 700,
                letterSpacing: '-0.02em',
                margin: 0,
                lineHeight: 1,
              }}
            >
              Expo-<br />siciones
            </h2>
          </div>
          <div style={{ position: 'relative', paddingLeft: '3rem' }}>
            <div
              style={{
                position: 'absolute',
                left: '0',
                top: 0,
                bottom: 0,
                width: '2px',
                backgroundColor: 'var(--color-accent)',
                opacity: 0.25,
              }}
            />
            {exhibitions.map((exhibition, i) => (
              <div key={i} style={{ position: 'relative', marginBottom: '3rem' }}>
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
                <span
                  style={{
                    fontSize: '0.7rem',
                    letterSpacing: '0.2em',
                    textTransform: 'uppercase',
                    opacity: 0.4,
                    display: 'block',
                    marginBottom: '0.4rem',
                  }}
                >
                  {exhibition.year}
                </span>
                <h3
                  style={{
                    margin: '0 0 0.3rem',
                    fontWeight: 700,
                    fontSize: '1.1rem',
                    letterSpacing: '-0.01em',
                  }}
                >
                  {exhibition.title}
                </h3>
                <p style={{ margin: 0, opacity: 0.5, fontSize: '0.9rem' }}>{exhibition.place}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    )
  }

  // Default: 'list'
  return (
    <section
      style={{
        padding: '6rem 5rem',
        backgroundColor: 'var(--color-bg)',
        color: 'var(--color-text)',
        borderTop: '1px solid rgba(0,0,0,0.1)',
      }}
    >
      <h2
        style={{
          fontSize: 'clamp(2rem, 4vw, 3.5rem)',
          fontWeight: 700,
          letterSpacing: '-0.02em',
          margin: '0 0 3rem',
          borderBottom: '3px solid var(--color-text)',
          paddingBottom: '1rem',
        }}
      >
        Exposiciones
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
              borderBottom: '1px solid rgba(0,0,0,0.1)',
            }}
          >
            <span
              style={{
                fontSize: '0.8rem',
                letterSpacing: '0.1em',
                opacity: 0.4,
                fontWeight: 600,
              }}
            >
              {exhibition.year}
            </span>
            <div>
              <span
                style={{
                  fontWeight: 700,
                  fontSize: '1rem',
                  letterSpacing: '-0.01em',
                  display: 'block',
                  marginBottom: '0.2rem',
                }}
              >
                {exhibition.title}
              </span>
              <span style={{ opacity: 0.5, fontSize: '0.85rem' }}>{exhibition.place}</span>
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}
