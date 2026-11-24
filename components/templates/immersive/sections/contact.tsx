import type { SiteConfig } from '@/lib/schemas/site-config.schema'
import { Button } from '@/components/Button'
import { ContentWrapper } from '@/components/ContentWrapper'
import { buildWhatsappUrl, sanitizeSocialHandle } from '@/components/templates/shared/template-helpers'

type SectionConfig = SiteConfig['sections'][number]

type Props = {
  section: SectionConfig
  config?: SiteConfig
}

export default function ImmersiveContact({ section, config }: Props) {
  const heading = (section.content.heading as string) || 'Hablemos'
  const intro = (section.content.intro as string) || 'Consultas sobre obras, precios y encargos.'
  const email = (section.content.email as string) ?? ''
  const instagramHandle = sanitizeSocialHandle(section.content.instagram)
  const instagramDisplay = instagramHandle
    ? typeof section.content.instagram === 'string' && section.content.instagram.trim().startsWith('@')
      ? `@${instagramHandle}`
      : instagramHandle
    : ''
  const whatsappUrl = buildWhatsappUrl(section.content.whatsapp, 'Hola, te escribo desde tu portfolio.')
  const width = config?.sizes.contentWidth ?? 'full'
  const btnShape = config?.button.shape ?? 'square'
  const btnStyle = config?.button.style ?? 'outlined'

  const detailsBlock = (
    <div>
      <span style={{ fontSize: '0.65rem', letterSpacing: '0.4em', textTransform: 'uppercase', color: 'var(--color-accent)', display: 'block', marginBottom: '1.25rem' }}>
        Contacto
      </span>
      <h2 style={{ fontFamily: 'var(--qs-font-heading)', fontSize: 'var(--text-3xl)', fontWeight: 300, letterSpacing: '0.05em', margin: '0 0 1.5rem', lineHeight: 0.95 }}>
        {heading}
      </h2>
      <p style={{ opacity: 0.6, fontSize: 'var(--text-sm)', lineHeight: 1.7, margin: '0 0 2rem' }}>{intro}</p>
      {email && (
        <a href={`mailto:${email}`} style={{ display: 'block', color: 'var(--color-text)', opacity: 0.75, textDecoration: 'none', fontSize: 'var(--text-sm)', marginBottom: '0.75rem' }}>
          {email}
        </a>
      )}
      {instagramHandle && (
        <a href={`https://instagram.com/${instagramHandle}`} target="_blank" rel="noopener noreferrer" style={{ display: 'block', color: 'var(--color-text)', opacity: 0.75, textDecoration: 'none', fontSize: 'var(--text-sm)', marginBottom: '1rem' }}>
          {instagramDisplay}
        </a>
      )}
      {whatsappUrl && (
        <Button shape={btnShape} style={btnStyle} href={whatsappUrl}>
          Escribir por WhatsApp
        </Button>
      )}
    </div>
  )

  if (section.variant === 'form') {
    return (
      <div className="qs-section-pad" style={{ backgroundColor: 'var(--color-bg)', color: 'var(--color-text)', padding: '5rem' }}>
        <ContentWrapper width={width}>
          <div className="qs-split-responsive" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4rem', alignItems: 'center' }}>
            {detailsBlock}
            <div>
              {email && (
                <form action={`mailto:${email}`} method="post" encType="text/plain" style={{ width: '100%' }}>
                  <div style={{ marginBottom: '2rem' }}>
                    <label htmlFor="im-contact-name" style={{ display: 'block', marginBottom: '0.75rem', fontSize: '0.65rem', letterSpacing: '0.3em', textTransform: 'uppercase', color: 'var(--color-accent)' }}>
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
                        borderBottom: '1px solid var(--qs-border)',
                        background: 'transparent',
                        color: 'var(--color-text)',
                        fontSize: 'var(--text-base)',
                        outline: 'none',
                      }}
                    />
                  </div>
                  <div style={{ marginBottom: '2rem' }}>
                    <label htmlFor="im-contact-message" style={{ display: 'block', marginBottom: '0.75rem', fontSize: '0.65rem', letterSpacing: '0.3em', textTransform: 'uppercase', color: 'var(--color-accent)' }}>
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
                        borderBottom: '1px solid var(--qs-border)',
                        background: 'transparent',
                        color: 'var(--color-text)',
                        fontSize: 'var(--text-base)',
                        resize: 'none',
                        outline: 'none',
                      }}
                    />
                  </div>
                  <button
                    type="submit"
                    style={{
                      padding: '1rem 3rem',
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
        </ContentWrapper>
      </div>
    )
  }

  if (section.variant === 'split') {
    return (
      <div className="qs-section-pad" style={{ backgroundColor: 'var(--color-bg)', color: 'var(--color-text)', padding: '5rem' }}>
        <ContentWrapper width={width}>
          <div className="qs-split-responsive" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4rem', alignItems: 'center' }}>
            <div>
              <span style={{ fontSize: '0.65rem', letterSpacing: '0.4em', textTransform: 'uppercase', color: 'var(--color-accent)', display: 'block', marginBottom: '1rem' }}>
                Contacto
              </span>
              <h2 style={{ fontFamily: 'var(--qs-font-heading)', fontSize: 'var(--text-4xl)', fontWeight: 300, margin: '0 0 1rem' }}>{heading}</h2>
              <p style={{ margin: 0, opacity: 0.65 }}>{intro}</p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {email && <a href={`mailto:${email}`} style={{ color: 'var(--color-text)', textDecoration: 'none', fontSize: 'var(--text-lg)' }}>{email}</a>}
              {instagramHandle && <a href={`https://instagram.com/${instagramHandle}`} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-text)', textDecoration: 'none', fontSize: 'var(--text-base)', opacity: 0.7 }}>{instagramDisplay}</a>}
              {whatsappUrl && (
                <div>
                  <Button shape={btnShape} style={btnStyle} href={whatsappUrl}>
                    Escribir por WhatsApp
                  </Button>
                </div>
              )}
            </div>
          </div>
        </ContentWrapper>
      </div>
    )
  }

  return (
    <div className="qs-section-pad" style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', backgroundColor: 'var(--color-bg)', color: 'var(--color-text)', padding: '5rem' }}>
      <ContentWrapper width={width}>
        <span style={{ fontSize: '0.65rem', letterSpacing: '0.4em', textTransform: 'uppercase', color: 'var(--color-accent)', display: 'block', marginBottom: '1.5rem' }}>
          Contacto
        </span>
        <h2 style={{ fontFamily: 'var(--qs-font-heading)', fontSize: 'var(--text-4xl)', fontWeight: 300, letterSpacing: '0.05em', margin: '0 0 2.5rem', lineHeight: 0.95 }}>
          {heading}
        </h2>
        <div style={{ display: 'flex', gap: '2.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
          {email && (
            <a
              href={`mailto:${email}`}
              style={{
                color: 'var(--color-text)',
                opacity: 0.75,
                textDecoration: 'none',
                fontSize: 'var(--text-base)',
                borderBottom: '1px solid var(--qs-border)',
                paddingBottom: '0.25rem',
              }}
            >
              {email}
            </a>
          )}
          {instagramHandle && (
            <a
              href={`https://instagram.com/${instagramHandle}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                color: 'var(--color-text)',
                opacity: 0.75,
                textDecoration: 'none',
                fontSize: 'var(--text-base)',
                borderBottom: '1px solid var(--qs-border)',
                paddingBottom: '0.25rem',
              }}
            >
              {instagramDisplay}
            </a>
          )}
          {whatsappUrl && (
            <Button shape={btnShape} style={btnStyle} href={whatsappUrl}>
              WhatsApp
            </Button>
          )}
        </div>
      </ContentWrapper>
    </div>
  )
}
