'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { MediaItem } from '@/lib/media/media-adapter'
import {
  STUDIO_COLORS,
  studioCardStyle,
  studioPrimaryBtn,
  studioSecondaryBtn,
} from './studio-styles'

function humanizeUploadError(message: string): string {
  const normalized = message.toLowerCase()
  if (normalized.includes('bucket not found')) {
    return 'El espacio de almacenamiento todavía no está listo. Reintentá en unos segundos; si persiste, avisanos.'
  }
  return message
}

type Props = {
  artistSlug: string
  editorToken?: string
  onSelect?: (url: string) => void
  selectedUrl?: string
}

export default function MediaLibrary({ artistSlug, editorToken, onSelect, selectedUrl }: Props) {
  const [items, setItems] = useState<MediaItem[]>([])
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const loadMedia = useCallback(async () => {
    if (!editorToken) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/upload?artistSlug=${encodeURIComponent(artistSlug)}`, {
        headers: { 'x-editor-token': editorToken },
      })
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string }
        throw new Error(body.error ?? `Error ${res.status}`)
      }
      const data = (await res.json()) as { items?: MediaItem[] }
      setItems(data.items ?? [])
    } catch (err) {
      setError(
        err instanceof Error ? humanizeUploadError(err.message) : 'No se pudo cargar la galería'
      )
    } finally {
      setLoading(false)
    }
  }, [artistSlug, editorToken])

  useEffect(() => {
    void loadMedia()
  }, [loadMedia])

  async function uploadFiles(files: FileList | null) {
    if (!files || files.length === 0) return
    if (!editorToken) {
      setError('Falta token de editor para subir imágenes.')
      return
    }
    setUploading(true)
    setError(null)
    try {
      for (const file of Array.from(files)) {
        const formData = new FormData()
        formData.append('artistSlug', artistSlug)
        formData.append('file', file)
        const res = await fetch('/api/upload', {
          method: 'POST',
          headers: { 'x-editor-token': editorToken },
          body: formData,
        })
        if (!res.ok) {
          const body = (await res.json().catch(() => ({}))) as { error?: string }
          throw new Error(body.error ?? `Error ${res.status}`)
        }
        const data = (await res.json()) as { item?: MediaItem }
        if (data.item) {
          setItems((prev) => [data.item!, ...prev])
        }
      }
    } catch (err) {
      setError(
        err instanceof Error ? humanizeUploadError(err.message) : 'Error subiendo archivo'
      )
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  function handleCopy(url: string) {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      void navigator.clipboard.writeText(url)
      setCopiedUrl(url)
      window.setTimeout(() => setCopiedUrl((cur) => (cur === url ? null : cur)), 1500)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      <div
        onDragOver={(e) => {
          e.preventDefault()
          setDragOver(true)
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragOver(false)
          void uploadFiles(e.dataTransfer.files)
        }}
        style={{
          ...studioCardStyle,
          border: dragOver ? `2px dashed ${STUDIO_COLORS.accent}` : `1px dashed ${STUDIO_COLORS.inputBorder}`,
          background: dragOver ? STUDIO_COLORS.accentSoft : STUDIO_COLORS.chrome,
          textAlign: 'center',
          padding: '1rem 0.75rem',
        }}
      >
        <p style={{ margin: '0 0 0.5rem', fontSize: '0.8rem', color: STUDIO_COLORS.text, fontWeight: 500 }}>
          {uploading ? 'Subiendo imagen…' : 'Arrastra imágenes aquí'}
        </p>
        <p style={{ margin: '0 0 0.65rem', fontSize: '0.72rem', color: STUDIO_COLORS.muted }}>
          JPG, PNG, WebP o GIF (máx. 5 MB)
        </p>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          multiple
          onChange={(e) => void uploadFiles(e.target.files)}
          style={{ display: 'none' }}
          aria-label="Seleccionar imagen para subir"
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          style={studioPrimaryBtn}
        >
          Subir imagen
        </button>
      </div>

      {error && (
        <p role="alert" style={{ margin: 0, fontSize: '0.75rem', color: STUDIO_COLORS.danger }}>
          {error}
        </p>
      )}

      {loading ? (
        <p style={{ margin: 0, fontSize: '0.78rem', color: STUDIO_COLORS.muted }}>Cargando archivos…</p>
      ) : items.length === 0 ? (
        <p style={{ margin: 0, fontSize: '0.78rem', color: STUDIO_COLORS.muted }}>
          Todavía no subiste imágenes locales.
        </p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '0.5rem' }}>
          {items.map((item) => {
            const isSelected = selectedUrl === item.url
            return (
              <div
                key={item.url}
                style={{
                  border: isSelected ? `2px solid ${STUDIO_COLORS.accent}` : `1px solid ${STUDIO_COLORS.border}`,
                  borderRadius: '6px',
                  overflow: 'hidden',
                  background: STUDIO_COLORS.surface,
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                <div style={{ aspectRatio: '4/3', background: '#f1f5f9', overflow: 'hidden' }}>
                  <img
                    src={item.url}
                    alt={item.filename}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                  />
                </div>
                <div style={{ padding: '0.4rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  <span
                    title={item.filename}
                    style={{
                      fontSize: '0.7rem',
                      color: STUDIO_COLORS.muted,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {item.filename}
                  </span>
                  <div style={{ display: 'flex', gap: '0.25rem' }}>
                    {onSelect && (
                      <button
                        type="button"
                        onClick={() => onSelect(item.url)}
                        style={{ ...studioPrimaryBtn, padding: '0.25rem 0.45rem', fontSize: '0.7rem', flex: 1 }}
                      >
                        Usar
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleCopy(item.url)}
                      style={{ ...studioSecondaryBtn, padding: '0.25rem 0.45rem', fontSize: '0.7rem', flex: onSelect ? undefined : 1 }}
                    >
                      {copiedUrl === item.url ? 'Copiado' : 'Copiar'}
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
