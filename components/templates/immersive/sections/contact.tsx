import type { SiteConfig } from '@/lib/schemas/site-config.schema'

type SectionConfig = SiteConfig['sections'][number]

type Props = {
  section: SectionConfig
}

export default function ImmersiveContact({ section }: Props) {
  const email = (section.content.email as string) ?? ''
  const instagram = (section.content.instagram as string) ?? ''

  if (section.variant === 'form') {
    return (
      <div
        style={{
          height: '100%',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          backgroundColor: 'var(--color-bg)',
          color: 'var(--color-text)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            padding: '5rem',
            borderRight: '1px solid rgba(240,240,240,0.07)',
          }}
        >
          <span
            style={{
              fontSize: '0.65rem',
              letterSpacing: '0.4em',
              textTransform: 'uppercase',
              color: 'var(--color-accent)',
              display: 'block',
              marginBottom: '1.5rem',
            }}
          >
            Contacto
          </span>
          <h2
            style={{
              fontSize: 'clamp(3rem, 6vw, 5.5rem)',
              fontWeight: 300,
              letterSpacing: '0.05em',
              margin: '0 0 2rem',
              lineHeight: 0.95,
              color: '#f0f0f0',
            }}
          >
            Hablemos
          </h2>
          <p
            style={{
              opacity: 0.4,
              fontSize: '0.9rem',
              lineHeight: 1.7,
              margin: '0 0 2.5rem',
              letterSpacing: '0.03em',
            }}
          >
            Consultas sobre obras, precios y encargos.
          </p>
          {email && (
            <a
              href={`mailto:${email}`}
              style={{
                display: 'block',
                color: 'rgba(240,240,240,0.5)',
                textDecoration: 'none',
                fontSize: '0.85rem',
                letterSpacing: '0.08em',
                marginBottom: '0.75rem',
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
                color: 'rgba(240,240,240,0.5)',
                textDecoration: 'none',
                fontSize: '0.85rem',
                letterSpacing: '0.08em',
              }}
            >
              {instagram}
            </a>
          )}
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            padding: '5rem',
            overflowY: 'auto',
          }}
        >
          {email && (
            <form action={`mailto:${email}`} method="post" encType="text/plain" style={{ width: '100%' }}>
              <div style={{ marginBottom: '2.5rem' }}>
                <label
                  htmlFor="im-contact-name"
                  style={{
                    display: 'block',
                    marginBottom: '0.75rem',
                    fontSize: '0.65rem',
                    letterSpacing: '0.3em',
                    textTransform: 'uppercase',
                    color: 'var(--color-accent)',
                    opacity: 0.7,
                  }}
                >
                  Nombre
                </label>
                <input
                  id="im-contact-name"
                  name="nombre"
                  type="text"
                  style={{
                    width: '100%',
                    padding: '0.75rem 0',
                    border: 'none',
                    borderBottom: '1px solid rgba(240,240,240,0.15)',
                    background: 'transparent',
                    color: '#f0f0f0',
                    fontSize: '1rem',
                    outline: 'none',
                  }}
                />
              </div>
              <div style={{ marginBottom: '2.5rem' }}>
                <label
                  htmlFor="im-contact-message"
                  style={{
                    display: 'block',
                    marginBottom: '0.75rem',
                    fontSize: '0.65rem',
                    letterSpacing: '0.3em',
                    textTransform: 'uppercase',
                    color: 'var(--color-accent)',
                    opacity: 0.7,
                  }}
                >
                  Mensaje
                </label>
                <textarea
                  id="im-contact-message"
                  name="mensaje"
                  rows={4}
                  style={{
                    width: '100%',
                    padding: '0.75rem 0',
                    border: 'none',
                    borderBottom: '1px solid rgba(240,240,240,0.15)',
                    background: 'transparent',
                    color: '#f0f0f0',
                    fontSize: '1rem',
                    resize: 'none',
                    outline: 'none',
                  }}
                />
              </div>
              <button
                type="submit"
                style={{
                  padding: '1rem 3.5rem',
                  backgroundColor: 'transparent',
                  color: 'var(--color-accent)',
                  border: '1px solid var(--color-accent)',
                  cursor: 'pointer',
                  fontSize: '0.7rem',
                  letterSpacing: '0.3em',
                  textTransform: 'uppercase',
                  fontWeight: 500,
                }}
              >
                Enviar
              </button>
            </form>
          )}
        </div>
      </div>
    )
  }

  // Default: 'simple'
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
      }}
    >
      <span
        style={{
          fontSize: '0.65rem',
          letterSpacing: '0.4em',
          textTransform: 'uppercase',
          color: 'var(--color-accent)',
          display: 'block',
          marginBottom: '1.5rem',
        }}
      >
        Contacto
      </span>
      <h2
        style={{
          fontSize: 'clamp(4rem, 10vw, 9rem)',
          fontWeight: 300,
          letterSpacing: '0.05em',
          margin: '0 0 3rem',
          lineHeight: 0.9,
          color: '#f0f0f0',
        }}
      >
        Hablemos
      </h2>
      <div style={{ display: 'flex', gap: '3rem', flexWrap: 'wrap' }}>
        {email && (
          <a
            href={`mailto:${email}`}
            style={{
              color: 'rgba(240,240,240,0.6)',
              textDecoration: 'none',
              fontSize: '1rem',
              letterSpacing: '0.05em',
              borderBottom: '1px solid rgba(240,240,240,0.2)',
              paddingBottom: '0.25rem',
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
              color: 'rgba(240,240,240,0.6)',
              textDecoration: 'none',
              fontSize: '1rem',
              letterSpacing: '0.05em',
              borderBottom: '1px solid rgba(240,240,240,0.2)',
              paddingBottom: '0.25rem',
            }}
          >
            {instagram}
          </a>
        )}
      </div>
    </div>
  )
}
