'use client'

import { useEffect, useMemo, useState } from 'react'
import type { SiteConfig } from '@/lib/schemas/site-config.schema'
import { RESERVED_PAGE_SLUGS } from '@/lib/schemas/reserved-page-slugs'
import {
  STUDIO_COLORS,
  studioInputStyle,
  studioLabelStyle,
  studioPrimaryBtn,
  studioSecondaryBtn,
} from './studio-styles'

type Mode = 'create' | { kind: 'edit'; slug: string }

type Props = {
  mode: Mode
  config: SiteConfig
  onSubmit: (payload: {
    title: string
    slug: string
    showInNav: boolean
    copyFromSlug?: string
  }) => void
  onClose: () => void
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
}

const SLUG_RE = /^[a-z0-9-]+$/

export default function PageModal({ mode, config, onSubmit, onClose }: Props) {
  const isEdit = typeof mode === 'object'
  const editingPage = isEdit
    ? config.pages?.find((p) => p.slug === mode.slug)
    : undefined
  const pages = config.pages ?? []

  const [title, setTitle] = useState(editingPage?.title ?? '')
  const [slug, setSlug] = useState(editingPage?.slug ?? '')
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(isEdit)
  const [showInNav, setShowInNav] = useState(editingPage?.showInNav ?? true)
  const [copyFromSlug, setCopyFromSlug] = useState<string | undefined>(undefined)

  useEffect(() => {
    if (!slugManuallyEdited && !isEdit) setSlug(slugify(title))
  }, [title, slugManuallyEdited, isEdit])

  const slugError = useMemo(() => {
    if (!slug) return 'El slug es requerido'
    if (!SLUG_RE.test(slug)) return 'Formato de slug inválido (usa a-z, 0-9, guiones)'
    if (RESERVED_PAGE_SLUGS.has(slug)) return `"${slug}" es un slug reservado`
    if (slug !== editingPage?.slug && pages.some((p) => p.slug === slug)) {
      return `Ya existe una página con slug "${slug}"`
    }
    return null
  }, [slug, pages, editingPage])

  const titleError = title.trim().length === 0 ? 'El título es requerido' : null
  const canSubmit = !slugError && !titleError

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={isEdit ? 'Editar página' : 'Crear página'}
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
          maxWidth: '420px',
          background: STUDIO_COLORS.surface,
          borderRadius: '10px',
          border: `1px solid ${STUDIO_COLORS.border}`,
          padding: '1rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <strong style={{ fontSize: '0.95rem' }}>
            {isEdit ? 'Editar página' : 'Nueva página'}
          </strong>
          <button type="button" onClick={onClose} style={studioSecondaryBtn}>
            Cerrar
          </button>
        </div>

        <div style={studioLabelStyle}>
          <label htmlFor="page-modal-title">Título</label>
          <input
            id="page-modal-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            style={studioInputStyle}
            autoFocus
          />
          {titleError && (
            <span style={{ color: STUDIO_COLORS.danger, fontSize: '0.7rem' }}>{titleError}</span>
          )}
        </div>

        <div style={studioLabelStyle}>
          <label htmlFor="page-modal-slug">Slug</label>
          <input
            id="page-modal-slug"
            type="text"
            value={slug}
            onChange={(e) => {
              setSlug(e.target.value)
              setSlugManuallyEdited(true)
            }}
            style={studioInputStyle}
          />
          {slugError && (
            <span style={{ color: STUDIO_COLORS.danger, fontSize: '0.7rem' }}>{slugError}</span>
          )}
        </div>

        <div style={{ ...studioLabelStyle, flexDirection: 'row', gap: '0.5rem', alignItems: 'center' }}>
          <input
            id="page-modal-show-in-nav"
            type="checkbox"
            checked={showInNav}
            onChange={(e) => setShowInNav(e.target.checked)}
          />
          <label htmlFor="page-modal-show-in-nav">Mostrar en la navegación</label>
        </div>

        {!isEdit && (
          <div style={studioLabelStyle}>
            <label htmlFor="page-modal-copy-from">Empezar desde</label>
            <select
              id="page-modal-copy-from"
              value={copyFromSlug ?? ''}
              onChange={(e) => setCopyFromSlug(e.target.value || undefined)}
              style={studioInputStyle}
            >
              <option value="">Página vacía</option>
              {pages.map((p) => (
                <option key={p.slug} value={p.slug}>
                  Copiar secciones de &quot;{p.title}&quot;
                </option>
              ))}
            </select>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.25rem' }}>
          <button type="button" onClick={onClose} style={studioSecondaryBtn}>
            Cancelar
          </button>
          <button
            type="button"
            disabled={!canSubmit}
            onClick={() =>
              onSubmit({
                title: title.trim(),
                slug: slug.trim(),
                showInNav,
                copyFromSlug: isEdit ? undefined : copyFromSlug,
              })
            }
            style={{
              ...studioPrimaryBtn,
              opacity: canSubmit ? 1 : 0.5,
              cursor: canSubmit ? 'pointer' : 'not-allowed',
            }}
          >
            {isEdit ? 'Guardar' : 'Crear'}
          </button>
        </div>
      </div>
    </div>
  )
}
