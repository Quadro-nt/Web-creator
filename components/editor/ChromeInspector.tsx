'use client'

import type {
  AnnouncementBarConfig,
  FooterConfig,
  HeaderConfig,
  SiteConfig,
} from '@/lib/schemas/site-config.schema'
import {
  STUDIO_COLORS,
  studioCardStyle,
  studioIconBtn,
  studioInputStyle,
  studioLabelStyle,
  studioPrimaryBtn,
  studioSecondaryBtn,
  studioTextareaStyle,
} from './studio-styles'

type ChromeTarget = 'announcement' | 'header' | 'footer'

type Props = {
  target: ChromeTarget
  config: SiteConfig
  onBack: () => void
  onChange: (patch: Partial<SiteConfig>) => void
}

const ANNOUNCEMENT_SWATCHES = [
  { label: 'Rosa Pop', bg: '#ec9fbf', fg: '#4b0303' },
  { label: 'Negro', bg: '#000000', fg: '#ffffff' },
  { label: 'Crema', bg: '#f5f0e8', fg: '#1a1a1a' },
  { label: 'Terracota', bg: '#9c4221', fg: '#ffffff' },
]

const HEADER_SWATCHES = [
  { label: 'Negro / Blanco', bg: '#000000', fg: '#ffffff' },
  { label: 'Blanco / Negro', bg: '#ffffff', fg: '#000000' },
  { label: 'Crema / Tinta', bg: '#f5f0e8', fg: '#1a1a1a' },
]

export default function ChromeInspector({ target, config, onBack, onChange }: Props) {
  if (target === 'announcement') {
    const bar: AnnouncementBarConfig = config.announcementBar ?? {
      enabled: false,
      backgroundColor: '#ec9fbf',
      textColor: '#4b0303',
      messages: ['NUEVA COLECCIÓN DISPONIBLE', 'ENVÍO GRATIS EN OBRAS ORIGINALES'],
      autoRotate: true,
    }

    const patchBar = (patch: Partial<AnnouncementBarConfig>) => {
      onChange({ announcementBar: { ...bar, ...patch } })
    }

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <div style={studioCardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <button type="button" onClick={onBack} style={{ ...studioSecondaryBtn, padding: '0.25rem 0.5rem', fontSize: '0.72rem' }}>
              ← Sitio
            </button>
          </div>
          <strong style={{ fontSize: '0.92rem', color: STUDIO_COLORS.text, display: 'block', marginBottom: '0.6rem' }}>
            Barra de anuncios superior
          </strong>
          <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem', fontWeight: 500 }}>
            <input
              type="checkbox"
              checked={bar.enabled}
              onChange={(e) => patchBar({ enabled: e.target.checked })}
            />
            Mostrar barra de anuncios arriba del header
          </label>
        </div>

        <div style={studioCardStyle}>
          <strong style={{ fontSize: '0.8rem', color: STUDIO_COLORS.text, display: 'block', marginBottom: '0.5rem' }}>
            Colores de la barra
          </strong>
          <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', marginBottom: '0.6rem' }}>
            {ANNOUNCEMENT_SWATCHES.map((sw) => (
              <button
                key={sw.label}
                type="button"
                onClick={() => patchBar({ backgroundColor: sw.bg, textColor: sw.fg })}
                style={{
                  padding: '0.28rem 0.55rem',
                  borderRadius: '9999px',
                  border: `1px solid ${STUDIO_COLORS.inputBorder}`,
                  background: sw.bg,
                  color: sw.fg,
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                {sw.label}
              </button>
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
            <label style={studioLabelStyle}>
              <span>Fondo</span>
              <input
                type="color"
                value={bar.backgroundColor}
                onChange={(e) => patchBar({ backgroundColor: e.target.value })}
                style={{ width: '100%', height: '32px', padding: 0, border: `1px solid ${STUDIO_COLORS.inputBorder}`, borderRadius: '5px' }}
              />
            </label>
            <label style={studioLabelStyle}>
              <span>Texto</span>
              <input
                type="color"
                value={bar.textColor}
                onChange={(e) => patchBar({ textColor: e.target.value })}
                style={{ width: '100%', height: '32px', padding: 0, border: `1px solid ${STUDIO_COLORS.inputBorder}`, borderRadius: '5px' }}
              />
            </label>
          </div>
        </div>

        <div style={studioCardStyle}>
          <strong style={{ fontSize: '0.8rem', color: STUDIO_COLORS.text, display: 'block', marginBottom: '0.5rem' }}>
            Mensajes rotativos
          </strong>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            {bar.messages.map((msg, idx) => (
              <div key={idx} style={{ display: 'flex', gap: '0.3rem', alignItems: 'center' }}>
                <input
                  type="text"
                  value={msg}
                  onChange={(e) => {
                    const next = bar.messages.map((m, i) => (i === idx ? e.target.value : m))
                    patchBar({ messages: next })
                  }}
                  style={{ ...studioInputStyle, flex: 1 }}
                />
                <button
                  type="button"
                  aria-label="Eliminar anuncio"
                  onClick={() => patchBar({ messages: bar.messages.filter((_, i) => i !== idx) })}
                  style={{ ...studioIconBtn(false), color: STUDIO_COLORS.danger }}
                >
                  ✕
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => patchBar({ messages: [...bar.messages, 'NUEVO ANUNCIO'] })}
              style={studioSecondaryBtn}
            >
              + Agregar anuncio
            </button>
            <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78rem', marginTop: '0.25rem' }}>
              <input
                type="checkbox"
                checked={bar.autoRotate !== false}
                onChange={(e) => patchBar({ autoRotate: e.target.checked })}
              />
              Rotar automáticamente cada 4.5s
            </label>
            <label style={studioLabelStyle}>
              <span>Enlace al hacer clic (opcional)</span>
              <input
                type="text"
                value={bar.linkUrl ?? ''}
                placeholder="#artworks o https://..."
                onChange={(e) => patchBar({ linkUrl: e.target.value || undefined })}
                style={studioInputStyle}
              />
            </label>
          </div>
        </div>
      </div>
    )
  }

  if (target === 'header') {
    const header: HeaderConfig = config.header ?? {
      layout: 'centered',
      backgroundColor: '#000000',
      textColor: '#ffffff',
      logoHeight: 'md',
      uppercaseLinks: true,
      showSearchIcon: true,
      showWhatsappIcon: false,
    }

    const patchHeader = (patch: Partial<HeaderConfig>) => {
      onChange({ header: { ...header, ...patch } })
    }

    const customLinks = header.customLinks ?? []

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <div style={studioCardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <button type="button" onClick={onBack} style={{ ...studioSecondaryBtn, padding: '0.25rem 0.5rem', fontSize: '0.72rem' }}>
              ← Sitio
            </button>
            {config.header && (
              <button
                type="button"
                onClick={() => onChange({ header: undefined })}
                style={{ ...studioSecondaryBtn, padding: '0.25rem 0.5rem', fontSize: '0.7rem', color: STUDIO_COLORS.muted }}
              >
                Usar header del template
              </button>
            )}
          </div>
          <strong style={{ fontSize: '0.92rem', color: STUDIO_COLORS.text, display: 'block', marginBottom: '0.5rem' }}>
            Encabezado (Header)
          </strong>
          {!config.header && (
            <button type="button" onClick={() => patchHeader({})} style={studioPrimaryBtn}>
              Activar header personalizable
            </button>
          )}
        </div>

        <div style={studioCardStyle}>
          <strong style={{ fontSize: '0.8rem', color: STUDIO_COLORS.text, display: 'block', marginBottom: '0.5rem' }}>
            Distribución
          </strong>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.35rem' }}>
            {(
              [
                { value: 'centered', label: 'Logo centrado' },
                { value: 'left', label: 'Logo izquierda' },
                { value: 'minimal', label: 'Minimal' },
              ] as const
            ).map((opt) => {
              const active = header.layout === opt.value
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => patchHeader({ layout: opt.value })}
                  style={{
                    padding: '0.45rem 0.3rem',
                    borderRadius: '6px',
                    border: `1.5px solid ${active ? STUDIO_COLORS.accent : STUDIO_COLORS.inputBorder}`,
                    background: active ? STUDIO_COLORS.accentSoft : STUDIO_COLORS.surface,
                    color: active ? STUDIO_COLORS.accent : STUDIO_COLORS.text,
                    fontSize: '0.72rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  {opt.label}
                </button>
              )
            })}
          </div>
        </div>

        <div style={studioCardStyle}>
          <strong style={{ fontSize: '0.8rem', color: STUDIO_COLORS.text, display: 'block', marginBottom: '0.5rem' }}>
            Colores y logo
          </strong>
          <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', marginBottom: '0.55rem' }}>
            {HEADER_SWATCHES.map((sw) => (
              <button
                key={sw.label}
                type="button"
                onClick={() => patchHeader({ backgroundColor: sw.bg, textColor: sw.fg, transparentOverCover: false })}
                style={{
                  padding: '0.25rem 0.5rem',
                  borderRadius: '9999px',
                  border: `1px solid ${STUDIO_COLORS.inputBorder}`,
                  background: sw.bg,
                  color: sw.fg,
                  fontSize: '0.7rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                {sw.label}
              </button>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '0.55rem' }}>
            <label style={studioLabelStyle}>
              <span>Fondo header</span>
              <input
                type="color"
                value={header.backgroundColor || '#000000'}
                onChange={(e) => patchHeader({ backgroundColor: e.target.value, transparentOverCover: false })}
                style={{ width: '100%', height: '32px', padding: 0, border: `1px solid ${STUDIO_COLORS.inputBorder}`, borderRadius: '5px' }}
              />
            </label>
            <label style={studioLabelStyle}>
              <span>Texto / iconos</span>
              <input
                type="color"
                value={header.textColor || '#ffffff'}
                onChange={(e) => patchHeader({ textColor: e.target.value })}
                style={{ width: '100%', height: '32px', padding: 0, border: `1px solid ${STUDIO_COLORS.inputBorder}`, borderRadius: '5px' }}
              />
            </label>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
            <div>
              <span style={{ fontSize: '0.72rem', color: STUDIO_COLORS.muted, display: 'block', marginBottom: '0.25rem' }}>
                Tamaño de marca / logo
              </span>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.25rem' }}>
                {(['sm', 'md', 'lg'] as const).map((sz) => (
                  <button
                    key={sz}
                    type="button"
                    onClick={() => patchHeader({ logoHeight: sz })}
                    style={{
                      padding: '0.3rem',
                      borderRadius: '6px',
                      border: `1px solid ${(header.logoHeight ?? 'md') === sz ? STUDIO_COLORS.accent : STUDIO_COLORS.inputBorder}`,
                      background: (header.logoHeight ?? 'md') === sz ? STUDIO_COLORS.accentSoft : STUDIO_COLORS.surface,
                      fontSize: '0.72rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    {sz === 'sm' ? 'Chico' : sz === 'md' ? 'Medio' : 'Grande'}
                  </button>
                ))}
              </div>
            </div>

            <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78rem' }}>
              <input
                type="checkbox"
                checked={config.navigation.sticky}
                onChange={(e) => onChange({ navigation: { ...config.navigation, sticky: e.target.checked } })}
              />
              Barra fija al hacer scroll
            </label>
            <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78rem' }}>
              <input
                type="checkbox"
                checked={header.uppercaseLinks !== false}
                onChange={(e) => patchHeader({ uppercaseLinks: e.target.checked })}
              />
              Enlaces en MAYÚSCULAS
            </label>
            <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78rem' }}>
              <input
                type="checkbox"
                checked={Boolean(header.showSearchIcon)}
                onChange={(e) => patchHeader({ showSearchIcon: e.target.checked })}
              />
              Mostrar icono de búsqueda de obras
            </label>
            <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78rem' }}>
              <input
                type="checkbox"
                checked={Boolean(header.showWhatsappIcon)}
                onChange={(e) => patchHeader({ showWhatsappIcon: e.target.checked })}
              />
              Mostrar icono de WhatsApp
            </label>
            {header.showWhatsappIcon && (
              <label style={studioLabelStyle}>
                <span>Número WhatsApp del header</span>
                <input
                  type="text"
                  value={header.whatsappNumber ?? ''}
                  placeholder="51999000000"
                  onChange={(e) => patchHeader({ whatsappNumber: e.target.value })}
                  style={studioInputStyle}
                />
              </label>
            )}
            <label style={studioLabelStyle}>
              <span>Instagram en el header (opcional)</span>
              <input
                type="text"
                value={header.instagramHandle ?? ''}
                placeholder="@usuario"
                onChange={(e) => patchHeader({ instagramHandle: e.target.value })}
                style={studioInputStyle}
              />
            </label>
          </div>
        </div>

        <div style={studioCardStyle}>
          <strong style={{ fontSize: '0.8rem', color: STUDIO_COLORS.text, display: 'block', marginBottom: '0.35rem' }}>
            Enlaces personalizados (opcional)
          </strong>
          <p style={{ margin: '0 0 0.5rem', fontSize: '0.72rem', color: STUDIO_COLORS.muted }}>
            Si lo dejas vacío, se generan automáticamente desde tus secciones visibles.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            {customLinks.map((lnk, idx) => (
              <div key={idx} style={{ display: 'flex', gap: '0.3rem', alignItems: 'center' }}>
                <input
                  type="text"
                  value={lnk.label}
                  placeholder="Nombre"
                  onChange={(e) =>
                    patchHeader({
                      customLinks: customLinks.map((it, i) => (i === idx ? { ...it, label: e.target.value } : it)),
                    })
                  }
                  style={{ ...studioInputStyle, width: '95px' }}
                />
                <input
                  type="text"
                  value={lnk.href}
                  placeholder="#artworks"
                  onChange={(e) =>
                    patchHeader({
                      customLinks: customLinks.map((it, i) => (i === idx ? { ...it, href: e.target.value } : it)),
                    })
                  }
                  style={{ ...studioInputStyle, flex: 1 }}
                />
                <button
                  type="button"
                  aria-label="Eliminar enlace"
                  onClick={() => patchHeader({ customLinks: customLinks.filter((_, i) => i !== idx) })}
                  style={{ ...studioIconBtn(false), color: STUDIO_COLORS.danger }}
                >
                  ✕
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => patchHeader({ customLinks: [...customLinks, { label: 'Obras', href: '#artworks' }] })}
              style={studioSecondaryBtn}
            >
              + Agregar enlace al menú
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Footer inspector
  const footer: FooterConfig = config.footer ?? {
    enabled: false,
    backgroundColor: '#000000',
    textColor: '#ffffff',
    bio: 'Arte original y ediciones limitadas directamente desde el taller.',
  }
  const patchFooter = (patch: Partial<FooterConfig>) => {
    onChange({ footer: { ...footer, ...patch } })
  }
  const quickLinks = footer.quickLinks ?? []

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      <div style={studioCardStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
          <button type="button" onClick={onBack} style={{ ...studioSecondaryBtn, padding: '0.25rem 0.5rem', fontSize: '0.72rem' }}>
            ← Sitio
          </button>
        </div>
        <strong style={{ fontSize: '0.92rem', color: STUDIO_COLORS.text, display: 'block', marginBottom: '0.6rem' }}>
          Pie de página (Footer)
        </strong>
        <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem', fontWeight: 500 }}>
          <input
            type="checkbox"
            checked={footer.enabled}
            onChange={(e) => patchFooter({ enabled: e.target.checked })}
          />
          Mostrar footer completo de marca
        </label>
      </div>

      <div style={studioCardStyle}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '0.6rem' }}>
          <label style={studioLabelStyle}>
            <span>Fondo</span>
            <input
              type="color"
              value={footer.backgroundColor || '#000000'}
              onChange={(e) => patchFooter({ backgroundColor: e.target.value })}
              style={{ width: '100%', height: '32px', padding: 0, border: `1px solid ${STUDIO_COLORS.inputBorder}`, borderRadius: '5px' }}
            />
          </label>
          <label style={studioLabelStyle}>
            <span>Texto</span>
            <input
              type="color"
              value={footer.textColor || '#ffffff'}
              onChange={(e) => patchFooter({ textColor: e.target.value })}
              style={{ width: '100%', height: '32px', padding: 0, border: `1px solid ${STUDIO_COLORS.inputBorder}`, borderRadius: '5px' }}
            />
          </label>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
          <label style={studioLabelStyle}>
            <span>Bio breve de marca</span>
            <textarea
              rows={3}
              value={footer.bio ?? ''}
              onChange={(e) => patchFooter({ bio: e.target.value })}
              style={studioTextareaStyle}
            />
          </label>
          <label style={studioLabelStyle}>
            <span>Correo</span>
            <input
              type="email"
              value={footer.email ?? ''}
              onChange={(e) => patchFooter({ email: e.target.value })}
              style={studioInputStyle}
            />
          </label>
          <label style={studioLabelStyle}>
            <span>Instagram</span>
            <input
              type="text"
              value={footer.instagram ?? ''}
              placeholder="@usuario"
              onChange={(e) => patchFooter({ instagram: e.target.value })}
              style={studioInputStyle}
            />
          </label>
          <label style={studioLabelStyle}>
            <span>TikTok</span>
            <input
              type="text"
              value={footer.tiktok ?? ''}
              placeholder="@usuario"
              onChange={(e) => patchFooter({ tiktok: e.target.value })}
              style={studioInputStyle}
            />
          </label>
          <label style={studioLabelStyle}>
            <span>Pinterest</span>
            <input
              type="text"
              value={footer.pinterest ?? ''}
              placeholder="usuario"
              onChange={(e) => patchFooter({ pinterest: e.target.value })}
              style={studioInputStyle}
            />
          </label>
          <label style={studioLabelStyle}>
            <span>WhatsApp</span>
            <input
              type="text"
              value={footer.whatsapp ?? ''}
              placeholder="51999000000"
              onChange={(e) => patchFooter({ whatsapp: e.target.value })}
              style={studioInputStyle}
            />
          </label>
          <label style={studioLabelStyle}>
            <span>Texto de copyright</span>
            <input
              type="text"
              value={footer.copyrightText ?? ''}
              placeholder={`© ${new Date().getFullYear()} ${config.identity.siteTitle}`}
              onChange={(e) => patchFooter({ copyrightText: e.target.value })}
              style={studioInputStyle}
            />
          </label>
        </div>
      </div>

      <div style={studioCardStyle}>
        <strong style={{ fontSize: '0.8rem', color: STUDIO_COLORS.text, display: 'block', marginBottom: '0.45rem' }}>
          Enlaces rápidos del footer
        </strong>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          {quickLinks.map((lnk, idx) => (
            <div key={idx} style={{ display: 'flex', gap: '0.3rem', alignItems: 'center' }}>
              <input
                type="text"
                value={lnk.label}
                placeholder="Título"
                onChange={(e) =>
                  patchFooter({
                    quickLinks: quickLinks.map((it, i) => (i === idx ? { ...it, label: e.target.value } : it)),
                  })
                }
                style={{ ...studioInputStyle, width: '95px' }}
              />
              <input
                type="text"
                value={lnk.href}
                placeholder="#contact"
                onChange={(e) =>
                  patchFooter({
                    quickLinks: quickLinks.map((it, i) => (i === idx ? { ...it, href: e.target.value } : it)),
                  })
                }
                style={{ ...studioInputStyle, flex: 1 }}
              />
              <button
                type="button"
                aria-label="Eliminar enlace rápido"
                onClick={() => patchFooter({ quickLinks: quickLinks.filter((_, i) => i !== idx) })}
                style={{ ...studioIconBtn(false), color: STUDIO_COLORS.danger }}
              >
                ✕
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => patchFooter({ quickLinks: [...quickLinks, { label: 'Contacto', href: '#contact' }] })}
            style={studioSecondaryBtn}
          >
            + Agregar enlace rápido
          </button>
        </div>
      </div>
    </div>
  )
}
