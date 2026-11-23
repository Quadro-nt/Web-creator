'use client'

import { useEffect, useState } from 'react'
import MediaLibrary from './MediaLibrary'
import {
  STUDIO_COLORS,
  studioInputStyle,
  studioLabelStyle,
  studioPrimaryBtn,
  studioSecondaryBtn,
} from './studio-styles'

type Props = {
  open: boolean
  artistSlug: string
  editorToken?: string
  initialUrl?: string
  onSelect: (url: string) => void
  onClose: () => void
}

export default function MediaPickerModal({
  open,
  artistSlug,
  editorToken,
  initialUrl = '',
  onSelect,
  onClose,
}: Props) {
  const [urlInput, setUrlInput] = useState(initialUrl)

  useEffect(() => {
    setUrlInput(initialUrl)
  }, [initialUrl, open])

  useEffect(() => {
    if (!open) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Selector de imagen"
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15, 23, 42, 0.5)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '520px',
          maxHeight: '85vh',
          overflowY: 'auto',
          background: STUDIO_COLORS.surface,
          borderRadius: '10px',
          border: `1px solid ${STUDIO_COLORS.border}`,
          boxShadow: '0 20px 50px rgba(15, 23, 42, 0.2)',
          padding: '1rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.85rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <strong style={{ fontSize: '0.95rem', color: STUDIO_COLORS.text }}>Elegir o subir imagen</strong>
          <button type="button" onClick={onClose} style={studioSecondaryBtn}>
            Cerrar
          </button>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault()
            const trimmed = urlInput.trim()
            if (trimmed) {
              onSelect(trimmed)
              onClose()
            }
          }}
          style={{ display: 'flex', gap: '0.45rem', alignItems: 'flex-end' }}
        >
          <label style={{ ...studioLabelStyle, flex: 1 }}>
            <span>Pegar URL externa o ruta /uploads/…</span>
            <input
              type="text"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="https://..."
              style={studioInputStyle}
            />
          </label>
          <button type="submit" style={studioPrimaryBtn}>
            Aplicar URL
          </button>
        </form>

        <div style={{ borderTop: `1px solid ${STUDIO_COLORS.border}`, paddingTop: '0.75rem' }}>
          <MediaLibrary
            artistSlug={artistSlug}
            editorToken={editorToken}
            selectedUrl={initialUrl}
            onSelect={(url) => {
              onSelect(url)
              onClose()
            }}
          />
        </div>
      </div>
    </div>
  )
}
