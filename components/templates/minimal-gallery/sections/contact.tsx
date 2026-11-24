import type { SiteConfig } from '@/lib/schemas/site-config.schema'
import { Button } from '@/components/Button'
import { ContentWrapper } from '@/components/ContentWrapper'
import { buildWhatsappUrl, sanitizeSocialHandle } from '@/components/templates/shared/template-helpers'

type SectionConfig = SiteConfig['sections'][number]

type Props = {
  section: SectionConfig
  config?: SiteConfig
}

export default function Contact({ section, config }: Props) {
  const heading = (section.content.heading as string) ?? ''
  const intro = (section.content.intro as string) ?? ''
  const email = (section.content.email as string) ?? ''
  const instagramHandle = sanitizeSocialHandle(section.content.instagram)
  const instagramDisplay = instagramHandle
    ? typeof section.content.instagram === 'string' && section.content.instagram.trim().startsWith('@')
      ? `@${instagramHandle}`
      : instagramHandle
    : ''
  const whatsappUrl = buildWhatsappUrl(section.content.whatsapp, 'Hola, te escribo desde tu sitio web.')
  const width = config?.sizes.contentWidth ?? 'mid'
  const btnShape = config?.button.shape ?? 'rounded'
  const btnStyle = config?.button.style ?? 'filled'

  const channels = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      {email && (
        <p style={{ margin: 0, fontSize: 'var(--text-base)' }}>
          <a
            href={`mailto:${email}`}
            style={{ color: 'var(--color-text)', textDecoration: 'none', borderBottom: '1px solid var(--qs-border)' }}
          >
            {email}
          </a>
        </p>
      )}
      {instagramHandle && (
        <p style={{ margin: 0, opacity: 0.7, fontSize: 'var(--text-sm)' }}>
          <a
            href={`https://instagram.com/${instagramHandle}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: 'var(--color-text)', textDecoration: 'none' }}
          >
            {instagramDisplay}
          </a>
        </p>
      )}
      {whatsappUrl && (
        <div style={{ marginTop: '0.5rem' }}>
          <Button shape={btnShape} style={btnStyle} href={whatsappUrl}>
            Escribir por WhatsApp
          </Button>
        </div>
      )}
    </div>
  )

  if (section.variant === 'split') {
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
          <div className="qs-split-responsive" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3rem', alignItems: 'start' }}>
            <div>
              {heading && <h2 style={{ fontFamily: 'var(--qs-font-heading)', margin: '0 0 0.75rem', fontSize: 'var(--text-2xl)', fontWeight: 400 }}>{heading}</h2>}
              {intro && <p style={{ margin: 0, opacity: 0.75, lineHeight: 1.7 }}>{intro}</p>}
            </div>
            <div>{channels}</div>
          </div>
        </ContentWrapper>
      </section>
    )
  }

  if (section.variant === 'form') {
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
          <div style={{ maxWidth: '600px', margin: '0 auto' }}>
            {heading && <h2 style={{ margin: '0 0 0.75rem', fontSize: 'var(--text-2xl)', fontWeight: 400 }}>{heading}</h2>}
            {intro && <p style={{ margin: '0 0 1.5rem', opacity: 0.75 }}>{intro}</p>}
            {email && (
              <form action={`mailto:${email}`} method="post" encType="text/plain">
                <div style={{ marginBottom: '1.5rem' }}>
                  <label
                    htmlFor="contact-name"
                    style={{ display: 'block', marginBottom: '0.4rem', fontSize: 'var(--text-sm)', opacity: 0.75 }}
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
                      borderBottom: '1px solid var(--qs-border)',
                      background: 'transparent',
                      color: 'inherit',
                      fontSize: 'var(--text-base)',
                      outline: 'none',
                    }}
                  />
                </div>
                <div style={{ marginBottom: '1.5rem' }}>
                  <label
                    htmlFor="contact-message"
                    style={{ display: 'block', marginBottom: '0.4rem', fontSize: 'var(--text-sm)', opacity: 0.75 }}
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
                      borderBottom: '1px solid var(--qs-border)',
                      background: 'transparent',
                      color: 'inherit',
                      fontSize: 'var(--text-base)',
                      resize: 'none',
                      outline: 'none',
                    }}
                  />
                </div>
                <button
                  type="submit"
                  style={{
                    padding: '0.75rem 2.25rem',
                    backgroundColor: 'var(--color-accent)',
                    color: 'var(--color-bg)',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: 'var(--text-sm)',
                    letterSpacing: '0.08em',
                  }}
                >
                  Enviar
                </button>
              </form>
            )}
            <div style={{ marginTop: '2rem' }}>{channels}</div>
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
        textAlign: 'center',
      }}
    >
      <ContentWrapper width={width}>
        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
          {heading && <h2 style={{ margin: '0 0 0.75rem', fontSize: 'var(--text-2xl)', fontWeight: 400 }}>{heading}</h2>}
          {intro && <p style={{ margin: '0 0 1.5rem', opacity: 0.75 }}>{intro}</p>}
          {channels}
        </div>
      </ContentWrapper>
    </section>
  )
}
