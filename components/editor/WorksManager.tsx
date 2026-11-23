'use client'

import { useState } from 'react'
import { ArtworkSchema, type Artwork } from '@/lib/schemas/works.schema'
import {
  STUDIO_COLORS,
  studioCardStyle,
  studioIconBtn,
  studioInputStyle,
  studioLabelStyle,
  studioPrimaryBtn,
  studioSecondaryBtn,
  studioSelectStyle,
  studioTextareaStyle,
} from './studio-styles'

type Props = {
  artistSlug: string
  editorToken?: string
  works: Artwork[]
  onWorksChange: (works: Artwork[]) => void
  onOpenMediaPicker: (currentUrl: string, onSelect: (url: string) => void) => void
}

type DraftWork = {
  slug: string
  title: string
  year: string
  medium: string
  dimensions: string
  price: string
  currency: 'PEN' | 'USD'
  sold: boolean
  description: string
  tagsText: string
  images: string[]
}

function slugifyTitle(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function toDraftWork(work?: Artwork): DraftWork {
  if (!work) {
    return {
      slug: '',
      title: '',
      year: String(new Date().getFullYear()),
      medium: '',
      dimensions: '',
      price: '',
      currency: 'PEN',
      sold: false,
      description: '',
      tagsText: '',
      images: [],
    }
  }
  return {
    slug: work.slug,
    title: work.title,
    year: String(work.year),
    medium: work.medium,
    dimensions: work.dimensions,
    price: work.price !== undefined ? String(work.price) : '',
    currency: work.currency,
    sold: work.sold,
    description: work.description ?? '',
    tagsText: work.tags.join(', '),
    images: work.images.slice(),
  }
}

export default function WorksManager({
  artistSlug,
  editorToken,
  works,
  onWorksChange,
  onOpenMediaPicker,
}: Props) {
  const [editingIndex, setEditingIndex] = useState<number | 'new' | null>(null)
  const [draft, setDraft] = useState<DraftWork>(() => toDraftWork())
  const [newImageUrl, setNewImageUrl] = useState('')
  const [saving, setSaving] = useState(false)
  const [feedback, setFeedback] = useState<{ type: 'ok' | 'error'; msg: string } | null>(null)

  async function persistWorks(nextWorks: Artwork[], okMessage: string) {
    setFeedback(null)
    if (!editorToken) {
      onWorksChange(nextWorks)
      setFeedback({ type: 'ok', msg: okMessage })
      return true
    }

    setSaving(true)
    try {
      const res = await fetch('/api/works', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-editor-token': editorToken,
        },
        body: JSON.stringify({ artistSlug, works: nextWorks }),
      })
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string }
        throw new Error(body.error ?? `Error ${res.status}`)
      }
      const data = (await res.json()) as { works?: Artwork[] }
      onWorksChange(data.works ?? nextWorks)
      setFeedback({ type: 'ok', msg: okMessage })
      return true
    } catch (err) {
      setFeedback({
        type: 'error',
        msg: err instanceof Error ? err.message : 'No se pudo guardar el catálogo',
      })
      return false
    } finally {
      setSaving(false)
    }
  }

  function startCreate() {
    setDraft(toDraftWork())
    setNewImageUrl('')
    setFeedback(null)
    setEditingIndex('new')
  }

  function startEdit(index: number) {
    setDraft(toDraftWork(works[index]))
    setNewImageUrl('')
    setFeedback(null)
    setEditingIndex(index)
  }

  async function handleSaveForm(e: React.FormEvent) {
    e.preventDefault()
    const computedSlug = (draft.slug.trim() || slugifyTitle(draft.title)).trim()
    const parsedYear = Number.parseInt(draft.year, 10)
    const parsedPrice = draft.price.trim() ? Number(draft.price) : undefined

    const candidate = {
      slug: computedSlug,
      title: draft.title.trim(),
      year: Number.isFinite(parsedYear) ? parsedYear : new Date().getFullYear(),
      medium: draft.medium.trim(),
      dimensions: draft.dimensions.trim(),
      ...(parsedPrice !== undefined && Number.isFinite(parsedPrice) ? { price: parsedPrice } : {}),
      currency: draft.currency,
      sold: draft.sold,
      images: draft.images.filter((u) => u.trim().length > 0),
      ...(draft.description.trim() ? { description: draft.description.trim() } : {}),
      tags: draft.tagsText
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
    }

    const validated = ArtworkSchema.safeParse(candidate)
    if (!validated.success) {
      setFeedback({
        type: 'error',
        msg: validated.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join(' · '),
      })
      return
    }

    const duplicateSlug = works.some(
      (w, idx) => w.slug === validated.data.slug && idx !== editingIndex
    )
    if (duplicateSlug) {
      setFeedback({ type: 'error', msg: `Ya existe otra obra con el slug "${validated.data.slug}".` })
      return
    }

    const nextWorks =
      editingIndex === 'new'
        ? [...works, validated.data]
        : works.map((w, idx) => (idx === editingIndex ? validated.data : w))

    const ok = await persistWorks(nextWorks, 'Obra guardada en el catálogo')
    if (ok) {
      setEditingIndex(null)
    }
  }

  async function handleMove(index: number, dir: -1 | 1) {
    const target = index + dir
    if (target < 0 || target >= works.length) return
    const next = works.slice()
    const tmp = next[index]
    next[index] = next[target]
    next[target] = tmp
    await persistWorks(next, 'Orden actualizado')
  }

  async function handleToggleSold(index: number) {
    const next = works.map((w, i) => (i === index ? { ...w, sold: !w.sold } : w))
    await persistWorks(next, 'Estado de disponibilidad actualizado')
  }

  async function handleDelete(index: number) {
    const next = works.filter((_, i) => i !== index)
    await persistWorks(next, 'Obra eliminada')
  }

  if (editingIndex !== null) {
    return (
      <form onSubmit={(e) => void handleSaveForm(e)} style={{ ...studioCardStyle, display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <strong style={{ fontSize: '0.85rem', color: STUDIO_COLORS.text }}>
            {editingIndex === 'new' ? 'Nueva obra' : 'Editar obra'}
          </strong>
          <button type="button" onClick={() => setEditingIndex(null)} style={studioSecondaryBtn}>
            Volver
          </button>
        </div>

        <label style={studioLabelStyle}>
          <span>Título</span>
          <input
            type="text"
            required
            maxLength={120}
            value={draft.title}
            onChange={(e) => {
              const title = e.target.value
              setDraft((prev) => ({
                ...prev,
                title,
                slug: editingIndex === 'new' ? slugifyTitle(title) : prev.slug,
              }))
            }}
            style={studioInputStyle}
          />
        </label>

        <details style={{ fontSize: '0.75rem', color: STUDIO_COLORS.muted }}>
          <summary style={{ cursor: 'pointer', userSelect: 'none' }}>Opciones avanzadas</summary>
          <label style={{ ...studioLabelStyle, marginTop: '0.4rem' }}>
            <span>Identificador en URL (auto-generado)</span>
            <input
              type="text"
              required
              value={draft.slug}
              onChange={(e) => setDraft((prev) => ({ ...prev, slug: e.target.value }))}
              style={studioInputStyle}
            />
          </label>
        </details>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
          <label style={studioLabelStyle}>
            <span>Año</span>
            <input
              type="number"
              min={1900}
              max={2100}
              value={draft.year}
              onChange={(e) => setDraft((prev) => ({ ...prev, year: e.target.value }))}
              style={studioInputStyle}
            />
          </label>
          <label style={studioLabelStyle}>
            <span>Dimensiones</span>
            <input
              type="text"
              maxLength={60}
              value={draft.dimensions}
              onChange={(e) => setDraft((prev) => ({ ...prev, dimensions: e.target.value }))}
              placeholder="80 × 60 cm"
              style={studioInputStyle}
            />
          </label>
        </div>

        <label style={studioLabelStyle}>
          <span>Técnica / Medio</span>
          <input
            type="text"
            maxLength={80}
            value={draft.medium}
            onChange={(e) => setDraft((prev) => ({ ...prev, medium: e.target.value }))}
            placeholder="Óleo sobre lienzo"
            style={studioInputStyle}
          />
        </label>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 90px', gap: '0.5rem' }}>
          <label style={studioLabelStyle}>
            <span>Precio (opcional)</span>
            <input
              type="number"
              min={1}
              step="any"
              value={draft.price}
              onChange={(e) => setDraft((prev) => ({ ...prev, price: e.target.value }))}
              placeholder="Consultar"
              style={studioInputStyle}
            />
          </label>
          <label style={studioLabelStyle}>
            <span>Moneda</span>
            <select
              value={draft.currency}
              onChange={(e) => setDraft((prev) => ({ ...prev, currency: e.target.value as 'PEN' | 'USD' }))}
              style={studioSelectStyle}
            >
              <option value="PEN">PEN</option>
              <option value="USD">USD</option>
            </select>
          </label>
        </div>

        <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: STUDIO_COLORS.text }}>
          <input
            type="checkbox"
            checked={draft.sold}
            onChange={(e) => setDraft((prev) => ({ ...prev, sold: e.target.checked }))}
          />
          Marcar obra como vendida
        </label>

        <label style={studioLabelStyle}>
          <span>Descripción</span>
          <textarea
            rows={3}
            maxLength={600}
            value={draft.description}
            onChange={(e) => setDraft((prev) => ({ ...prev, description: e.target.value }))}
            style={studioTextareaStyle}
          />
        </label>

        <label style={studioLabelStyle}>
          <span>Etiquetas (separadas por coma)</span>
          <input
            type="text"
            value={draft.tagsText}
            onChange={(e) => setDraft((prev) => ({ ...prev, tagsText: e.target.value }))}
            placeholder="óleo, abstracción, lima"
            style={studioInputStyle}
          />
        </label>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#334155' }}>Imágenes (mín. 1)</span>
            <button
              type="button"
              onClick={() =>
                onOpenMediaPicker('', (url) =>
                  setDraft((prev) => ({ ...prev, images: [...prev.images, url] }))
                )
              }
              style={{ ...studioSecondaryBtn, padding: '0.25rem 0.5rem', fontSize: '0.72rem' }}
            >
              Subir / Elegir
            </button>
          </div>

          {draft.images.map((url, idx) => (
            <div key={idx} style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
              <img
                src={url}
                alt={`Imagen ${idx + 1}`}
                style={{ width: '32px', height: '32px', objectFit: 'cover', borderRadius: '4px', background: '#f1f5f9' }}
              />
              <input
                type="text"
                value={url}
                onChange={(e) => {
                  const val = e.target.value
                  setDraft((prev) => ({
                    ...prev,
                    images: prev.images.map((img, i) => (i === idx ? val : img)),
                  }))
                }}
                style={{ ...studioInputStyle, flex: 1 }}
              />
              <button
                type="button"
                aria-label="Quitar imagen"
                onClick={() =>
                  setDraft((prev) => ({
                    ...prev,
                    images: prev.images.filter((_, i) => i !== idx),
                  }))
                }
                style={{ ...studioIconBtn(false), color: STUDIO_COLORS.danger }}
              >
                ✕
              </button>
            </div>
          ))}

          <div style={{ display: 'flex', gap: '0.35rem' }}>
            <input
              type="text"
              value={newImageUrl}
              onChange={(e) => setNewImageUrl(e.target.value)}
              placeholder="Pegar URL de imagen…"
              style={{ ...studioInputStyle, flex: 1 }}
            />
            <button
              type="button"
              onClick={() => {
                const trimmed = newImageUrl.trim()
                if (!trimmed) return
                setDraft((prev) => ({ ...prev, images: [...prev.images, trimmed] }))
                setNewImageUrl('')
              }}
              style={studioSecondaryBtn}
            >
              + URL
            </button>
          </div>
        </div>

        {feedback && (
          <p role="alert" style={{ margin: 0, fontSize: '0.75rem', color: feedback.type === 'error' ? STUDIO_COLORS.danger : STUDIO_COLORS.success }}>
            {feedback.msg}
          </p>
        )}

        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
          <button type="button" onClick={() => setEditingIndex(null)} style={studioSecondaryBtn}>
            Cancelar
          </button>
          <button type="submit" disabled={saving} style={studioPrimaryBtn}>
            {saving ? 'Guardando…' : 'Guardar obra'}
          </button>
        </div>
      </form>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '0.75rem', color: STUDIO_COLORS.muted }}>
          {works.length} {works.length === 1 ? 'obra' : 'obras'} en catálogo
        </span>
        <button type="button" onClick={startCreate} style={studioPrimaryBtn}>
          + Nueva obra
        </button>
      </div>

      {feedback && (
        <p aria-live="polite" style={{ margin: 0, fontSize: '0.75rem', color: feedback.type === 'error' ? STUDIO_COLORS.danger : STUDIO_COLORS.success }}>
          {feedback.msg}
        </p>
      )}

      {works.length === 0 ? (
        <div style={studioCardStyle}>
          <p style={{ margin: 0, fontSize: '0.78rem', color: STUDIO_COLORS.muted }}>
            Aún no hay obras registradas. Crea la primera con “+ Nueva obra”.
          </p>
        </div>
      ) : (
        works.map((work, index) => (
          <div
            key={work.slug}
            style={{
              ...studioCardStyle,
              padding: '0.55rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.45rem',
            }}
          >
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <img
                src={work.images[0]}
                alt={work.title}
                style={{ width: '44px', height: '44px', objectFit: 'cover', borderRadius: '5px', background: '#f1f5f9', flexShrink: 0 }}
              />
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 600, color: STUDIO_COLORS.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {work.title}
                </div>
                <div style={{ fontSize: '0.7rem', color: STUDIO_COLORS.muted }}>
                  {work.year} · {work.medium}
                </div>
                <div style={{ fontSize: '0.7rem', color: work.sold ? STUDIO_COLORS.danger : STUDIO_COLORS.success, fontWeight: 600 }}>
                  {work.sold
                    ? 'Vendida'
                    : work.price !== undefined
                      ? `${work.currency} ${work.price}`
                      : 'Consultar precio'}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap', alignItems: 'center' }}>
              <button
                type="button"
                aria-label={`Subir obra ${work.title}`}
                disabled={index === 0 || saving}
                onClick={() => void handleMove(index, -1)}
                style={studioIconBtn(index === 0 || saving)}
              >
                ↑
              </button>
              <button
                type="button"
                aria-label={`Bajar obra ${work.title}`}
                disabled={index === works.length - 1 || saving}
                onClick={() => void handleMove(index, 1)}
                style={studioIconBtn(index === works.length - 1 || saving)}
              >
                ↓
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={() => void handleToggleSold(index)}
                style={{ ...studioSecondaryBtn, padding: '0.2rem 0.45rem', fontSize: '0.7rem' }}
              >
                {work.sold ? 'Marcar disponible' : 'Marcar vendida'}
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={() => startEdit(index)}
                style={{ ...studioSecondaryBtn, padding: '0.2rem 0.45rem', fontSize: '0.7rem', marginLeft: 'auto' }}
              >
                Editar
              </button>
              <button
                type="button"
                disabled={saving}
                aria-label={`Eliminar obra ${work.title}`}
                onClick={() => void handleDelete(index)}
                style={{ ...studioIconBtn(saving), color: STUDIO_COLORS.danger }}
              >
                ✕
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  )
}
