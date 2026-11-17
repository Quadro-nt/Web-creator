'use client'

import { useState } from 'react'
import type { SiteConfig } from '@/lib/schemas/site-config.schema'
import type { AISuggestion } from '@/lib/ai/ask-ai'

type Props = {
  currentConfig: SiteConfig
  artistSlug: string
  onApply: (config: SiteConfig) => void
}

export default function AIRequestPanel({ currentConfig, artistSlug, onApply }: Props) {
  const [prompt, setPrompt] = useState('')
  const [suggestion, setSuggestion] = useState<AISuggestion | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const trimmed = prompt.trim()
  const disabled = loading || trimmed.length === 0

  async function handleSubmit() {
    if (disabled) return
    setLoading(true)
    setError(null)
    setSuggestion(null)
    try {
      const res = await fetch('/api/ai-suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ artistSlug, prompt: trimmed, currentConfig }),
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
    setSuggestion(null)
    setPrompt('')
    setError(null)
  }

  function handleDiscard() {
    setSuggestion(null)
    setPrompt('')
    setError(null)
  }

  return (
    <section
      data-testid="ai-request-panel"
      style={{
        border: '1px solid #e5e7eb',
        borderRadius: '6px',
        background: '#ffffff',
        padding: '0.75rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem',
      }}
    >
      <h2 style={{ margin: 0, fontSize: '0.85rem', fontWeight: 600 }}>Pídeselo a la IA</h2>
      <textarea
        aria-label="Pedido para la IA"
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="Describe el cambio que quieres hacer..."
        rows={3}
        disabled={loading}
        style={{
          width: '100%',
          padding: '0.5rem',
          border: '1px solid #d4d4d8',
          borderRadius: '6px',
          fontSize: '0.85rem',
          fontFamily: 'inherit',
          resize: 'vertical',
          boxSizing: 'border-box',
        }}
      />
      <button
        type="button"
        onClick={handleSubmit}
        disabled={disabled}
        style={{
          padding: '0.5rem 0.9rem',
          background: disabled ? '#9ca3af' : '#111827',
          color: '#ffffff',
          border: 'none',
          borderRadius: '6px',
          fontSize: '0.85rem',
          cursor: disabled ? 'not-allowed' : 'pointer',
          fontFamily: 'inherit',
          alignSelf: 'flex-start',
        }}
      >
        {loading ? 'Pensando…' : 'Pídeselo a la IA'}
      </button>

      {error && (
        <p role="alert" style={{ margin: 0, fontSize: '0.8rem', color: '#b91c1c' }}>
          {error}
        </p>
      )}

      {suggestion?.validationError && (
        <p role="alert" style={{ margin: 0, fontSize: '0.8rem', color: '#b91c1c' }}>
          La IA devolvió una propuesta inválida: {suggestion.validationError}
        </p>
      )}

      {suggestion?.newConfig && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem',
            borderTop: '1px solid #e5e7eb',
            paddingTop: '0.5rem',
          }}
        >
          <p style={{ margin: 0, fontSize: '0.85rem' }}>
            <strong>Cambios propuestos:</strong> {suggestion.explanation}
          </p>
          {suggestion.unsatisfied.length > 0 && (
            <div style={{ fontSize: '0.8rem', color: '#92400e' }}>
              <strong>No se pudo cumplir:</strong>
              <ul style={{ margin: '0.25rem 0 0 1rem', padding: 0 }}>
                {suggestion.unsatisfied.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            </div>
          )}
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              type="button"
              onClick={handleApply}
              style={{
                padding: '0.4rem 0.8rem',
                background: '#111827',
                color: '#ffffff',
                border: 'none',
                borderRadius: '6px',
                fontSize: '0.8rem',
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              Aplicar
            </button>
            <button
              type="button"
              onClick={handleDiscard}
              style={{
                padding: '0.4rem 0.8rem',
                background: '#ffffff',
                color: '#111827',
                border: '1px solid #d4d4d8',
                borderRadius: '6px',
                fontSize: '0.8rem',
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              Descartar
            </button>
          </div>
        </div>
      )}
    </section>
  )
}
