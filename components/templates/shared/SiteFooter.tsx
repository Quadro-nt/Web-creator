'use client'

import type { SiteConfig } from '@/lib/schemas/site-config.schema'
import { buildWhatsappUrl, getNavItems, sanitizeHref } from './template-helpers'

type Props = {
  config: SiteConfig
  artistSlug: string
  inPreview?: boolean
  onSelectChrome?: (target: 'announcement' | 'header' | 'footer') => void
}

export default function SiteFooter({ config, artistSlug, inPreview = false, onSelectChrome }: Props) {
  const footer = config.footer
  if (!footer?.enabled) return null

  const bgColor = footer.backgroundColor || '#000000'
  const fgColor = footer.textColor || '#ffffff'
  const links =
    footer.quickLinks && footer.quickLinks.length > 0
      ? footer.quickLinks.filter((l) => l.label.trim().length > 0)
      : getNavItems(config).map((item) => ({ label: item.label, href: `#${item.id}` }))

  const waUrl = buildWhatsappUrl(footer.whatsapp, `Hola ${artistSlug}, me gustaría comunicarme contigo.`)
  const igHandle = footer.instagram?.replace(/^@/, '').trim()
  const tiktokHandle = footer.tiktok?.replace(/^@/, '').trim()
  const pinterestHandle = footer.pinterest?.replace(/^@/, '').trim()

  return (
    <footer
      onClick={(e) => {
        if (onSelectChrome) {
          e.stopPropagation()
          onSelectChrome('footer')
        }
      }}
      onClickCapture={(e) => {
        if (inPreview && (e.target as HTMLElement | null)?.closest('a')) {
          e.preventDefault()
        }
      }}
      title={inPreview ? 'Clic para editar pie de página' : undefined}
      className="qs-section-pad"
      style={{
        backgroundColor: bgColor,
        color: fgColor,
        padding: '4rem 2.5rem 2rem',
        cursor: onSelectChrome ? 'pointer' : undefined,
      }}
    >
      <div
        className="qs-split-responsive"
        style={{
          maxWidth: '1240px',
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: '1.5fr 1fr 1fr',
          gap: '2.5rem',
        }}
      >
        <div>
          {config.identity.logoUrl ? (
            <img
              src={config.identity.logoUrl}
              alt={config.identity.siteTitle}
              style={{ height: '38px', width: 'auto', objectFit: 'contain', marginBottom: '1rem' }}
            />
          ) : (
            <h3 style={{ margin: '0 0 0.85rem', fontSize: 'var(--text-2xl)', fontWeight: 700, color: fgColor }}>
              {config.identity.siteTitle}
            </h3>
          )}
          {footer.bio && (
            <p style={{ margin: '0 0 1.25rem', opacity: 0.78, fontSize: 'var(--text-sm)', lineHeight: 1.65, maxWidth: '380px' }}>
              {footer.bio}
            </p>
          )}
          {footer.email && (
            <a href={`mailto:${footer.email}`} style={{ color: fgColor, opacity: 0.85, fontSize: 'var(--text-sm)', textDecoration: 'none' }}>
              {footer.email}
            </a>
          )}
        </div>

        <div>
          <h4 style={{ margin: '0 0 1rem', fontSize: 'var(--text-sm)', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            Enlaces rápidos
          </h4>
          <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
            {links.map((item, idx) => (
              <li key={idx}>
                <a
                  href={sanitizeHref(item.href) ?? '#'}
                  style={{ color: fgColor, opacity: 0.78, textDecoration: 'none', fontSize: 'var(--text-sm)' }}
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 style={{ margin: '0 0 1rem', fontSize: 'var(--text-sm)', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            Conecta
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: 'var(--text-sm)' }}>
            {igHandle && (
              <a href={`https://instagram.com/${igHandle}`} target="_blank" rel="noopener noreferrer" style={{ color: fgColor, opacity: 0.82, textDecoration: 'none' }}>
                Instagram · @{igHandle}
              </a>
            )}
            {tiktokHandle && (
              <a href={`https://tiktok.com/@${tiktokHandle}`} target="_blank" rel="noopener noreferrer" style={{ color: fgColor, opacity: 0.82, textDecoration: 'none' }}>
                TikTok · @{tiktokHandle}
              </a>
            )}
            {pinterestHandle && (
              <a href={`https://pinterest.com/${pinterestHandle}`} target="_blank" rel="noopener noreferrer" style={{ color: fgColor, opacity: 0.82, textDecoration: 'none' }}>
                Pinterest · {pinterestHandle}
              </a>
            )}
            {waUrl && (
              <a href={waUrl} target="_blank" rel="noopener noreferrer" style={{ color: fgColor, opacity: 0.82, textDecoration: 'none' }}>
                WhatsApp directo →
              </a>
            )}
          </div>
        </div>
      </div>

      <div
        style={{
          maxWidth: '1240px',
          margin: '3rem auto 0',
          paddingTop: '1.25rem',
          borderTop: '1px solid rgba(128,128,128,0.28)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          flexWrap: 'wrap',
          fontSize: '0.75rem',
          opacity: 0.6,
        }}
      >
        <span>{footer.copyrightText || `© ${new Date().getFullYear()} ${config.identity.siteTitle}`}</span>
        <a
          href="https://quadro-nt.com"
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: fgColor, textDecoration: 'none' }}
        >
          Hecho con Quadro
        </a>
      </div>
    </footer>
  )
}
