'use client'

import { useState, type ReactNode } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { SectionConfig } from '@/lib/schemas/site-config.schema'
import { SECTION_TYPE_LABELS } from '@/app/editor/[token]/EditorConfig'
import {
  STUDIO_COLORS,
  studioIconBtn,
  studioInputStyle,
  studioPrimaryBtn,
  studioTextareaStyle,
} from './studio-styles'

type Props = {
  section: SectionConfig
  index: number
  total: number
  isSelected: boolean
  onSelect: () => void
  onMove: (direction: -1 | 1) => void
  onDuplicate: () => void
  onToggleVisible: () => void
  onDelete: () => void
  onPatchContent: (patch: Record<string, unknown>) => void
  children: ReactNode
}

const INLINE_EDITABLE_TYPES = new Set<SectionConfig['type']>(['cover', 'bio', 'statement', 'cta'])

export default function CanvasSectionWrapper({
  section,
  index,
  total,
  isSelected,
  onSelect,
  onMove,
  onDuplicate,
  onToggleVisible,
  onDelete,
  onPatchContent,
  children,
}: Props) {
  const [hovered, setHovered] = useState(false)
  const [inlineEditing, setInlineEditing] = useState(false)

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: section.id,
    data: { source: 'canvas', sectionId: section.id },
  })

  const label = SECTION_TYPE_LABELS[section.type] ?? section.type
  const canInlineEdit = INLINE_EDITABLE_TYPES.has(section.type)
  const showChrome = isSelected || hovered

  return (
    <div
      ref={setNodeRef}
      data-canvas-section={section.id}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClickCapture={(e) => {
        const anchor = (e.target as HTMLElement | null)?.closest('a')
        if (anchor) {
          e.preventDefault()
        }
      }}
      onClick={(e) => {
        e.stopPropagation()
        onSelect()
      }}
      onDoubleClick={(e) => {
        e.stopPropagation()
        onSelect()
        if (canInlineEdit) setInlineEditing(true)
      }}
      style={{
        position: 'relative',
        outline: isSelected
          ? `2px solid ${STUDIO_COLORS.accent}`
          : hovered
            ? '1px dashed #818cf8'
            : '1px solid transparent',
        outlineOffset: '-2px',
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.45 : 1,
        cursor: 'pointer',
      }}
    >
      {showChrome && (
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            position: 'absolute',
            top: '8px',
            right: '8px',
            zIndex: 40,
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.25rem',
            padding: '0.25rem 0.4rem',
            background: '#ffffff',
            border: `1px solid ${STUDIO_COLORS.border}`,
            borderRadius: '7px',
            boxShadow: '0 4px 14px rgba(15, 23, 42, 0.14)',
            color: STUDIO_COLORS.text,
            fontFamily: 'system-ui, -apple-system, sans-serif',
          }}
        >
          <button
            type="button"
            aria-label={`Arrastrar bloque ${label}`}
            {...attributes}
            {...listeners}
            style={{
              ...studioIconBtn(false),
              border: 'none',
              background: 'transparent',
              cursor: 'grab',
            }}
          >
            ≡
          </button>
          <span style={{ fontSize: '0.72rem', fontWeight: 700, paddingRight: '0.2rem' }}>{label}</span>
          {canInlineEdit && (
            <button
              type="button"
              onClick={() => setInlineEditing((v) => !v)}
              style={{
                padding: '0.2rem 0.45rem',
                fontSize: '0.68rem',
                fontWeight: 600,
                background: inlineEditing ? STUDIO_COLORS.accent : STUDIO_COLORS.chrome,
                color: inlineEditing ? '#ffffff' : STUDIO_COLORS.text,
                border: `1px solid ${STUDIO_COLORS.inputBorder}`,
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              Editar texto
            </button>
          )}
          <button
            type="button"
            aria-label={`Subir bloque ${label}`}
            disabled={index === 0}
            onClick={() => onMove(-1)}
            style={studioIconBtn(index === 0)}
          >
            ↑
          </button>
          <button
            type="button"
            aria-label={`Bajar bloque ${label}`}
            disabled={index === total - 1}
            onClick={() => onMove(1)}
            style={studioIconBtn(index === total - 1)}
          >
            ↓
          </button>
          <button
            type="button"
            aria-label={`Duplicar bloque ${label}`}
            title="Duplicar"
            onClick={onDuplicate}
            style={studioIconBtn(false)}
          >
            ⧉
          </button>
          <button
            type="button"
            aria-label={`Ocultar bloque ${label}`}
            title="Ocultar"
            onClick={onToggleVisible}
            style={studioIconBtn(false)}
          >
            👁
          </button>
          <button
            type="button"
            aria-label={`Eliminar bloque ${label}`}
            title="Eliminar"
            onClick={onDelete}
            style={{ ...studioIconBtn(false), color: STUDIO_COLORS.danger }}
          >
            ✕
          </button>
        </div>
      )}

      {inlineEditing && isSelected && (
        <div
          onClick={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
          style={{
            background: '#ffffff',
            color: STUDIO_COLORS.text,
            borderBottom: `2px solid ${STUDIO_COLORS.accent}`,
            padding: '0.75rem 1rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.45rem',
            fontFamily: 'system-ui, -apple-system, sans-serif',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <strong style={{ fontSize: '0.75rem', color: STUDIO_COLORS.accent }}>
              Edición rápida — {label}
            </strong>
            <button
              type="button"
              onClick={() => setInlineEditing(false)}
              style={{ ...studioPrimaryBtn, padding: '0.2rem 0.55rem', fontSize: '0.72rem' }}
            >
              Listo
            </button>
          </div>
          {renderInlineFields(section, onPatchContent)}
        </div>
      )}

      {children}
    </div>
  )
}

function renderInlineFields(
  section: SectionConfig,
  onPatchContent: (patch: Record<string, unknown>) => void
) {
  const c = section.content
  if (section.type === 'cover') {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
        <input
          type="text"
          aria-label="Edición rápida de titular"
          value={String(c.headline ?? '')}
          placeholder="Titular principal (H1)"
          onChange={(e) => onPatchContent({ headline: e.target.value })}
          style={studioInputStyle}
        />
        <input
          type="text"
          aria-label="Edición rápida de subtítulo"
          value={String(c.subtitle ?? '')}
          placeholder="Subtítulo"
          onChange={(e) => onPatchContent({ subtitle: e.target.value })}
          style={studioInputStyle}
        />
      </div>
    )
  }

  if (section.type === 'bio') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
        <input
          type="text"
          aria-label="Edición rápida de encabezado bio"
          value={String(c.heading ?? '')}
          placeholder="Encabezado"
          onChange={(e) => onPatchContent({ heading: e.target.value })}
          style={studioInputStyle}
        />
        <textarea
          rows={3}
          aria-label="Edición rápida de biografía"
          value={String(c.text ?? '')}
          onChange={(e) => onPatchContent({ text: e.target.value })}
          style={studioTextareaStyle}
        />
      </div>
    )
  }

  if (section.type === 'statement') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
        <textarea
          rows={2}
          aria-label="Edición rápida de cita"
          value={String(c.quote ?? c.text ?? '')}
          onChange={(e) => onPatchContent({ quote: e.target.value })}
          style={studioTextareaStyle}
        />
        <input
          type="text"
          aria-label="Edición rápida de autor"
          value={String(c.author ?? '')}
          placeholder="Autor / Firma"
          onChange={(e) => onPatchContent({ author: e.target.value })}
          style={studioInputStyle}
        />
      </div>
    )
  }

  if (section.type === 'cta') {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 180px', gap: '0.45rem' }}>
        <input
          type="text"
          aria-label="Edición rápida de título CTA"
          value={String(c.title ?? '')}
          placeholder="Título"
          onChange={(e) => onPatchContent({ title: e.target.value })}
          style={studioInputStyle}
        />
        <input
          type="text"
          aria-label="Edición rápida de descripción CTA"
          value={String(c.description ?? '')}
          placeholder="Descripción"
          onChange={(e) => onPatchContent({ description: e.target.value })}
          style={studioInputStyle}
        />
        <input
          type="text"
          aria-label="Edición rápida de botón CTA"
          value={String(c.buttonText ?? '')}
          placeholder="Texto del botón"
          onChange={(e) => onPatchContent({ buttonText: e.target.value })}
          style={studioInputStyle}
        />
      </div>
    )
  }

  return null
}
