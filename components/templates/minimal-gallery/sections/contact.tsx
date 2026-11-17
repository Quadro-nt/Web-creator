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
          padding: '4rem 2rem',
          maxWidth: '600px',
          margin: '0 auto',
          backgroundColor: 'var(--color-bg)',
          color: 'var(--color-text)',
        }}
      >
        {email && (
          <form action={`mailto:${email}`} method="post" encType="text/plain">
            <div style={{ marginBottom: '1.5rem' }}>
              <label
                htmlFor="contact-name"
                style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.9rem', opacity: 0.7 }}
              >
                Nombre
              </label>
              <input
                id="contact-name"
                name="nombre"
                type="text"
                style={{
                  width: '100%',
                  padding: '0.6rem 0',
                  border: 'none',
                  borderBottom: '1px solid currentColor',
                  background: 'transparent',
                  color: 'inherit',
                  fontSize: '1rem',
                  outline: 'none',
                }}
              />
            </div>
            <div style={{ marginBottom: '1.5rem' }}>
              <label
                htmlFor="contact-message"
                style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.9rem', opacity: 0.7 }}
              >
                Mensaje
              </label>
              <textarea
                id="contact-message"
                name="mensaje"
                rows={4}
                style={{
                  width: '100%',
                  padding: '0.6rem 0',
                  border: 'none',
                  borderBottom: '1px solid currentColor',
                  background: 'transparent',
                  color: 'inherit',
                  fontSize: '1rem',
                  resize: 'none',
                  outline: 'none',
                }}
              />
            </div>
            <button
              type="submit"
              style={{
                padding: '0.75rem 2.5rem',
                backgroundColor: 'var(--color-accent)',
                color: '#ffffff',
                border: 'none',
                cursor: 'pointer',
                fontSize: '0.9rem',
                letterSpacing: '0.08em',
              }}
            >
              Enviar
            </button>
          </form>
        )}
        {instagram && (
          <p style={{ marginTop: '2rem', opacity: 0.6, fontSize: '0.9rem' }}>
            Instagram:{' '}
            <a
              href={`https://instagram.com/${instagram.replace('@', '')}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: 'var(--color-accent)' }}
            >
              {instagram}
            </a>
          </p>
        )}
      </section>
    )
  }

  // Default: 'simple'
  return (
    <section
      style={{
        padding: '4rem 2rem',
        maxWidth: '600px',
        margin: '0 auto',
        backgroundColor: 'var(--color-bg)',
        color: 'var(--color-text)',
        textAlign: 'center',
      }}
    >
      {email && (
        <p style={{ marginBottom: '1rem', fontSize: '1rem', opacity: 0.85 }}>
          <a
            href={`mailto:${email}`}
            style={{ color: 'var(--color-text)', textDecoration: 'none', borderBottom: '1px solid currentColor' }}
          >
            {email}
          </a>
        </p>
      )}
      {instagram && (
        <p style={{ opacity: 0.6, fontSize: '0.9rem' }}>
          <a
            href={`https://instagram.com/${instagram.replace('@', '')}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: 'var(--color-text)', textDecoration: 'none', opacity: 0.6 }}
          >
            {instagram}
          </a>
        </p>
      )}
    </section>
  )
}
