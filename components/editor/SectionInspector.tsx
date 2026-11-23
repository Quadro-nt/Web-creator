'use client'

import { useState } from 'react'
import type { SectionConfig, SectionStyleConfig, SiteConfig } from '@/lib/schemas/site-config.schema'
import type { Artwork } from '@/lib/schemas/works.schema'
import {
  SECTION_TYPE_LABELS,
  SECTION_VARIANTS,
  getVariantLabelEs,
} from '@/app/editor/[token]/EditorConfig'
import { parseVideoEmbedUrl } from '@/components/templates/shared/template-helpers'
import ChromeInspector from './ChromeInspector'
import {
  STUDIO_COLORS,
  studioCardStyle,
  studioIconBtn,
  studioInputStyle,
  studioLabelStyle,
  studioSecondaryBtn,
  studioSelectStyle,
  studioTextareaStyle,
} from './studio-styles'

type ChromeTarget = 'announcement' | 'header' | 'footer'

type Props = {
  config: SiteConfig
  artistSlug: string
  editorToken?: string
  works: Artwork[]
  selectedSection: SectionConfig | null
  selectedChrome: ChromeTarget | null
  onSelectChrome: (target: ChromeTarget | null) => void
  onBackToSite: () => void
  onChangeIdentity: (identity: SiteConfig['identity']) => void
  onPatchConfig: (patch: Partial<SiteConfig>) => void
  onUpdateSection: (sectionId: string, updater: (prev: SectionConfig) => SectionConfig) => void
  onDuplicateSection: (sectionId: string) => void
  onDeleteSection: (sectionId: string) => void
  onOpenMediaPicker: (currentUrl: string, onSelect: (url: string) => void) => void
}

type ExhibitionItem = { title: string; year: number | string; place: string }
type GalleryItem = { url: string; caption?: string }
type PressItem = { title: string; publication: string; year?: string; url?: string; quote?: string }
type CategoryCardItem = { title: string; ctaLabel?: string; imageUrl?: string; filterTag?: string; href?: string }
type ReviewItem = { author: string; role?: string; quote: string; rating?: number; imageUrl?: string; videoUrl?: string }

function emptyToUndefined(v: string): string | undefined {
  const t = v.trim()
  return t.length === 0 ? undefined : t
}

export default function SectionInspector({
  config,
  artistSlug,
  editorToken,
  works,
  selectedSection,
  selectedChrome,
  onSelectChrome,
  onBackToSite,
  onChangeIdentity,
  onPatchConfig,
  onUpdateSection,
  onDuplicateSection,
  onDeleteSection,
  onOpenMediaPicker,
}: Props) {
  if (selectedChrome) {
    return (
      <ChromeInspector
        target={selectedChrome}
        config={config}
        onBack={() => onSelectChrome(null)}
        onChange={onPatchConfig}
      />
    )
  }

  if (!selectedSection) {
    const ogPreviewImg = config.identity.ogImageUrl || config.identity.coverImageUrl
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <div style={studioCardStyle}>
          <div style={{ fontSize: '0.72rem', fontWeight: 700, color: STUDIO_COLORS.muted, marginBottom: '0.45rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Estructura fija del sitio
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.35rem' }}>
            <button
              type="button"
              onClick={() => onSelectChrome('announcement')}
              style={{ ...studioSecondaryBtn, padding: '0.4rem 0.3rem', fontSize: '0.72rem' }}
            >
              📢 Anuncios
            </button>
            <button
              type="button"
              onClick={() => onSelectChrome('header')}
              style={{ ...studioSecondaryBtn, padding: '0.4rem 0.3rem', fontSize: '0.72rem' }}
            >
              🔝 Header
            </button>
            <button
              type="button"
              onClick={() => onSelectChrome('footer')}
              style={{ ...studioSecondaryBtn, padding: '0.4rem 0.3rem', fontSize: '0.72rem' }}
            >
              ⚓ Footer
            </button>
          </div>
        </div>

        <div style={studioCardStyle}>
          <h2 style={{ margin: '0 0 0.65rem', fontSize: '0.85rem', fontWeight: 700, color: STUDIO_COLORS.text }}>
            Identidad y SEO del sitio
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            <label style={studioLabelStyle}>
              <span>Título del sitio</span>
              <input
                type="text"
                value={config.identity.siteTitle}
                maxLength={80}
                onChange={(e) => onChangeIdentity({ ...config.identity, siteTitle: e.target.value })}
                style={studioInputStyle}
              />
            </label>

            <ImageField
              label="Logo del artista"
              value={config.identity.logoUrl ?? ''}
              onChange={(v) => onChangeIdentity({ ...config.identity, logoUrl: emptyToUndefined(v) })}
              onPick={() =>
                onOpenMediaPicker(config.identity.logoUrl ?? '', (url) =>
                  onChangeIdentity({ ...config.identity, logoUrl: url })
                )
              }
            />

            <ImageField
              label="Imagen de portada"
              value={config.identity.coverImageUrl ?? ''}
              onChange={(v) => onChangeIdentity({ ...config.identity, coverImageUrl: emptyToUndefined(v) })}
              onPick={() =>
                onOpenMediaPicker(config.identity.coverImageUrl ?? '', (url) =>
                  onChangeIdentity({ ...config.identity, coverImageUrl: url })
                )
              }
            />

            <ImageField
              label="Favicon"
              value={config.identity.faviconUrl ?? ''}
              onChange={(v) => onChangeIdentity({ ...config.identity, faviconUrl: emptyToUndefined(v) })}
              onPick={() =>
                onOpenMediaPicker(config.identity.faviconUrl ?? '', (url) =>
                  onChangeIdentity({ ...config.identity, faviconUrl: url })
                )
              }
            />

            <ImageField
              label="Imagen Open Graph (redes / WhatsApp)"
              value={config.identity.ogImageUrl ?? ''}
              onChange={(v) => onChangeIdentity({ ...config.identity, ogImageUrl: emptyToUndefined(v) })}
              onPick={() =>
                onOpenMediaPicker(config.identity.ogImageUrl ?? '', (url) =>
                  onChangeIdentity({ ...config.identity, ogImageUrl: url })
                )
              }
            />
          </div>
        </div>

        <div style={studioCardStyle}>
          <div style={{ fontSize: '0.72rem', fontWeight: 700, color: STUDIO_COLORS.muted, marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Vista previa al compartir enlace
          </div>
          <div style={{ border: `1px solid ${STUDIO_COLORS.border}`, borderRadius: '6px', overflow: 'hidden', background: STUDIO_COLORS.chrome }}>
            {ogPreviewImg && (
              <div style={{ aspectRatio: '1200/630', background: '#e2e8f0', overflow: 'hidden' }}>
                <img src={ogPreviewImg} alt="Open Graph" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
              </div>
            )}
            <div style={{ padding: '0.55rem 0.65rem' }}>
              <div style={{ fontSize: '0.7rem', color: STUDIO_COLORS.muted }}>{artistSlug}.quadro-nt.com</div>
              <div style={{ fontSize: '0.82rem', fontWeight: 600, color: STUDIO_COLORS.text, marginTop: '0.15rem' }}>
                {config.identity.siteTitle}
              </div>
            </div>
          </div>
        </div>

        <div style={{ ...studioCardStyle, background: STUDIO_COLORS.chrome }}>
          <p style={{ margin: 0, fontSize: '0.75rem', color: STUDIO_COLORS.muted, lineHeight: 1.5 }}>
            Haz clic en cualquier bloque del lienzo (o en su barra/header/footer) para editarlo al instante.
          </p>
        </div>
      </div>
    )
  }

  const section = selectedSection
  const label = SECTION_TYPE_LABELS[section.type] ?? section.type
  const variants = SECTION_VARIANTS[section.type] ?? [section.variant]
  const allVariants = variants.includes(section.variant) ? variants : [...variants, section.variant]
  const patchContent = (patch: Record<string, unknown>) => {
    onUpdateSection(section.id, (prev) => ({
      ...prev,
      content: { ...prev.content, ...patch },
    }))
  }
  const patchSectionStyle = (patch: Partial<SectionStyleConfig>) => {
    onUpdateSection(section.id, (prev) => ({
      ...prev,
      style: { ...prev.style, ...patch },
    }))
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      <div style={studioCardStyle}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', marginBottom: '0.6rem' }}>
          <button type="button" onClick={onBackToSite} style={{ ...studioSecondaryBtn, padding: '0.25rem 0.5rem', fontSize: '0.72rem' }}>
            ← Sitio
          </button>
          <div style={{ display: 'flex', gap: '0.25rem' }}>
            <button type="button" onClick={() => onDuplicateSection(section.id)} title="Duplicar módulo" style={studioIconBtn(false)}>
              ⧉
            </button>
            <button
              type="button"
              onClick={() => onDeleteSection(section.id)}
              title="Eliminar módulo"
              style={{ ...studioIconBtn(false), color: STUDIO_COLORS.danger }}
            >
              ✕
            </button>
          </div>
        </div>

        <strong style={{ fontSize: '0.92rem', color: STUDIO_COLORS.text, display: 'block', marginBottom: '0.6rem' }}>
          {label}
        </strong>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
          <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: STUDIO_COLORS.text }}>
            <input
              type="checkbox"
              checked={section.visible}
              onChange={(e) =>
                onUpdateSection(section.id, (prev) => ({ ...prev, visible: e.target.checked }))
              }
            />
            Sección visible en la página
          </label>

          <div>
            <span style={{ fontSize: '0.72rem', fontWeight: 500, color: '#334155', display: 'block', marginBottom: '0.28rem' }}>
              Diseño del bloque
            </span>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.3rem' }}>
              {allVariants.map((v) => {
                const active = section.variant === v
                return (
                  <button
                    key={v}
                    type="button"
                    onClick={() =>
                      onUpdateSection(section.id, (prev) => ({ ...prev, variant: v }))
                    }
                    style={{
                      padding: '0.36rem 0.45rem',
                      borderRadius: '6px',
                      border: active
                        ? `1.5px solid ${STUDIO_COLORS.accent}`
                        : `1px solid ${STUDIO_COLORS.inputBorder}`,
                      background: active ? STUDIO_COLORS.accentSoft : STUDIO_COLORS.surface,
                      color: active ? STUDIO_COLORS.accent : STUDIO_COLORS.text,
                      fontSize: '0.73rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                      textAlign: 'center',
                    }}
                  >
                    {getVariantLabelEs(v)}
                  </button>
                )
              })}
            </div>
          </div>

          {section.type !== 'cover' &&
            section.type !== 'divider' &&
            section.type !== 'marquee' &&
            section.type !== 'social-strip' && (
              <label style={studioLabelStyle}>
                <span>Nombre en barra de navegación</span>
                <input
                  type="text"
                  value={String(section.content.navLabel ?? '')}
                  placeholder={label}
                  onChange={(e) => patchContent({ navLabel: e.target.value })}
                  style={studioInputStyle}
                />
              </label>
            )}
        </div>
      </div>

      <div style={studioCardStyle}>
        <h3 style={{ margin: '0 0 0.55rem', fontSize: '0.82rem', fontWeight: 700, color: STUDIO_COLORS.text }}>
          Estilo de esta sección
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
          <div>
            <span style={{ fontSize: '0.72rem', color: STUDIO_COLORS.muted, display: 'block', marginBottom: '0.25rem' }}>
              Fondo del bloque
            </span>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.25rem' }}>
              {(
                [
                  { value: 'default', label: 'Fondo del sitio' },
                  { value: 'dark', label: 'Oscuro' },
                  { value: 'accent', label: 'Color de acento' },
                  { value: 'soft', label: 'Superficie suave' },
                ] as const
              ).map((opt) => {
                const active = (section.style?.colorScheme ?? 'default') === opt.value
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => patchSectionStyle({ colorScheme: opt.value })}
                    style={{
                      padding: '0.32rem 0.4rem',
                      borderRadius: '6px',
                      border: `1px solid ${active ? STUDIO_COLORS.accent : STUDIO_COLORS.inputBorder}`,
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

          <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78rem' }}>
            <input
              type="checkbox"
              checked={Boolean(section.style?.framed)}
              onChange={(e) => patchSectionStyle({ framed: e.target.checked })}
            />
            Enmarcar sección con borde fino
          </label>

          <div>
            <span style={{ fontSize: '0.72rem', color: STUDIO_COLORS.muted, display: 'block', marginBottom: '0.25rem' }}>
              Aire vertical
            </span>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.25rem' }}>
              {(
                [
                  { value: 'sm', label: 'Compacto' },
                  { value: 'md', label: 'Normal' },
                  { value: 'lg', label: 'Amplio' },
                ] as const
              ).map((opt) => {
                const active = (section.style?.padding ?? 'md') === opt.value
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => patchSectionStyle({ padding: opt.value })}
                    style={{
                      padding: '0.28rem',
                      borderRadius: '6px',
                      border: `1px solid ${active ? STUDIO_COLORS.accent : STUDIO_COLORS.inputBorder}`,
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
        </div>
      </div>

      <div style={studioCardStyle}>
        <h3 style={{ margin: '0 0 0.65rem', fontSize: '0.82rem', fontWeight: 700, color: STUDIO_COLORS.text }}>
          Contenido del módulo
        </h3>
        <ModuleFields
          section={section}
          works={works}
          artistSlug={artistSlug}
          editorToken={editorToken}
          patchContent={patchContent}
          onOpenMediaPicker={onOpenMediaPicker}
        />
      </div>
    </div>
  )
}

function ModuleFields({
  section,
  works,
  artistSlug,
  editorToken,
  patchContent,
  onOpenMediaPicker,
}: {
  section: SectionConfig
  works: Artwork[]
  artistSlug: string
  editorToken?: string
  patchContent: (patch: Record<string, unknown>) => void
  onOpenMediaPicker: (currentUrl: string, onSelect: (url: string) => void) => void
}) {
  const [subCount, setSubCount] = useState<number | null>(null)
  const [subLoading, setSubLoading] = useState(false)
  const c = section.content

  switch (section.type) {
    case 'cover':
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
          <label style={studioLabelStyle}>
            <span>Titular principal (H1)</span>
            <input
              type="text"
              value={String(c.headline ?? '')}
              placeholder="Usa el título del sitio si está vacío"
              onChange={(e) => patchContent({ headline: e.target.value })}
              style={studioInputStyle}
            />
          </label>
          <label style={studioLabelStyle}>
            <span>Subtítulo</span>
            <input
              type="text"
              value={String(c.subtitle ?? '')}
              placeholder="Ej. Pintora — Lima, Perú"
              onChange={(e) => patchContent({ subtitle: e.target.value })}
              style={studioInputStyle}
            />
          </label>
          <label style={studioLabelStyle}>
            <span>Texto del botón (opcional)</span>
            <input
              type="text"
              value={String(c.ctaText ?? '')}
              placeholder="Ver obras"
              onChange={(e) => patchContent({ ctaText: e.target.value })}
              style={studioInputStyle}
            />
          </label>
          <label style={studioLabelStyle}>
            <span>Enlace del botón</span>
            <input
              type="text"
              value={String(c.ctaHref ?? '')}
              placeholder="#artworks"
              onChange={(e) => patchContent({ ctaHref: e.target.value })}
              style={studioInputStyle}
            />
          </label>
          <ImageField
            label="Imagen de esta portada (opcional)"
            value={String(c.imageUrl ?? '')}
            onChange={(v) => patchContent({ imageUrl: v })}
            onPick={() =>
              onOpenMediaPicker(String(c.imageUrl ?? ''), (url) => patchContent({ imageUrl: url }))
            }
          />
        </div>
      )

    case 'artworks':
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
          <label style={studioLabelStyle}>
            <span>Título de sección</span>
            <input
              type="text"
              value={String(c.title ?? '')}
              placeholder="Obras"
              onChange={(e) => patchContent({ title: e.target.value })}
              style={studioInputStyle}
            />
          </label>
          <label style={studioLabelStyle}>
            <span>Subtítulo</span>
            <input
              type="text"
              value={String(c.subtitle ?? '')}
              onChange={(e) => patchContent({ subtitle: e.target.value })}
              style={studioInputStyle}
            />
          </label>
          <label style={studioLabelStyle}>
            <span>Columnas (sobreescribe diseño)</span>
            <select
              value={String(c.columns ?? '')}
              onChange={(e) => patchContent({ columns: e.target.value || undefined })}
              style={studioSelectStyle}
            >
              <option value="">Usar diseño global</option>
              <option value="2">2 columnas</option>
              <option value="3">3 columnas</option>
              <option value="4">4 columnas</option>
            </select>
          </label>
          <label style={studioLabelStyle}>
            <span>Filtrar por etiqueta</span>
            <input
              type="text"
              value={String(c.filterTag ?? '')}
              placeholder="Ej. óleo"
              onChange={(e) => patchContent({ filterTag: e.target.value })}
              style={studioInputStyle}
            />
          </label>
          <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem' }}>
            <input
              type="checkbox"
              checked={Boolean(c.enableFilters)}
              onChange={(e) => patchContent({ enableFilters: e.target.checked })}
            />
            Mostrar filtros por colección y orden
          </label>
          <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem' }}>
            <input
              type="checkbox"
              checked={Boolean(c.enableSearch)}
              onChange={(e) => patchContent({ enableSearch: e.target.checked })}
            />
            Mostrar buscador en catálogo
          </label>
          <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem' }}>
            <input
              type="checkbox"
              checked={c.showSold !== false}
              onChange={(e) => patchContent({ showSold: e.target.checked })}
            />
            Mostrar obras vendidas
          </label>
          <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem' }}>
            <input
              type="checkbox"
              checked={Boolean(c.showPrices)}
              onChange={(e) => patchContent({ showPrices: e.target.checked })}
            />
            Mostrar precios en tarjetas
          </label>
        </div>
      )

    case 'bio':
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
          <label style={studioLabelStyle}>
            <span>Encabezado</span>
            <input
              type="text"
              value={String(c.heading ?? '')}
              placeholder="Sobre el artista"
              onChange={(e) => patchContent({ heading: e.target.value })}
              style={studioInputStyle}
            />
          </label>
          <label style={studioLabelStyle}>
            <span>Biografía</span>
            <textarea
              rows={6}
              value={String(c.text ?? '')}
              onChange={(e) => patchContent({ text: e.target.value })}
              style={studioTextareaStyle}
            />
          </label>
          <ImageField
            label="Foto del artista o taller"
            value={String(c.photoUrl ?? '')}
            onChange={(v) => patchContent({ photoUrl: v })}
            onPick={() =>
              onOpenMediaPicker(String(c.photoUrl ?? ''), (url) => patchContent({ photoUrl: url }))
            }
          />
        </div>
      )

    case 'exhibitions': {
      const list = Array.isArray(c.exhibitions) ? (c.exhibitions as ExhibitionItem[]) : []
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
          <label style={studioLabelStyle}>
            <span>Encabezado</span>
            <input
              type="text"
              value={String(c.heading ?? '')}
              placeholder="Exposiciones"
              onChange={(e) => patchContent({ heading: e.target.value })}
              style={studioInputStyle}
            />
          </label>
          {list.map((item, idx) => (
            <div key={idx} style={{ border: `1px solid ${STUDIO_COLORS.border}`, borderRadius: '6px', padding: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.4rem', background: STUDIO_COLORS.chrome }}>
              <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
                <input
                  type="text"
                  value={String(item.year ?? '')}
                  placeholder="Año"
                  onChange={(e) => {
                    const next = list.map((it, i) => (i === idx ? { ...it, year: e.target.value } : it))
                    patchContent({ exhibitions: next })
                  }}
                  style={{ ...studioInputStyle, width: '76px' }}
                />
                <input
                  type="text"
                  value={item.title ?? ''}
                  placeholder="Título"
                  onChange={(e) => {
                    const next = list.map((it, i) => (i === idx ? { ...it, title: e.target.value } : it))
                    patchContent({ exhibitions: next })
                  }}
                  style={{ ...studioInputStyle, flex: 1 }}
                />
                <button
                  type="button"
                  aria-label="Eliminar exposición"
                  onClick={() => patchContent({ exhibitions: list.filter((_, i) => i !== idx) })}
                  style={{ ...studioIconBtn(false), color: STUDIO_COLORS.danger }}
                >
                  ✕
                </button>
              </div>
              <input
                type="text"
                value={item.place ?? ''}
                placeholder="Galería / Ciudad"
                onChange={(e) => {
                  const next = list.map((it, i) => (i === idx ? { ...it, place: e.target.value } : it))
                  patchContent({ exhibitions: next })
                }}
                style={studioInputStyle}
              />
            </div>
          ))}
          <button
            type="button"
            onClick={() =>
              patchContent({
                exhibitions: [...list, { year: new Date().getFullYear(), title: 'Nueva muestra', place: '' }],
              })
            }
            style={studioSecondaryBtn}
          >
            + Agregar exposición
          </button>
        </div>
      )
    }

    case 'contact':
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
          <label style={studioLabelStyle}>
            <span>Encabezado</span>
            <input type="text" value={String(c.heading ?? '')} placeholder="Hablemos" onChange={(e) => patchContent({ heading: e.target.value })} style={studioInputStyle} />
          </label>
          <label style={studioLabelStyle}>
            <span>Texto introductorio</span>
            <textarea rows={2} value={String(c.intro ?? '')} onChange={(e) => patchContent({ intro: e.target.value })} style={studioTextareaStyle} />
          </label>
          <label style={studioLabelStyle}>
            <span>Correo electrónico</span>
            <input type="email" value={String(c.email ?? '')} onChange={(e) => patchContent({ email: e.target.value })} style={studioInputStyle} />
          </label>
          <label style={studioLabelStyle}>
            <span>Instagram</span>
            <input type="text" value={String(c.instagram ?? '')} placeholder="@usuario" onChange={(e) => patchContent({ instagram: e.target.value })} style={studioInputStyle} />
          </label>
          <label style={studioLabelStyle}>
            <span>WhatsApp (con código de país)</span>
            <input type="text" value={String(c.whatsapp ?? '')} placeholder="51999000000" onChange={(e) => patchContent({ whatsapp: e.target.value })} style={studioInputStyle} />
          </label>
        </div>
      )

    case 'marquee': {
      const items = Array.isArray(c.items) ? (c.items as string[]) : []
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#334155' }}>Frases de la cinta</span>
          {items.map((txt, idx) => (
            <div key={idx} style={{ display: 'flex', gap: '0.3rem', alignItems: 'center' }}>
              <input
                type="text"
                value={txt}
                onChange={(e) => patchContent({ items: items.map((m, i) => (i === idx ? e.target.value : m)) })}
                style={{ ...studioInputStyle, flex: 1 }}
              />
              <button
                type="button"
                aria-label="Eliminar frase"
                onClick={() => patchContent({ items: items.filter((_, i) => i !== idx) })}
                style={{ ...studioIconBtn(false), color: STUDIO_COLORS.danger }}
              >
                ✕
              </button>
            </div>
          ))}
          <button type="button" onClick={() => patchContent({ items: [...items, 'NUEVO MENSAJE'] })} style={studioSecondaryBtn}>
            + Agregar frase
          </button>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
            <label style={studioLabelStyle}>
              <span>Inclinación</span>
              <select value={String(c.angle ?? '0')} onChange={(e) => patchContent({ angle: e.target.value })} style={studioSelectStyle}>
                <option value="-4">-4° inclinada</option>
                <option value="-2">-2° sutil</option>
                <option value="0">0° recta</option>
                <option value="2">+2° sutil</option>
                <option value="4">+4° inclinada</option>
              </select>
            </label>
            <label style={studioLabelStyle}>
              <span>Dirección</span>
              <select value={String(c.direction ?? 'left')} onChange={(e) => patchContent({ direction: e.target.value })} style={studioSelectStyle}>
                <option value="left">Hacia izquierda</option>
                <option value="right">Hacia derecha</option>
              </select>
            </label>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
            <label style={studioLabelStyle}>
              <span>Fondo pastilla</span>
              <input type="color" value={String(c.pillBg ?? '#ec9fbf')} onChange={(e) => patchContent({ pillBg: e.target.value })} style={{ width: '100%', height: '30px', padding: 0 }} />
            </label>
            <label style={studioLabelStyle}>
              <span>Texto / Borde</span>
              <input type="color" value={String(c.pillText ?? '#4b0303')} onChange={(e) => patchContent({ pillText: e.target.value })} style={{ width: '100%', height: '30px', padding: 0 }} />
            </label>
          </div>
        </div>
      )
    }

    case 'category-grid': {
      const cards = Array.isArray(c.cards) ? (c.cards as CategoryCardItem[]) : []
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
          <label style={studioLabelStyle}>
            <span>Columnas</span>
            <select value={String(c.columns ?? '2')} onChange={(e) => patchContent({ columns: e.target.value })} style={studioSelectStyle}>
              <option value="2">2 tarjetas</option>
              <option value="3">3 tarjetas</option>
              <option value="4">4 tarjetas</option>
            </select>
          </label>
          {cards.map((card, idx) => (
            <div key={idx} style={{ border: `1px solid ${STUDIO_COLORS.border}`, borderRadius: '6px', padding: '0.55rem', display: 'flex', flexDirection: 'column', gap: '0.4rem', background: STUDIO_COLORS.chrome }}>
              <div style={{ display: 'flex', gap: '0.3rem', alignItems: 'center' }}>
                <input
                  type="text"
                  value={card.title ?? ''}
                  placeholder="Título (ej. ORIGINALES)"
                  onChange={(e) => patchContent({ cards: cards.map((it, i) => (i === idx ? { ...it, title: e.target.value } : it)) })}
                  style={{ ...studioInputStyle, flex: 1 }}
                />
                <button
                  type="button"
                  aria-label="Eliminar tarjeta"
                  onClick={() => patchContent({ cards: cards.filter((_, i) => i !== idx) })}
                  style={{ ...studioIconBtn(false), color: STUDIO_COLORS.danger }}
                >
                  ✕
                </button>
              </div>
              <input
                type="text"
                value={card.ctaLabel ?? ''}
                placeholder="Subtexto (ej. EXPLORAR)"
                onChange={(e) => patchContent({ cards: cards.map((it, i) => (i === idx ? { ...it, ctaLabel: e.target.value } : it)) })}
                style={studioInputStyle}
              />
              <input
                type="text"
                value={card.filterTag ?? ''}
                placeholder="Etiqueta a filtrar en Obras (opcional)"
                onChange={(e) => patchContent({ cards: cards.map((it, i) => (i === idx ? { ...it, filterTag: e.target.value } : it)) })}
                style={studioInputStyle}
              />
              <ImageField
                label="Foto"
                value={card.imageUrl ?? ''}
                onChange={(url) => patchContent({ cards: cards.map((it, i) => (i === idx ? { ...it, imageUrl: url } : it)) })}
                onPick={() =>
                  onOpenMediaPicker(card.imageUrl ?? '', (url) =>
                    patchContent({ cards: cards.map((it, i) => (i === idx ? { ...it, imageUrl: url } : it)) })
                  )
                }
              />
            </div>
          ))}
          <button
            type="button"
            onClick={() =>
              patchContent({
                cards: [...cards, { title: 'NUEVA SERIE', ctaLabel: 'VER COLECCIÓN', imageUrl: 'https://picsum.photos/seed/cat-new/900/700', filterTag: '' }],
              })
            }
            style={studioSecondaryBtn}
          >
            + Agregar tarjeta de colección
          </button>
        </div>
      )
    }

    case 'feature-split':
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
          <label style={studioLabelStyle}>
            <span>Antetítulo</span>
            <input type="text" value={String(c.eyebrow ?? '')} onChange={(e) => patchContent({ eyebrow: e.target.value })} style={studioInputStyle} />
          </label>
          <label style={studioLabelStyle}>
            <span>Título</span>
            <input type="text" value={String(c.heading ?? '')} onChange={(e) => patchContent({ heading: e.target.value })} style={studioInputStyle} />
          </label>
          <label style={studioLabelStyle}>
            <span>Texto</span>
            <textarea rows={4} value={String(c.text ?? '')} onChange={(e) => patchContent({ text: e.target.value })} style={studioTextareaStyle} />
          </label>
          <label style={studioLabelStyle}>
            <span>Firma (opcional)</span>
            <input type="text" value={String(c.signature ?? '')} placeholder="- Nombre" onChange={(e) => patchContent({ signature: e.target.value })} style={studioInputStyle} />
          </label>
          <label style={studioLabelStyle}>
            <span>Texto del botón</span>
            <input type="text" value={String(c.buttonText ?? '')} onChange={(e) => patchContent({ buttonText: e.target.value })} style={studioInputStyle} />
          </label>
          <label style={studioLabelStyle}>
            <span>Enlace del botón</span>
            <input type="text" value={String(c.buttonHref ?? '')} placeholder="#bio o https://..." onChange={(e) => patchContent({ buttonHref: e.target.value })} style={studioInputStyle} />
          </label>
          <ImageField
            label="Foto lateral"
            value={String(c.imageUrl ?? '')}
            onChange={(v) => patchContent({ imageUrl: v })}
            onPick={() => onOpenMediaPicker(String(c.imageUrl ?? ''), (url) => patchContent({ imageUrl: url }))}
          />
        </div>
      )

    case 'social-strip': {
      const images = Array.isArray(c.images) ? (c.images as GalleryItem[]) : []
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
          <label style={studioLabelStyle}>
            <span>Texto superior</span>
            <input type="text" value={String(c.eyebrow ?? '')} onChange={(e) => patchContent({ eyebrow: e.target.value })} style={studioInputStyle} />
          </label>
          <label style={studioLabelStyle}>
            <span>Usuario / Handle gigante</span>
            <input type="text" value={String(c.handle ?? '')} placeholder="@tu.estudio" onChange={(e) => patchContent({ handle: e.target.value })} style={studioInputStyle} />
          </label>
          <p style={{ margin: 0, fontSize: '0.72rem', color: STUDIO_COLORS.muted }}>
            Si no agregas fotos aquí, usa automáticamente tus obras registradas.
          </p>
          {images.map((img, idx) => (
            <div key={idx} style={{ display: 'flex', gap: '0.3rem', alignItems: 'center' }}>
              <input
                type="text"
                value={img.url ?? ''}
                onChange={(e) => patchContent({ images: images.map((it, i) => (i === idx ? { ...it, url: e.target.value } : it)) })}
                style={{ ...studioInputStyle, flex: 1 }}
              />
              <button
                type="button"
                aria-label="Quitar foto social"
                onClick={() => patchContent({ images: images.filter((_, i) => i !== idx) })}
                style={{ ...studioIconBtn(false), color: STUDIO_COLORS.danger }}
              >
                ✕
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => onOpenMediaPicker('', (url) => patchContent({ images: [...images, { url }] }))}
            style={studioSecondaryBtn}
          >
            + Subir / Elegir foto
          </button>
        </div>
      )
    }

    case 'reviews': {
      const items = Array.isArray(c.items) ? (c.items as ReviewItem[]) : []
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
          <label style={studioLabelStyle}>
            <span>Antetítulo</span>
            <input type="text" value={String(c.eyebrow ?? '')} onChange={(e) => patchContent({ eyebrow: e.target.value })} style={studioInputStyle} />
          </label>
          <label style={studioLabelStyle}>
            <span>Título</span>
            <input type="text" value={String(c.title ?? '')} onChange={(e) => patchContent({ title: e.target.value })} style={studioInputStyle} />
          </label>
          {items.map((item, idx) => (
            <div key={idx} style={{ border: `1px solid ${STUDIO_COLORS.border}`, borderRadius: '6px', padding: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.35rem', background: STUDIO_COLORS.chrome }}>
              <div style={{ display: 'flex', gap: '0.3rem' }}>
                <input
                  type="text"
                  value={item.author ?? ''}
                  placeholder="Nombre"
                  onChange={(e) => patchContent({ items: items.map((it, i) => (i === idx ? { ...it, author: e.target.value } : it)) })}
                  style={{ ...studioInputStyle, flex: 1 }}
                />
                <button
                  type="button"
                  aria-label="Eliminar reseña"
                  onClick={() => patchContent({ items: items.filter((_, i) => i !== idx) })}
                  style={{ ...studioIconBtn(false), color: STUDIO_COLORS.danger }}
                >
                  ✕
                </button>
              </div>
              <input
                type="text"
                value={item.role ?? ''}
                placeholder="Ciudad o rol (ej. Coleccionista)"
                onChange={(e) => patchContent({ items: items.map((it, i) => (i === idx ? { ...it, role: e.target.value } : it)) })}
                style={studioInputStyle}
              />
              <textarea
                rows={2}
                value={item.quote ?? ''}
                placeholder="Testimonio"
                onChange={(e) => patchContent({ items: items.map((it, i) => (i === idx ? { ...it, quote: e.target.value } : it)) })}
                style={studioTextareaStyle}
              />
            </div>
          ))}
          <button
            type="button"
            onClick={() =>
              patchContent({ items: [...items, { author: 'Cliente', role: 'Coleccionista', quote: 'Excelente obra y envío.', rating: 5 }] })
            }
            style={studioSecondaryBtn}
          >
            + Agregar reseña
          </button>
        </div>
      )
    }

    case 'newsletter':
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
          <label style={studioLabelStyle}>
            <span>Título</span>
            <input type="text" value={String(c.heading ?? '')} onChange={(e) => patchContent({ heading: e.target.value })} style={studioInputStyle} />
          </label>
          <label style={studioLabelStyle}>
            <span>Descripción / Beneficio</span>
            <textarea rows={3} value={String(c.description ?? '')} onChange={(e) => patchContent({ description: e.target.value })} style={studioTextareaStyle} />
          </label>
          <label style={studioLabelStyle}>
            <span>Texto del botón</span>
            <input type="text" value={String(c.buttonText ?? '')} onChange={(e) => patchContent({ buttonText: e.target.value })} style={studioInputStyle} />
          </label>
          {editorToken && (
            <div style={{ paddingTop: '0.4rem', borderTop: `1px solid ${STUDIO_COLORS.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
              <button
                type="button"
                disabled={subLoading}
                onClick={async () => {
                  setSubLoading(true)
                  try {
                    const res = await fetch(`/api/newsletter?artistSlug=${encodeURIComponent(artistSlug)}`, {
                      headers: { 'x-editor-token': editorToken },
                    })
                    if (res.ok) {
                      const data = (await res.json()) as { count?: number }
                      setSubCount(data.count ?? 0)
                    }
                  } finally {
                    setSubLoading(false)
                  }
                }}
                style={{ ...studioSecondaryBtn, fontSize: '0.72rem' }}
              >
                {subLoading ? 'Consultando…' : 'Ver suscriptores'}
              </button>
              {subCount !== null && (
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: STUDIO_COLORS.success }}>
                  {subCount} {subCount === 1 ? 'suscriptor' : 'suscriptores'}
                </span>
              )}
            </div>
          )}
        </div>
      )

    case 'featured-work':
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
          <label style={studioLabelStyle}>
            <span>Obra a destacar</span>
            <select value={String(c.workSlug ?? '')} onChange={(e) => patchContent({ workSlug: e.target.value })} style={studioSelectStyle}>
              <option value="">Primera obra disponible</option>
              {works.map((w) => (
                <option key={w.slug} value={w.slug}>
                  {w.title} ({w.year})
                </option>
              ))}
            </select>
          </label>
          <label style={studioLabelStyle}>
            <span>Antetítulo</span>
            <input type="text" value={String(c.eyebrow ?? '')} onChange={(e) => patchContent({ eyebrow: e.target.value })} style={studioInputStyle} />
          </label>
          <label style={studioLabelStyle}>
            <span>Nota curatorial</span>
            <textarea rows={3} value={String(c.note ?? '')} onChange={(e) => patchContent({ note: e.target.value })} style={studioTextareaStyle} />
          </label>
          <label style={studioLabelStyle}>
            <span>Texto del botón</span>
            <input type="text" value={String(c.buttonText ?? '')} placeholder="Usa el texto global del botón" onChange={(e) => patchContent({ buttonText: e.target.value })} style={studioInputStyle} />
          </label>
          <label style={studioLabelStyle}>
            <span>WhatsApp directo (opcional)</span>
            <input type="text" value={String(c.whatsapp ?? '')} placeholder="51999000000" onChange={(e) => patchContent({ whatsapp: e.target.value })} style={studioInputStyle} />
          </label>
        </div>
      )

    case 'statement':
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
          <label style={studioLabelStyle}>
            <span>Antetítulo</span>
            <input type="text" value={String(c.eyebrow ?? '')} onChange={(e) => patchContent({ eyebrow: e.target.value })} style={studioInputStyle} />
          </label>
          <label style={studioLabelStyle}>
            <span>Cita o manifiesto</span>
            <textarea rows={4} value={String(c.quote ?? c.text ?? '')} onChange={(e) => patchContent({ quote: e.target.value })} style={studioTextareaStyle} />
          </label>
          <label style={studioLabelStyle}>
            <span>Autor / Firma (opcional)</span>
            <input type="text" value={String(c.author ?? '')} onChange={(e) => patchContent({ author: e.target.value })} style={studioInputStyle} />
          </label>
        </div>
      )

    case 'gallery': {
      const images = Array.isArray(c.images) ? (c.images as GalleryItem[]) : []
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
          <label style={studioLabelStyle}>
            <span>Título</span>
            <input type="text" value={String(c.title ?? '')} onChange={(e) => patchContent({ title: e.target.value })} style={studioInputStyle} />
          </label>
          <label style={studioLabelStyle}>
            <span>Subtítulo</span>
            <input type="text" value={String(c.subtitle ?? '')} onChange={(e) => patchContent({ subtitle: e.target.value })} style={studioInputStyle} />
          </label>
          {images.map((img, idx) => (
            <div key={idx} style={{ border: `1px solid ${STUDIO_COLORS.border}`, borderRadius: '6px', padding: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.35rem', background: STUDIO_COLORS.chrome }}>
              <div style={{ display: 'flex', gap: '0.3rem', alignItems: 'center' }}>
                <input
                  type="text"
                  value={img.url ?? ''}
                  placeholder="URL de imagen"
                  onChange={(e) => patchContent({ images: images.map((it, i) => (i === idx ? { ...it, url: e.target.value } : it)) })}
                  style={{ ...studioInputStyle, flex: 1 }}
                />
                <button
                  type="button"
                  onClick={() =>
                    onOpenMediaPicker(img.url ?? '', (url) =>
                      patchContent({ images: images.map((it, i) => (i === idx ? { ...it, url } : it)) })
                    )
                  }
                  style={{ ...studioSecondaryBtn, padding: '0.28rem 0.45rem', fontSize: '0.7rem' }}
                >
                  Elegir
                </button>
                <button
                  type="button"
                  aria-label="Eliminar foto"
                  onClick={() => patchContent({ images: images.filter((_, i) => i !== idx) })}
                  style={{ ...studioIconBtn(false), color: STUDIO_COLORS.danger }}
                >
                  ✕
                </button>
              </div>
              <input
                type="text"
                value={img.caption ?? ''}
                placeholder="Pie de foto (opcional)"
                onChange={(e) => patchContent({ images: images.map((it, i) => (i === idx ? { ...it, caption: e.target.value } : it)) })}
                style={studioInputStyle}
              />
            </div>
          ))}
          <button
            type="button"
            onClick={() => onOpenMediaPicker('', (url) => patchContent({ images: [...images, { url, caption: '' }] }))}
            style={studioSecondaryBtn}
          >
            + Subir / Elegir foto
          </button>
        </div>
      )
    }

    case 'press': {
      const items = Array.isArray(c.items) ? (c.items as PressItem[]) : []
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
          <label style={studioLabelStyle}>
            <span>Título</span>
            <input type="text" value={String(c.title ?? '')} onChange={(e) => patchContent({ title: e.target.value })} style={studioInputStyle} />
          </label>
          {items.map((item, idx) => (
            <div key={idx} style={{ border: `1px solid ${STUDIO_COLORS.border}`, borderRadius: '6px', padding: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.35rem', background: STUDIO_COLORS.chrome }}>
              <div style={{ display: 'flex', gap: '0.3rem' }}>
                <input
                  type="text"
                  value={item.title ?? ''}
                  placeholder="Título / Nota"
                  onChange={(e) => patchContent({ items: items.map((it, i) => (i === idx ? { ...it, title: e.target.value } : it)) })}
                  style={{ ...studioInputStyle, flex: 1 }}
                />
                <button
                  type="button"
                  aria-label="Eliminar mención"
                  onClick={() => patchContent({ items: items.filter((_, i) => i !== idx) })}
                  style={{ ...studioIconBtn(false), color: STUDIO_COLORS.danger }}
                >
                  ✕
                </button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 76px', gap: '0.35rem' }}>
                <input
                  type="text"
                  value={item.publication ?? ''}
                  placeholder="Medio"
                  onChange={(e) => patchContent({ items: items.map((it, i) => (i === idx ? { ...it, publication: e.target.value } : it)) })}
                  style={studioInputStyle}
                />
                <input
                  type="text"
                  value={item.year ?? ''}
                  placeholder="Año"
                  onChange={(e) => patchContent({ items: items.map((it, i) => (i === idx ? { ...it, year: e.target.value } : it)) })}
                  style={studioInputStyle}
                />
              </div>
              <input
                type="url"
                value={item.url ?? ''}
                placeholder="https://enlace-al-articulo"
                onChange={(e) => patchContent({ items: items.map((it, i) => (i === idx ? { ...it, url: e.target.value } : it)) })}
                style={studioInputStyle}
              />
            </div>
          ))}
          <button
            type="button"
            onClick={() =>
              patchContent({
                items: [...items, { title: 'Nueva mención', publication: '', year: String(new Date().getFullYear()), url: '' }],
              })
            }
            style={studioSecondaryBtn}
          >
            + Agregar mención
          </button>
        </div>
      )
    }

    case 'video': {
      const rawUrl = String(c.url ?? '')
      const isValidVideo = rawUrl.trim().length > 0 && parseVideoEmbedUrl(rawUrl) !== null
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
          <label style={studioLabelStyle}>
            <span>Título</span>
            <input type="text" value={String(c.title ?? '')} onChange={(e) => patchContent({ title: e.target.value })} style={studioInputStyle} />
          </label>
          <label style={studioLabelStyle}>
            <span>URL de YouTube o Vimeo</span>
            <input type="url" value={rawUrl} placeholder="https://www.youtube.com/watch?v=..." onChange={(e) => patchContent({ url: e.target.value })} style={studioInputStyle} />
          </label>
          {rawUrl.trim().length > 0 && (
            <span style={{ fontSize: '0.72rem', color: isValidVideo ? STUDIO_COLORS.success : STUDIO_COLORS.danger }}>
              {isValidVideo ? 'Enlace reconocido correctamente' : 'URL no reconocida (usa youtube.com, youtu.be o vimeo.com)'}
            </span>
          )}
          <label style={studioLabelStyle}>
            <span>Descripción</span>
            <textarea rows={3} value={String(c.caption ?? '')} onChange={(e) => patchContent({ caption: e.target.value })} style={studioTextareaStyle} />
          </label>
        </div>
      )
    }

    case 'cta':
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
          <label style={studioLabelStyle}>
            <span>Estado de encargos</span>
            <select
              value={String(c.status ?? 'open')}
              onChange={(e) => patchContent({ status: e.target.value })}
              style={studioSelectStyle}
            >
              <option value="open">Abiertos (recibir consultas)</option>
              <option value="closed">Lista cerrada temporalmente</option>
            </select>
          </label>
          {c.status === 'closed' ? (
            <label style={studioLabelStyle}>
              <span>Mensaje cuando está cerrada</span>
              <textarea
                rows={3}
                value={String(c.closedMessage ?? '')}
                onChange={(e) => patchContent({ closedMessage: e.target.value })}
                style={studioTextareaStyle}
              />
            </label>
          ) : (
            <>
              <label style={studioLabelStyle}>
                <span>Título</span>
                <input type="text" value={String(c.title ?? '')} onChange={(e) => patchContent({ title: e.target.value })} style={studioInputStyle} />
              </label>
              <label style={studioLabelStyle}>
                <span>Descripción</span>
                <textarea rows={3} value={String(c.description ?? '')} onChange={(e) => patchContent({ description: e.target.value })} style={studioTextareaStyle} />
              </label>
              <label style={studioLabelStyle}>
                <span>Texto del botón</span>
                <input type="text" value={String(c.buttonText ?? '')} onChange={(e) => patchContent({ buttonText: e.target.value })} style={studioInputStyle} />
              </label>
              <label style={studioLabelStyle}>
                <span>WhatsApp para encargos</span>
                <input type="text" value={String(c.whatsapp ?? '')} placeholder="51999000000" onChange={(e) => patchContent({ whatsapp: e.target.value })} style={studioInputStyle} />
              </label>
              <label style={studioLabelStyle}>
                <span>Enlace alternativo (opcional)</span>
                <input type="text" value={String(c.buttonHref ?? '')} placeholder="#contact o https://..." onChange={(e) => patchContent({ buttonHref: e.target.value })} style={studioInputStyle} />
              </label>
            </>
          )}
        </div>
      )

    case 'divider':
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
          <label style={studioLabelStyle}>
            <span>Altura vertical</span>
            <select value={String(c.height ?? 'md')} onChange={(e) => patchContent({ height: e.target.value })} style={studioSelectStyle}>
              <option value="sm">Pequeño</option>
              <option value="md">Mediano</option>
              <option value="lg">Amplio</option>
            </select>
          </label>
          <label style={studioLabelStyle}>
            <span>Etiqueta central (para detalle curatorial)</span>
            <input type="text" value={String(c.label ?? '')} onChange={(e) => patchContent({ label: e.target.value })} style={studioInputStyle} />
          </label>
        </div>
      )

    default:
      return null
  }
}

function ImageField({
  label,
  value,
  onChange,
  onPick,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  onPick: () => void
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
      <span style={{ fontSize: '0.75rem', fontWeight: 500, color: '#334155' }}>{label}</span>
      <div style={{ display: 'flex', gap: '0.35rem' }}>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="https://... o /uploads/..."
          style={{ ...studioInputStyle, flex: 1 }}
        />
        <button
          type="button"
          onClick={onPick}
          style={{ ...studioSecondaryBtn, padding: '0.35rem 0.55rem', fontSize: '0.72rem', whiteSpace: 'nowrap' }}
        >
          Subir / Elegir
        </button>
      </div>
    </div>
  )
}
