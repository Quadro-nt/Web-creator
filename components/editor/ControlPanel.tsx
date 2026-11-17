'use client'

import { useState } from 'react'
import type { SiteConfig } from '@/lib/schemas/site-config.schema'
import { FONT_PAIR_LABELS } from '@/app/editor/[token]/EditorConfig'

type Props = {
  config: SiteConfig
  onChange: (patch: Partial<SiteConfig>) => void
}

const FONT_PAIR_KEYS = [
  'playfair-raleway',
  'libre-baskerville-source-sans',
  'cormorant-jost',
  'dm-serif-inter',
  'fraunces-nunito',
  'bodoni-moda-figtree',
  'garamond-lato',
  'merriweather-open-sans',
  'spectral-work-sans',
  'big-caslon-muli',
  'IM-fell-outfit',
  'alice-rubik',
] as const

export default function ControlPanel({ config, onChange }: Props) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      <Section title="Identidad">
        <Field label="Título">
          <input
            type="text"
            value={config.identity.siteTitle}
            onChange={(e) => onChange({ identity: { ...config.identity, siteTitle: e.target.value } })}
            maxLength={80}
            style={textInput}
          />
        </Field>
        <Field label="Template">
          <select
            value={config.template}
            onChange={(e) => onChange({ template: e.target.value as SiteConfig['template'] })}
            style={selectStyle}
          >
            <option value="minimal-gallery">Minimal Gallery</option>
            <option value="editorial">Editorial</option>
            <option value="immersive">Immersive</option>
          </select>
        </Field>
        <Field label="URL de logo">
          <input
            type="url"
            value={config.identity.logoUrl ?? ''}
            onChange={(e) => onChange({ identity: { ...config.identity, logoUrl: emptyToUndefined(e.target.value) } })}
            placeholder="https://..."
            style={textInput}
          />
        </Field>
        <Field label="URL de favicon">
          <input
            type="url"
            value={config.identity.faviconUrl ?? ''}
            onChange={(e) => onChange({ identity: { ...config.identity, faviconUrl: emptyToUndefined(e.target.value) } })}
            placeholder="https://..."
            style={textInput}
          />
        </Field>
        <Field label="URL de imagen de portada">
          <input
            type="url"
            value={config.identity.coverImageUrl ?? ''}
            onChange={(e) =>
              onChange({ identity: { ...config.identity, coverImageUrl: emptyToUndefined(e.target.value) } })
            }
            placeholder="https://..."
            style={textInput}
          />
        </Field>
        <Field label="URL imagen Open Graph">
          <input
            type="url"
            value={config.identity.ogImageUrl ?? ''}
            onChange={(e) => onChange({ identity: { ...config.identity, ogImageUrl: emptyToUndefined(e.target.value) } })}
            placeholder="https://..."
            style={textInput}
          />
        </Field>
      </Section>

      <Section title="Estilo">
        <Field label="Color de fondo">
          <ColorInput
            value={config.styleTokens.background}
            onChange={(v) => onChange({ styleTokens: { ...config.styleTokens, background: v } })}
          />
        </Field>
        <Field label="Color de texto">
          <ColorInput
            value={config.styleTokens.text}
            onChange={(v) => onChange({ styleTokens: { ...config.styleTokens, text: v } })}
          />
        </Field>
        <Field label="Color de acento">
          <ColorInput
            value={config.styleTokens.accent}
            onChange={(v) => onChange({ styleTokens: { ...config.styleTokens, accent: v } })}
          />
        </Field>
        <Field label="Combinación tipográfica">
          <select
            value={config.styleTokens.fontPair}
            onChange={(e) =>
              onChange({
                styleTokens: {
                  ...config.styleTokens,
                  fontPair: e.target.value as SiteConfig['styleTokens']['fontPair'],
                },
              })
            }
            style={selectStyle}
          >
            {FONT_PAIR_KEYS.map((k) => (
              <option key={k} value={k}>
                {FONT_PAIR_LABELS[k] ?? k}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Espaciado">
          <select
            value={config.styleTokens.spacing}
            onChange={(e) =>
              onChange({
                styleTokens: {
                  ...config.styleTokens,
                  spacing: e.target.value as SiteConfig['styleTokens']['spacing'],
                },
              })
            }
            style={selectStyle}
          >
            <option value="compact">Compacto</option>
            <option value="normal">Normal</option>
            <option value="spacious">Amplio</option>
          </select>
        </Field>
        <Field label="Tratamiento de obra">
          <select
            value={config.styleTokens.artworkTreatment}
            onChange={(e) =>
              onChange({
                styleTokens: {
                  ...config.styleTokens,
                  artworkTreatment: e.target.value as SiteConfig['styleTokens']['artworkTreatment'],
                },
              })
            }
            style={selectStyle}
          >
            <option value="frame">Con marco</option>
            <option value="margin">Con margen</option>
            <option value="bleed">A sangre</option>
          </select>
        </Field>
      </Section>

      <Section title="Botones">
        <Field label="Forma">
          <select
            value={config.button.shape}
            onChange={(e) => onChange({ button: { ...config.button, shape: e.target.value as SiteConfig['button']['shape'] } })}
            style={selectStyle}
          >
            <option value="square">Cuadrado</option>
            <option value="rounded">Redondeado</option>
            <option value="pill">Píldora</option>
          </select>
        </Field>
        <Field label="Estilo">
          <select
            value={config.button.style}
            onChange={(e) => onChange({ button: { ...config.button, style: e.target.value as SiteConfig['button']['style'] } })}
            style={selectStyle}
          >
            <option value="filled">Relleno</option>
            <option value="outlined">Contorno</option>
            <option value="text">Solo texto</option>
          </select>
        </Field>
        <Field label="Texto de compra">
          <input
            type="text"
            value={config.button.buyText}
            onChange={(e) => onChange({ button: { ...config.button, buyText: e.target.value } })}
            maxLength={40}
            style={textInput}
          />
        </Field>
      </Section>

      <Section title="Tamaños">
        <Field label="Escala tipográfica">
          <select
            value={config.sizes.typeScale}
            onChange={(e) => onChange({ sizes: { ...config.sizes, typeScale: e.target.value as SiteConfig['sizes']['typeScale'] } })}
            style={selectStyle}
          >
            <option value="small">Pequeña</option>
            <option value="medium">Mediana</option>
            <option value="large">Grande</option>
          </select>
        </Field>
        <Field label="Tamaño de obra">
          <select
            value={config.sizes.artworkSize}
            onChange={(e) => onChange({ sizes: { ...config.sizes, artworkSize: e.target.value as SiteConfig['sizes']['artworkSize'] } })}
            style={selectStyle}
          >
            <option value="small">Pequeña</option>
            <option value="medium">Mediana</option>
            <option value="large">Grande</option>
          </select>
        </Field>
        <Field label="Columnas">
          <select
            value={config.sizes.columns}
            onChange={(e) => onChange({ sizes: { ...config.sizes, columns: e.target.value as SiteConfig['sizes']['columns'] } })}
            style={selectStyle}
          >
            <option value="2">2</option>
            <option value="3">3</option>
            <option value="4">4</option>
          </select>
        </Field>
        <Field label="Ancho de contenido">
          <select
            value={config.sizes.contentWidth}
            onChange={(e) => onChange({ sizes: { ...config.sizes, contentWidth: e.target.value as SiteConfig['sizes']['contentWidth'] } })}
            style={selectStyle}
          >
            <option value="narrow">Angosto</option>
            <option value="mid">Medio</option>
            <option value="full">Completo</option>
          </select>
        </Field>
      </Section>

      <Section title="Animaciones">
        <Field label="Scroll reveal">
          <select
            value={config.animations.scrollReveal}
            onChange={(e) =>
              onChange({
                animations: {
                  ...config.animations,
                  scrollReveal: e.target.value as SiteConfig['animations']['scrollReveal'],
                },
              })
            }
            style={selectStyle}
          >
            <option value="none">Ninguno</option>
            <option value="soft">Suave</option>
            <option value="bold">Marcado</option>
          </select>
        </Field>
        <Field label="Efecto hover">
          <select
            value={config.animations.hoverEffect}
            onChange={(e) =>
              onChange({
                animations: {
                  ...config.animations,
                  hoverEffect: e.target.value as SiteConfig['animations']['hoverEffect'],
                },
              })
            }
            style={selectStyle}
          >
            <option value="none">Ninguno</option>
            <option value="zoom">Zoom</option>
            <option value="info">Info</option>
          </select>
        </Field>
        <Field label="Transición de página">
          <select
            value={config.animations.pageTransition}
            onChange={(e) =>
              onChange({
                animations: {
                  ...config.animations,
                  pageTransition: e.target.value as SiteConfig['animations']['pageTransition'],
                },
              })
            }
            style={selectStyle}
          >
            <option value="none">Ninguna</option>
            <option value="fade">Fundido</option>
          </select>
        </Field>
      </Section>

      <Section title="Navegación">
        <Field label="Tipo">
          <select
            value={config.navigation.type}
            onChange={(e) =>
              onChange({ navigation: { ...config.navigation, type: e.target.value as SiteConfig['navigation']['type'] } })
            }
            style={selectStyle}
          >
            <option value="top">Superior</option>
            <option value="side">Lateral</option>
            <option value="hamburger">Hamburguesa</option>
          </select>
        </Field>
        <Field label="Fija al hacer scroll">
          <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}>
            <input
              type="checkbox"
              checked={config.navigation.sticky}
              onChange={(e) => onChange({ navigation: { ...config.navigation, sticky: e.target.checked } })}
            />
            Sticky
          </label>
        </Field>
      </Section>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(true)
  return (
    <section
      style={{
        border: '1px solid #e5e7eb',
        borderRadius: '6px',
        background: '#ffffff',
        overflow: 'hidden',
      }}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0.6rem 0.75rem',
          background: '#f9fafb',
          border: 'none',
          borderBottom: open ? '1px solid #e5e7eb' : 'none',
          cursor: 'pointer',
          fontSize: '0.85rem',
          fontWeight: 600,
          color: '#111827',
          fontFamily: 'inherit',
        }}
      >
        <span>{title}</span>
        <span aria-hidden="true">{open ? '−' : '+'}</span>
      </button>
      {open && (
        <div style={{ padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
          {children}
        </div>
      )}
    </section>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', fontSize: '0.75rem', color: '#4b5563' }}>
      <span>{label}</span>
      {children}
    </label>
  )
}

function ColorInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{ width: '32px', height: '32px', padding: 0, border: '1px solid #d4d4d8', borderRadius: '4px', background: '#ffffff' }}
      />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{ ...textInput, flex: 1 }}
      />
    </div>
  )
}

function emptyToUndefined(v: string): string | undefined {
  const t = v.trim()
  return t.length === 0 ? undefined : t
}

const textInput: React.CSSProperties = {
  padding: '0.4rem 0.5rem',
  border: '1px solid #d4d4d8',
  borderRadius: '4px',
  fontSize: '0.85rem',
  background: '#ffffff',
  fontFamily: 'inherit',
}

const selectStyle: React.CSSProperties = {
  padding: '0.4rem 0.5rem',
  border: '1px solid #d4d4d8',
  borderRadius: '4px',
  fontSize: '0.85rem',
  background: '#ffffff',
  fontFamily: 'inherit',
}
