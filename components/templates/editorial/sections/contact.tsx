import type { SiteConfig } from '@/lib/schemas/site-config.schema'

type SectionConfig = SiteConfig['sections'][number]

type Props = {
  section: SectionConfig
}

export default function Contact({ section }: Props) {
  const email = (section.content.email as string) ?? ''
  const instagram = (section.content.instagram as string) ?? ''

  if (section.variant === 'form') {
    return (
      <section
        style={{
          padding: '6rem 5rem',
          backgroundColor: 'var(--color-text)',
          color: 'var(--color-bg)',
          borderTop: '1px solid rgba(0,0,0,0.1)',
        }}
      >
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6rem', alignItems: 'start' }}>
          <div>
            <h2
              style={{
                fontSize: 'clamp(2.5rem, 5vw, 4.5rem)',
                fontWeight: 800,
                letterSpacing: '-0.03em',
                margin: '0 0 1.5rem',
                lineHeight: 0.9,
              }}
            >
              Hablemos
            </h2>
            <p
              style={{
                opacity: 0.5,
                fontSize: '0.9rem',
                lineHeight: 1.6,
                margin: '0 0 2rem',
              }}
            >
              Consultas sobre obras, precios y encargos.
            </p>
            {email && (
              <a
                href={`mailto:${email}`}
                style={{
                  display: 'block',
                  color: 'var(--color-bg)',
                  textDecoration: 'none',
                  fontSize: '0.85rem',
                  letterSpacing: '0.08em',
                  opacity: 0.6,
                  marginBottom: '0.5rem',
                }}
              >
                {email}
              </a>
            )}
            {instagram && (
              <a
                href={`https://instagram.com/${instagram.replace('@', '')}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'block',
                  color: 'var(--color-bg)',
                  textDecoration: 'none',
                  fontSize: '0.85rem',
                  letterSpacing: '0.08em',
                  opacity: 0.6,
                }}
              >
                {instagram}
              </a>
            )}
          </div>
          <div>
            {email && (
              <form action={`mailto:${email}`} method="post" encType="text/plain">
                <div style={{ marginBottom: '2rem' }}>
                  <label
                    htmlFor="ed-contact-name"
                    style={{
                      display: 'block',
                      marginBottom: '0.5rem',
                      fontSize: '0.7rem',
                      letterSpacing: '0.2em',
                      textTransform: 'uppercase',
                      opacity: 0.5,
                    }}
                  >
                    Nombre
                  </label>
                  <input
                    id="ed-contact-name"
                    name="nombre"
                    type="text"
                    style={{
                      width: '100%',
                      padding: '0.75rem 0',
                      border: 'none',
                      borderBottom: '1px solid rgba(245,240,232,0.3)',
                      background: 'transparent',
                      color: 'var(--color-bg)',
                      fontSize: '1rem',
                      outline: 'none',
                    }}
                  />
                </div>
                <div style={{ marginBottom: '2rem' }}>
                  <label
                    htmlFor="ed-contact-message"
                    style={{
                      display: 'block',
                      marginBottom: '0.5rem',
                      fontSize: '0.7rem',
                      letterSpacing: '0.2em',
                      textTransform: 'uppercase',
                      opacity: 0.5,
                    }}
                  >
                    Mensaje
                  </label>
                  <textarea
                    id="ed-contact-message"
                    name="mensaje"
                    rows={4}
                    style={{
                      width: '100%',
                      padding: '0.75rem 0',
                      border: 'none',
                      borderBottom: '1px solid rgba(245,240,232,0.3)',
                      background: 'transparent',
                      color: 'var(--color-bg)',
                      fontSize: '1rem',
                      resize: 'none',
                      outline: 'none',
                    }}
                  />
                </div>
                <button
                  type="submit"
                  style={{
                    padding: '0.9rem 3rem',
                    backgroundColor: 'var(--color-accent)',
                    color: '#ffffff',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '0.8rem',
                    letterSpacing: '0.15em',
                    textTransform: 'uppercase',
                    fontWeight: 600,
                  }}
                >
                  Enviar
                </button>
              </form>
            )}
          </div>
        </div>
      </section>
    )
  }

  // Default: 'simple'
  return (
    <section
      style={{
        padding: '6rem 5rem',
        backgroundColor: 'var(--color-text)',
        color: 'var(--color-bg)',
        borderTop: '1px solid rgba(0,0,0,0.1)',
      }}
    >
      <h2
        style={{
          fontSize: 'clamp(3rem, 7vw, 6rem)',
          fontWeight: 800,
          letterSpacing: '-0.03em',
          margin: '0 0 2.5rem',
          lineHeight: 0.85,
        }}
      >
        Contacto
      </h2>
      <div style={{ display: 'flex', gap: '3rem', flexWrap: 'wrap' }}>
        {email && (
          <a
            href={`mailto:${email}`}
            style={{
              color: 'var(--color-bg)',
              textDecoration: 'none',
              fontSize: '1rem',
              borderBottom: '1px solid rgba(245,240,232,0.3)',
              paddingBottom: '0.2rem',
              opacity: 0.85,
            }}
          >
            {email}
          </a>
        )}
        {instagram && (
          <a
            href={`https://instagram.com/${instagram.replace('@', '')}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: 'var(--color-bg)',
              textDecoration: 'none',
              fontSize: '1rem',
              borderBottom: '1px solid rgba(245,240,232,0.3)',
              paddingBottom: '0.2rem',
              opacity: 0.85,
            }}
          >
            {instagram}
          </a>
        )}
      </div>
    </section>
  )
}
