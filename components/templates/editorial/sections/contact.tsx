import type { SectionConfig, SiteConfig } from '@/lib/schemas/site-config.schema'
import { Button } from '@/components/Button'
import { ContentWrapper } from '@/components/ContentWrapper'
import { buildWhatsappUrl, sanitizeSocialHandle } from '@/components/templates/shared/template-helpers'
import EditorialContactForm from './EditorialContactForm'


type Props = {
  section: SectionConfig
  config?: SiteConfig
}

export default function Contact({ section, config }: Props) {
  const heading = (section.content.heading as string) || 'Hablemos'
  const intro = (section.content.intro as string) || 'Consultas sobre obras, precios y encargos.'
  const email = (section.content.email as string) ?? ''
  const instagramHandle = sanitizeSocialHandle(section.content.instagram)
  const instagramDisplay = instagramHandle
    ? typeof section.content.instagram === 'string' && section.content.instagram.trim().startsWith('@')
      ? `@${instagramHandle}`
      : instagramHandle
    : ''
  const whatsappUrl = buildWhatsappUrl(section.content.whatsapp, 'Hola, te escribo desde tu sitio editorial.')
  const width = config?.sizes.contentWidth ?? 'full'
  const btnShape = config?.button.shape ?? 'square'
  const btnStyle = config?.button.style ?? 'filled'

  const infoBlock = (
    <div>
      <h2 style={{ fontFamily: 'var(--qs-font-heading)', fontSize: 'var(--text-3xl)', fontWeight: 800, letterSpacing: '-0.03em', margin: '0 0 1.25rem', lineHeight: 0.95 }}>
        {heading}
      </h2>
      <p style={{ opacity: 0.65, fontSize: 'var(--text-sm)', lineHeight: 1.6, margin: '0 0 1.75rem' }}>{intro}</p>
      {email && (
        <a href={`mailto:${email}`} style={{ display: 'block', color: 'var(--color-bg)', textDecoration: 'none', fontSize: 'var(--text-sm)', opacity: 0.8, marginBottom: '0.5rem' }}>
          {email}
        </a>
      )}
      {instagramHandle && (
        <a href={`https://instagram.com/${instagramHandle}`} target="_blank" rel="noopener noreferrer" style={{ display: 'block', color: 'var(--color-bg)', textDecoration: 'none', fontSize: 'var(--text-sm)', opacity: 0.8, marginBottom: '1rem' }}>
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
      <section
        className="qs-section-pad"
        style={{
          padding: '6rem 5rem',
          backgroundColor: 'var(--color-text)',
          color: 'var(--color-bg)',
          borderTop: '1px solid var(--qs-border)',
        }}
      >
        <ContentWrapper width={width}>
          <div className="qs-split-responsive" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4rem', alignItems: 'start' }}>
            {infoBlock}
            <div>
              {email && <EditorialContactForm email={email} siteTitle={config?.identity.siteTitle} />}
            </div>
          </div>
        </ContentWrapper>
      </section>
    )
  }

  if (section.variant === 'split') {
    return (
      <section
        className="qs-section-pad"
        style={{
          padding: '6rem 5rem',
          backgroundColor: 'var(--color-text)',
          color: 'var(--color-bg)',
          borderTop: '1px solid var(--qs-border)',
        }}
      >
        <ContentWrapper width={width}>
          <div className="qs-split-responsive" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4rem', alignItems: 'center' }}>
            <div>
              <h2 style={{ fontFamily: 'var(--qs-font-heading)', fontSize: 'var(--text-4xl)', fontWeight: 800, letterSpacing: '-0.03em', margin: '0 0 1rem', lineHeight: 0.9 }}>
                {heading}
              </h2>
              <p style={{ margin: 0, opacity: 0.7 }}>{intro}</p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {email && (
                <a href={`mailto:${email}`} style={{ color: 'var(--color-bg)', textDecoration: 'none', fontSize: 'var(--text-lg)' }}>
                  {email}
                </a>
              )}
              {instagramHandle && (
                <a href={`https://instagram.com/${instagramHandle}`} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-bg)', textDecoration: 'none', fontSize: 'var(--text-base)', opacity: 0.8 }}>
                  {instagramDisplay}
                </a>
              )}
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
      </section>
    )
  }

  return (
    <section
      className="qs-section-pad"
      style={{
        padding: '6rem 5rem',
        backgroundColor: 'var(--color-text)',
        color: 'var(--color-bg)',
        borderTop: '1px solid var(--qs-border)',
      }}
    >
      <ContentWrapper width={width}>
        <h2 style={{ fontFamily: 'var(--qs-font-heading)', fontSize: 'var(--text-4xl)', fontWeight: 800, letterSpacing: '-0.03em', margin: '0 0 2rem', lineHeight: 0.9 }}>
          {heading}
        </h2>
        <div style={{ display: 'flex', gap: '2.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
          {email && (
            <a
              href={`mailto:${email}`}
              style={{
                color: 'var(--color-bg)',
                textDecoration: 'none',
                fontSize: 'var(--text-base)',
                borderBottom: '1px solid var(--qs-border)',
                paddingBottom: '0.2rem',
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
                color: 'var(--color-bg)',
                textDecoration: 'none',
                fontSize: 'var(--text-base)',
                borderBottom: '1px solid var(--qs-border)',
                paddingBottom: '0.2rem',
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
    </section>
  )
}
