'use client'

import { useState } from 'react'
import type { SectionConfig, SiteConfig } from '@/lib/schemas/site-config.schema'
import type { AISuggestion } from '@/lib/ai/ask-ai'
import { SECTION_TYPE_LABELS } from '@/app/editor/[token]/EditorConfig'
import {
  STUDIO_COLORS,
  studioCardStyle,
  studioPrimaryBtn,
  studioSecondaryBtn,
  studioTextareaStyle,
} from './studio-styles'

type Props = {
  currentConfig: SiteConfig
  artistSlug: string
  editorToken?: string
  selectedSectionId?: string | null
  selectedSection?: SectionConfig | null
  onApply: (config: SiteConfig) => void
  onPreviewChange?: (previewConfig: SiteConfig | null) => void
}

const QUICK_PROMPTS = [
  'Paleta oscura inmersiva',
  'Agregar sección de encargos',
  'Cambiar a template Editorial',
  'Grilla de 4 columnas',
]

export default function AIRequestPanel({
  currentConfig,
  artistSlug,
  editorToken,
  selectedSectionId,
  selectedSection,
  onApply,
  onPreviewChange,
}: Props) {
  const [prompt, setPrompt] = useState('')
  const [suggestion, setSuggestion] = useState<AISuggestion | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const trimmed = prompt.trim()
  const disabled = loading || trimmed.length === 0
  const effectiveSelectedId = selectedSection?.id ?? selectedSectionId ?? undefined
  const contextLabel = selectedSection
    ? `Bloque seleccionado: ${SECTION_TYPE_LABELS[selectedSection.type] ?? selectedSection.type}`
    : 'Todo el sitio'

  async function runPrompt(targetPrompt: string) {
    const clean = targetPrompt.trim()
    if (loading || clean.length === 0) return
    setLoading(true)
    setError(null)
    setSuggestion(null)
    onPreviewChange?.(null)
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' }
      if (editorToken) {
        headers['x-editor-token'] = editorToken
      }
      const res = await fetch('/api/ai-suggest', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          artistSlug,
          prompt: clean,
          currentConfig,
          ...(effectiveSelectedId ? { selectedSectionId: effectiveSelectedId } : {}),
        }),
      })
      if (!res.ok) {
        let message = `Error ${res.status}`
        try {
          const body = (await res.json()) as { error?: string }
          if (body?.error) message = body.error
        } catch {
          // ignore
        }
        throw new Error(message)
      }
      const data = (await res.json()) as { suggestion: AISuggestion }
      setSuggestion(data.suggestion)
      if (data.suggestion?.newConfig) {
        onPreviewChange?.(data.suggestion.newConfig)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setLoading(false)
    }
  }

  function handleApply() {
    if (suggestion?.newConfig) {
      onApply(suggestion.newConfig)
    }
    onPreviewChange?.(null)
    setSuggestion(null)
    setPrompt('')
    setError(null)
  }

  function handleDiscard() {
    onPreviewChange?.(null)
    setSuggestion(null)
    setPrompt('')
    setError(null)
  }

  return (
    <section
      data-testid="ai-request-panel"
      style={{
        ...studioCardStyle,
        display: 'flex',
        flexDirection: 'column',
        gap: '0.6rem',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.4rem' }}>
        <h2 style={{ margin: 0, fontSize: '0.85rem', fontWeight: 700, color: STUDIO_COLORS.text }}>
          Pídeselo a la IA
        </h2>
        <span
          style={{
            fontSize: '0.68rem',
            padding: '0.15rem 0.45rem',
            borderRadius: '9999px',
            background: selectedSection ? STUDIO_COLORS.accentSoft : STUDIO_COLORS.chrome,
            color: selectedSection ? STUDIO_COLORS.accent : STUDIO_COLORS.muted,
            fontWeight: 600,
          }}
        >
          {contextLabel}
        </span>
      </div>

      <textarea
        aria-label="Pedido para la IA"
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="Describe el cambio que quieres hacer…"
        rows={3}
        disabled={loading}
        style={studioTextareaStyle}
      />

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
        {QUICK_PROMPTS.map((chip) => (
          <button
            key={chip}
            type="button"
            disabled={loading}
            onClick={() => {
              setPrompt(chip)
              void runPrompt(chip)
            }}
            style={{
              ...studioSecondaryBtn,
              padding: '0.2rem 0.45rem',
              fontSize: '0.68rem',
              borderRadius: '9999px',
            }}
          >
            {chip}
          </button>
        ))}
      </div>

      <button
        type="button"
        onClick={() => void runPrompt(prompt)}
        disabled={disabled}
        style={{
          ...studioPrimaryBtn,
          background: disabled ? '#94a3b8' : STUDIO_COLORS.primary,
          borderColor: disabled ? '#94a3b8' : STUDIO_COLORS.primary,
          cursor: disabled ? 'not-allowed' : 'pointer',
          alignSelf: 'flex-start',
        }}
      >
        {loading ? 'Pensando…' : 'Probar propuesta'}
      </button>

      {error && (
        <p role="alert" style={{ margin: 0, fontSize: '0.78rem', color: STUDIO_COLORS.danger }}>
          {error}
        </p>
      )}

      {suggestion?.validationError && (
        <p role="alert" style={{ margin: 0, fontSize: '0.78rem', color: STUDIO_COLORS.danger }}>
          La IA devolvió una propuesta inválida: {suggestion.validationError}
        </p>
      )}

      {suggestion?.newConfig && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem',
            borderTop: `1px solid ${STUDIO_COLORS.border}`,
            paddingTop: '0.55rem',
          }}
        >
          <p style={{ margin: 0, fontSize: '0.8rem', color: STUDIO_COLORS.text }}>
            <strong>Propuesta en vista previa:</strong> {suggestion.explanation}
          </p>
          {suggestion.unsatisfied.length > 0 && (
            <div style={{ fontSize: '0.75rem', color: '#92400e' }}>
              <strong>No se pudo cumplir:</strong>
              <ul style={{ margin: '0.25rem 0 0 1rem', padding: 0 }}>
                {suggestion.unsatisfied.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            </div>
          )}
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button type="button" onClick={handleApply} style={studioPrimaryBtn}>
              Aplicar
            </button>
            <button type="button" onClick={handleDiscard} style={studioSecondaryBtn}>
              Descartar
            </button>
          </div>
        </div>
      )}
    </section>
  )
}
