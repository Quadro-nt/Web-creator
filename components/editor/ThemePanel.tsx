'use client'

import type { SiteConfig } from '@/lib/schemas/site-config.schema'
import { STYLE_PRESETS } from '@/app/editor/[token]/EditorConfig'
import { getContrastRatio } from '@/lib/tokens/contrast'
import ControlPanel from './ControlPanel'
import FontPicker from './FontPicker'
import { STUDIO_COLORS, studioCardStyle, studioInputStyle } from './studio-styles'

type Props = {
  config: SiteConfig
  onChange: (patch: Partial<SiteConfig>) => void
}

const TRACKING_OPTIONS: Array<{ value: 'tight' | 'normal' | 'wide'; label: string }> = [
  { value: 'tight', label: 'Ajustado' },
  { value: 'normal', label: 'Normal' },
  { value: 'wide', label: 'Amplio' },
]

const RADIUS_OPTIONS: Array<{ value: 'none' | 'sm' | 'md' | 'lg'; label: string }> = [
  { value: 'none', label: 'Recto' },
  { value: 'sm', label: 'Suave' },
  { value: 'md', label: 'Medio' },
  { value: 'lg', label: 'Redondeado' },
]

export default function ThemePanel({ config, onChange }: Props) {
  const ratio = getContrastRatio(config.styleTokens.text, config.styleTokens.background)
  const roundedRatio = ratio.toFixed(1)
  const level = ratio >= 7 ? 'AAA' : ratio >= 4.5 ? 'AA' : 'LOW'

  const patchStyle = (patch: Partial<SiteConfig['styleTokens']>) => {
    onChange({
      styleTokens: {
        ...config.styleTokens,
        ...patch,
      },
    })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      <div style={studioCardStyle}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
          <strong style={{ fontSize: '0.8rem', color: STUDIO_COLORS.text }}>Estilos listos en 1 clic</strong>
          <span style={{ fontSize: '0.7rem', color: STUDIO_COLORS.muted }}>Presets</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.45rem' }}>
          {STYLE_PRESETS.map((preset) => {
            const st = preset.patch.styleTokens
            const isActive =
              st &&
              config.template === preset.patch.template &&
              config.styleTokens.background.toLowerCase() === st.background.toLowerCase() &&
              config.styleTokens.accent.toLowerCase() === st.accent.toLowerCase()
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => onChange(preset.patch)}
                style={{
                  textAlign: 'left',
                  padding: '0.55rem 0.65rem',
                  borderRadius: '7px',
                  border: isActive
                    ? `1.5px solid ${STUDIO_COLORS.accent}`
                    : `1px solid ${STUDIO_COLORS.border}`,
                  background: isActive ? STUDIO_COLORS.accentSoft : STUDIO_COLORS.surface,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '0.5rem',
                }}
              >
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: 600, color: STUDIO_COLORS.text }}>
                    {preset.name}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: STUDIO_COLORS.muted, marginTop: '0.15rem' }}>
                    {preset.description}
                  </div>
                </div>
                {st && (
                  <div style={{ display: 'flex', gap: '0.2rem', flexShrink: 0 }} aria-hidden="true">
                    <SwatchDot color={st.background} />
                    <SwatchDot color={st.text} />
                    <SwatchDot color={st.accent} />
                  </div>
                )}
              </button>
            )
          })}
        </div>
      </div>

      <div style={studioCardStyle}>
        <strong style={{ fontSize: '0.8rem', color: STUDIO_COLORS.text, display: 'block', marginBottom: '0.5rem' }}>
          Tipografías expresivas
        </strong>
        <FontPicker
          headingFont={config.styleTokens.headingFont}
          bodyFont={config.styleTokens.bodyFont}
          onSelectHeading={(font) => patchStyle({ headingFont: font })}
          onSelectBody={(font) => patchStyle({ bodyFont: font })}
        />
        <div style={{ marginTop: '0.65rem', paddingTop: '0.65rem', borderTop: `1px solid ${STUDIO_COLORS.border}`, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78rem', color: STUDIO_COLORS.text }}>
            <input
              type="checkbox"
              checked={Boolean(config.styleTokens.uppercaseHeadings)}
              onChange={(e) => patchStyle({ uppercaseHeadings: e.target.checked })}
            />
            Títulos siempre en MAYÚSCULAS
          </label>
          <div>
            <span style={{ fontSize: '0.72rem', color: STUDIO_COLORS.muted, display: 'block', marginBottom: '0.25rem' }}>
              Espaciado entre letras
            </span>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.25rem' }}>
              {TRACKING_OPTIONS.map((opt) => {
                const active = (config.styleTokens.headingTracking ?? 'normal') === opt.value
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => patchStyle({ headingTracking: opt.value })}
                    style={pillOptionStyle(active)}
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
        <strong style={{ fontSize: '0.8rem', color: STUDIO_COLORS.text, display: 'block', marginBottom: '0.5rem' }}>
          Bordes, esquinas y superficie
        </strong>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
          <div>
            <span style={{ fontSize: '0.72rem', color: STUDIO_COLORS.muted, display: 'block', marginBottom: '0.25rem' }}>
              Esquinas de fotos y tarjetas
            </span>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.25rem' }}>
              {RADIUS_OPTIONS.map((opt) => {
                const active = (config.styleTokens.borderRadius ?? 'none') === opt.value
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => patchStyle({ borderRadius: opt.value })}
                    style={pillOptionStyle(active)}
                  >
                    {opt.label}
                  </button>
                )
              })}
            </div>
          </div>

          <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78rem', color: STUDIO_COLORS.text }}>
            <input
              type="checkbox"
              checked={Boolean(config.styleTokens.cardBorder)}
              onChange={(e) => patchStyle({ cardBorder: e.target.checked })}
            />
            Borde fino 1px en fotos y tarjetas
          </label>

          <label style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.72rem', color: STUDIO_COLORS.muted }}>
            <span>Color secundario suave (bloques destacados)</span>
            <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
              <input
                type="color"
                value={config.styleTokens.secondaryBg || '#f5f0e8'}
                onChange={(e) => patchStyle({ secondaryBg: e.target.value })}
                style={{ width: '32px', height: '30px', padding: 0, border: `1px solid ${STUDIO_COLORS.inputBorder}`, borderRadius: '4px' }}
              />
              <input
                type="text"
                value={config.styleTokens.secondaryBg ?? ''}
                placeholder="Automático"
                onChange={(e) => patchStyle({ secondaryBg: e.target.value || undefined })}
                style={{ ...studioInputStyle, flex: 1 }}
              />
            </div>
          </label>
        </div>
      </div>

      <div
        style={{
          ...studioCardStyle,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '0.5rem',
          background: level === 'LOW' ? '#fffbeb' : STUDIO_COLORS.successSoft,
          borderColor: level === 'LOW' ? '#fde68a' : '#a7f3d0',
        }}
      >
        <div>
          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: STUDIO_COLORS.text }}>
            Contraste texto / fondo: {roundedRatio}:1
          </div>
          <div style={{ fontSize: '0.7rem', color: level === 'LOW' ? '#92400e' : STUDIO_COLORS.success }}>
            {level === 'LOW'
              ? 'Contraste bajo — se ajustará automáticamente'
              : `Legibilidad óptima WCAG ${level}`}
          </div>
        </div>
        <span
          style={{
            fontSize: '0.7rem',
            fontWeight: 700,
            padding: '0.2rem 0.45rem',
            borderRadius: '9999px',
            background: '#ffffff',
            color: level === 'LOW' ? '#92400e' : STUDIO_COLORS.success,
            border: '1px solid rgba(0,0,0,0.08)',
          }}
        >
          {level === 'LOW' ? 'Ajuste' : level}
        </span>
      </div>

      <ControlPanel config={config} onChange={onChange} hideIdentity />
    </div>
  )
}

function pillOptionStyle(active: boolean): React.CSSProperties {
  return {
    padding: '0.32rem 0.4rem',
    borderRadius: '6px',
    border: `1px solid ${active ? STUDIO_COLORS.accent : STUDIO_COLORS.inputBorder}`,
    background: active ? STUDIO_COLORS.accentSoft : STUDIO_COLORS.surface,
    color: active ? STUDIO_COLORS.accent : STUDIO_COLORS.text,
    fontSize: '0.72rem',
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: 'inherit',
  }
}

function SwatchDot({ color }: { color: string }) {
  return (
    <span
      style={{
        width: '12px',
        height: '12px',
        borderRadius: '9999px',
        background: color,
        border: '1px solid rgba(15, 23, 42, 0.2)',
        display: 'inline-block',
      }}
    />
  )
}
