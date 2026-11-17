'use client'

import { useCallback, useState } from 'react'
import type { SiteConfig } from '@/lib/schemas/site-config.schema'
import type { Artwork } from '@/lib/schemas/works.schema'
import ControlPanel from '@/components/editor/ControlPanel'
import SectionList from '@/components/editor/SectionList'
import PreviewFrame from '@/components/editor/PreviewFrame'
import PreviewToggle from '@/components/editor/PreviewToggle'
import AIRequestPanel from '@/components/editor/AIRequestPanel'
import type { Viewport } from './EditorConfig'

type Status = 'idle' | 'saving' | 'saved' | 'publishing' | 'published' | 'error'

type Props = {
  initialConfig: SiteConfig
  artistSlug: string
  works: Artwork[]
}

type MobileTab = 'controls' | 'preview'

export default function EditorClient({ initialConfig, artistSlug, works }: Props) {
  const [config, setConfig] = useState<SiteConfig>(initialConfig)
  const [viewport, setViewport] = useState<Viewport>('desktop')
  const [status, setStatus] = useState<Status>('idle')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [mobileTab, setMobileTab] = useState<MobileTab>('controls')
  const [aiOpen, setAiOpen] = useState(false)

  const handleAiApply = useCallback((next: SiteConfig) => {
    setConfig(next)
    setAiOpen(false)
  }, [])

  const handlePatch = useCallback((patch: Partial<SiteConfig>) => {
    setConfig((prev) => ({ ...prev, ...patch }))
  }, [])

  const handleSectionsChange = useCallback((sections: SiteConfig['sections']) => {
    setConfig((prev) => ({ ...prev, sections }))
  }, [])

  async function postJson(url: string) {
    setErrorMsg(null)
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ artistSlug, config }),
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
  }

  async function handleSaveDraft() {
    if (status === 'saving' || status === 'publishing') return
    setStatus('saving')
    try {
      await postJson('/api/draft')
      setStatus('saved')
      window.setTimeout(() => setStatus((s) => (s === 'saved' ? 'idle' : s)), 2000)
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Error desconocido')
      setStatus('error')
    }
  }

  async function handlePublish() {
    if (status === 'saving' || status === 'publishing') return
    setStatus('publishing')
    try {
      await postJson('/api/publish')
      setStatus('published')
      window.setTimeout(() => setStatus((s) => (s === 'published' ? 'idle' : s)), 2000)
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Error desconocido')
      setStatus('error')
    }
  }

  const statusLabel =
    status === 'saving'
      ? 'Guardando…'
      : status === 'saved'
        ? 'Guardado'
        : status === 'publishing'
          ? 'Publicando…'
          : status === 'published'
            ? 'Publicado'
            : status === 'error'
              ? errorMsg ?? 'Error'
              : ''

  const controlsPanel = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {aiOpen && (
        <AIRequestPanel currentConfig={config} artistSlug={artistSlug} onApply={handleAiApply} />
      )}
      <ControlPanel config={config} onChange={handlePatch} />
      <section
        style={{
          border: '1px solid #e5e7eb',
          borderRadius: '6px',
          background: '#ffffff',
          padding: '0.75rem',
        }}
      >
        <h2 style={{ margin: 0, fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem' }}>Secciones</h2>
        <SectionList sections={config.sections} onChange={handleSectionsChange} />
      </section>
    </div>
  )

  const previewPanel = (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0.75rem',
          borderBottom: '1px solid #e5e7eb',
          background: '#ffffff',
        }}
      >
        <PreviewToggle viewport={viewport} onChange={setViewport} />
      </div>
      <div style={{ flex: 1, overflow: 'auto', background: '#f3f4f6' }}>
        <PreviewFrame config={config} works={works} artistSlug={artistSlug} viewport={viewport} />
      </div>
    </div>
  )

  return (
    <div
      data-testid="editor-root"
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        background: '#f3f4f6',
        color: '#111827',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0.75rem 1rem',
          background: '#ffffff',
          borderBottom: '1px solid #e5e7eb',
          gap: '1rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <strong style={{ fontSize: '0.95rem' }}>Editor</strong>
          <span style={{ fontSize: '0.8rem', color: '#6b7280' }}>{artistSlug}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {statusLabel && (
            <span
              role="status"
              aria-live="polite"
              style={{
                fontSize: '0.8rem',
                color: status === 'error' ? '#b91c1c' : '#059669',
              }}
            >
              {statusLabel}
            </span>
          )}
          <button
            type="button"
            onClick={() => setAiOpen((v) => !v)}
            aria-pressed={aiOpen}
            style={btnSecondary}
          >
            Pídeselo a la IA
          </button>
          <button
            type="button"
            onClick={handleSaveDraft}
            disabled={status === 'saving' || status === 'publishing'}
            style={btnSecondary}
          >
            Guardar borrador
          </button>
          <button
            type="button"
            onClick={handlePublish}
            disabled={status === 'saving' || status === 'publishing'}
            style={btnPrimary}
          >
            Publicar
          </button>
        </div>
      </header>

      <div
        className="editor-tabs"
        style={{
          display: 'none',
          gap: '0.25rem',
          padding: '0.5rem',
          background: '#ffffff',
          borderBottom: '1px solid #e5e7eb',
        }}
      >
        <button
          type="button"
          onClick={() => setMobileTab('controls')}
          aria-pressed={mobileTab === 'controls'}
          style={tabStyle(mobileTab === 'controls')}
        >
          Controles
        </button>
        <button
          type="button"
          onClick={() => setMobileTab('preview')}
          aria-pressed={mobileTab === 'preview'}
          style={tabStyle(mobileTab === 'preview')}
        >
          Vista previa
        </button>
      </div>

      <style>{`
        .editor-body-desktop { display: grid; grid-template-columns: 360px 1fr; gap: 0; flex: 1; min-height: 0; }
        .editor-controls { overflow-y: auto; padding: 1rem; border-right: 1px solid #e5e7eb; background: #f9fafb; }
        .editor-preview { min-height: 0; }
        .editor-controls-mobile, .editor-preview-mobile { display: none; }
        @media (max-width: 900px) {
          .editor-tabs { display: flex !important; }
          .editor-body-desktop { grid-template-columns: 1fr; }
          .editor-controls { border-right: none; display: ${mobileTab === 'controls' ? 'block' : 'none'}; }
          .editor-preview { display: ${mobileTab === 'preview' ? 'block' : 'none'}; }
        }
      `}</style>

      <div className="editor-body-desktop">
        <aside className="editor-controls">{controlsPanel}</aside>
        <main className="editor-preview">{previewPanel}</main>
      </div>
    </div>
  )
}

const btnPrimary: React.CSSProperties = {
  padding: '0.5rem 0.9rem',
  background: '#111827',
  color: '#ffffff',
  border: 'none',
  borderRadius: '6px',
  fontSize: '0.85rem',
  cursor: 'pointer',
  fontFamily: 'inherit',
}

const btnSecondary: React.CSSProperties = {
  padding: '0.5rem 0.9rem',
  background: '#ffffff',
  color: '#111827',
  border: '1px solid #d4d4d8',
  borderRadius: '6px',
  fontSize: '0.85rem',
  cursor: 'pointer',
  fontFamily: 'inherit',
}

function tabStyle(active: boolean): React.CSSProperties {
  return {
    flex: 1,
    padding: '0.5rem',
    background: active ? '#111827' : '#ffffff',
    color: active ? '#ffffff' : '#111827',
    border: '1px solid #d4d4d8',
    borderRadius: '6px',
    fontSize: '0.85rem',
    cursor: 'pointer',
    fontFamily: 'inherit',
  }
}
