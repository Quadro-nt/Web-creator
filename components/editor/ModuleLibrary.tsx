'use client'

import { useState } from 'react'
import { useDraggable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import type { SectionConfig, SectionType } from '@/lib/schemas/site-config.schema'
import {
  MODULE_CATALOG,
  type ModuleCategory,
  type ModuleDefinition,
} from '@/app/editor/[token]/EditorConfig'
import {
  STUDIO_COLORS,
  studioCardStyle,
  studioIconBtn,
  studioInputStyle,
} from './studio-styles'

type Props = {
  sections: SectionConfig[]
  onAddModule: (type: SectionType) => void
  onSelectSection: (sectionId: string) => void
}

const CATEGORY_LABELS: Array<{ key: ModuleCategory; label: string }> = [
  { key: 'esenciales', label: 'Esenciales' },
  { key: 'contenido', label: 'Contenido' },
  { key: 'conversion', label: 'Conversión' },
]

export default function ModuleLibrary({ sections, onAddModule, onSelectSection }: Props) {
  const [query, setQuery] = useState('')
  const normalized = query.trim().toLowerCase()

  const filtered = MODULE_CATALOG.filter((m) => {
    if (!normalized) return true
    return (
      m.label.toLowerCase().includes(normalized) ||
      m.description.toLowerCase().includes(normalized) ||
      m.type.toLowerCase().includes(normalized)
    )
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Buscar módulo…"
        aria-label="Buscar módulo"
        style={studioInputStyle}
      />

      <p style={{ margin: 0, fontSize: '0.72rem', color: STUDIO_COLORS.muted, lineHeight: 1.4 }}>
        Arrastra cualquier módulo al lienzo central o haz clic en <strong>+</strong> para insertarlo.
      </p>

      {CATEGORY_LABELS.map((cat) => {
        const group = filtered.filter((m) => m.category === cat.key)
        if (group.length === 0) return null
        return (
          <div key={cat.key} style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
            <h3
              style={{
                margin: '0.25rem 0 0',
                fontSize: '0.7rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                color: STUDIO_COLORS.muted,
              }}
            >
              {cat.label}
            </h3>
            {group.map((mod) => {
              const existing = !mod.repeatable
                ? sections.find((s) => s.type === mod.type)
                : undefined
              return (
                <DraggableModuleCard
                  key={mod.type}
                  mod={mod}
                  existingId={existing?.id}
                  onAdd={() => onAddModule(mod.type)}
                  onSelectExisting={existing ? () => onSelectSection(existing.id) : undefined}
                />
              )
            })}
          </div>
        )
      })}

      {filtered.length === 0 && (
        <p style={{ margin: 0, fontSize: '0.78rem', color: STUDIO_COLORS.muted }}>
          No hay módulos que coincidan con “{query}”.
        </p>
      )}
    </div>
  )
}

function DraggableModuleCard({
  mod,
  existingId,
  onAdd,
  onSelectExisting,
}: {
  mod: ModuleDefinition
  existingId?: string
  onAdd: () => void
  onSelectExisting?: () => void
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `palette:${mod.type}`,
    data: { source: 'palette', moduleType: mod.type },
    disabled: Boolean(existingId),
  })

  const style: React.CSSProperties = {
    ...studioCardStyle,
    padding: '0.55rem 0.65rem',
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: '0.5rem',
    opacity: isDragging ? 0.5 : 1,
    transform: transform ? CSS.Translate.toString(transform) : undefined,
    cursor: existingId ? 'default' : 'grab',
    background: existingId ? STUDIO_COLORS.chrome : STUDIO_COLORS.surface,
  }

  return (
    <div ref={setNodeRef} style={style} {...(existingId ? {} : { ...attributes, ...listeners })}>
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
          <strong style={{ fontSize: '0.8rem', color: STUDIO_COLORS.text }}>{mod.label}</strong>
          {existingId && onSelectExisting && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                onSelectExisting()
              }}
              style={{
                border: 'none',
                background: STUDIO_COLORS.accentSoft,
                color: STUDIO_COLORS.accent,
                borderRadius: '9999px',
                padding: '0.1rem 0.45rem',
                fontSize: '0.65rem',
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              En página
            </button>
          )}
        </div>
        <p style={{ margin: '0.2rem 0 0', fontSize: '0.72rem', color: STUDIO_COLORS.muted, lineHeight: 1.35 }}>
          {mod.description}
        </p>
      </div>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          if (existingId && onSelectExisting) {
            onSelectExisting()
          } else {
            onAdd()
          }
        }}
        onPointerDown={(e) => e.stopPropagation()}
        aria-label={existingId ? `Ir a ${mod.label}` : `Agregar ${mod.label}`}
        title={existingId ? `Seleccionar ${mod.label}` : `Agregar ${mod.label}`}
        style={studioIconBtn(false)}
      >
        {existingId ? '→' : '+'}
      </button>
    </div>
  )
}
