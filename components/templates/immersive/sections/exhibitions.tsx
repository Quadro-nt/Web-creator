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

export default function ImmersiveExhibitions({ section }: Props) {
  const exhibitions = (section.content.exhibitions as Exhibition[]) ?? []

  if (section.variant === 'timeline') {
    return (
      <div
        style={{
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          backgroundColor: 'var(--color-bg)',
          color: 'var(--color-text)',
          padding: '5rem',
          overflowY: 'auto',
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 2fr',
            gap: '5rem',
            alignItems: 'start',
            width: '100%',
          }}
        >
          <div>
            <span
              style={{
                fontSize: '0.65rem',
                letterSpacing: '0.4em',
                textTransform: 'uppercase',
                color: 'var(--color-accent)',
                display: 'block',
                marginBottom: '1rem',
              }}
            >
              Trayectoria
            </span>
            <h2
              style={{
                fontSize: 'clamp(2rem, 4vw, 3.5rem)',
                fontWeight: 300,
                letterSpacing: '0.05em',
                margin: 0,
                lineHeight: 1.1,
                color: '#f0f0f0',
              }}
            >
              Expo-<br />siciones
            </h2>
          </div>
          <div style={{ position: 'relative', paddingLeft: '2.5rem' }}>
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
              <div key={i} style={{ position: 'relative', marginBottom: '2.5rem' }}>
                <div
                  style={{
                    position: 'absolute',
                    left: '-2.9rem',
                    top: '0.3rem',
                    width: '8px',
                    height: '8px',
                    backgroundColor: 'var(--color-accent)',
                    opacity: 0.8,
                  }}
                />
                <span
                  style={{
                    fontSize: '0.65rem',
                    letterSpacing: '0.3em',
                    textTransform: 'uppercase',
                    color: 'var(--color-accent)',
                    display: 'block',
                    marginBottom: '0.4rem',
                    opacity: 0.7,
                  }}
                >
                  {exhibition.year}
                </span>
                <h3
                  style={{
                    margin: '0 0 0.3rem',
                    fontWeight: 400,
                    fontSize: '1.1rem',
                    letterSpacing: '0.02em',
                    color: '#f0f0f0',
                  }}
                >
                  {exhibition.title}
                </h3>
                <p style={{ margin: 0, opacity: 0.4, fontSize: '0.85rem', letterSpacing: '0.05em' }}>
                  {exhibition.place}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // Default: 'list'
  return (
    <div
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        backgroundColor: 'var(--color-bg)',
        color: 'var(--color-text)',
        padding: '5rem',
        overflowY: 'auto',
      }}
    >
      <span
        style={{
          fontSize: '0.65rem',
          letterSpacing: '0.4em',
          textTransform: 'uppercase',
          color: 'var(--color-accent)',
          display: 'block',
          marginBottom: '1rem',
        }}
      >
        Trayectoria
      </span>
      <h2
        style={{
          fontSize: 'clamp(2rem, 4vw, 3.5rem)',
          fontWeight: 300,
          letterSpacing: '0.05em',
          margin: '0 0 3rem',
          color: '#f0f0f0',
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
              gap: '2.5rem',
              alignItems: 'baseline',
              padding: '1.5rem 0',
              borderBottom: '1px solid rgba(240,240,240,0.07)',
            }}
          >
            <span
              style={{
                fontSize: '0.75rem',
                letterSpacing: '0.15em',
                color: 'var(--color-accent)',
                fontWeight: 400,
                opacity: 0.8,
              }}
            >
              {exhibition.year}
            </span>
            <div>
              <span
                style={{
                  fontWeight: 400,
                  fontSize: '1rem',
                  letterSpacing: '0.02em',
                  display: 'block',
                  marginBottom: '0.3rem',
                  color: '#f0f0f0',
                }}
              >
                {exhibition.title}
              </span>
              <span style={{ opacity: 0.4, fontSize: '0.85rem', letterSpacing: '0.05em' }}>
                {exhibition.place}
              </span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
