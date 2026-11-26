'use client'

import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { SectionConfig, SiteConfig } from '@/lib/schemas/site-config.schema'
import {
  SECTION_TYPE_LABELS,
  SECTION_VARIANTS,
  getVariantLabelEs,
} from '@/app/editor/[token]/EditorConfig'
import { STUDIO_COLORS, studioIconBtn, studioSelectStyle } from './studio-styles'


type Props = {
  sections: SectionConfig[]
  selectedSectionId?: string | null
  onSelect?: (sectionId: string) => void
  onChange: (sections: SectionConfig[]) => void
  onDuplicate?: (sectionId: string) => void
  onDelete?: (sectionId: string) => void
}

export default function SectionList({
  sections,
  selectedSectionId = null,
  onSelect,
  onChange,
  onDuplicate,
  onDelete,
}: Props) {
  function toggleVisible(index: number) {
    const next = sections.map((s, i) => (i === index ? { ...s, visible: !s.visible } : s))
    onChange(next)
  }

  function setVariant(index: number, variant: string) {
    const next = sections.map((s, i) => (i === index ? { ...s, variant } : s))
    onChange(next)
  }

  function move(index: number, direction: -1 | 1) {
    const target = index + direction
    if (target < 0 || target >= sections.length) return
    const next = sections.slice()
    const tmp = next[index]
    next[index] = next[target]
    next[target] = tmp
    onChange(next)
  }

  return (
    <SortableContext
      items={sections.map((s) => `layer:${s.id}`)}
      strategy={verticalListSortingStrategy}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {sections.map((section, index) => (
          <SortableLayerItem
            key={section.id}
            section={section}
            index={index}
            total={sections.length}
            isSelected={selectedSectionId === section.id}
            onSelect={() => onSelect?.(section.id)}
            onMove={(dir) => move(index, dir)}
            onToggleVisible={() => toggleVisible(index)}
            onVariantChange={(v) => setVariant(index, v)}
            onDuplicate={onDuplicate ? () => onDuplicate(section.id) : undefined}
            onDelete={onDelete ? () => onDelete(section.id) : undefined}
          />
        ))}
      </div>
    </SortableContext>
  )
}

function SortableLayerItem({
  section,
  index,
  total,
  isSelected,
  onSelect,
  onMove,
  onToggleVisible,
  onVariantChange,
  onDuplicate,
  onDelete,
}: {
  section: SectionConfig
  index: number
  total: number
  isSelected: boolean
  onSelect: () => void
  onMove: (dir: -1 | 1) => void
  onToggleVisible: () => void
  onVariantChange: (variant: string) => void
  onDuplicate?: () => void
  onDelete?: () => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: `layer:${section.id}`,
    data: { source: 'layer', sectionId: section.id },
  })

  const label = SECTION_TYPE_LABELS[section.type] ?? section.type
  const variants = SECTION_VARIANTS[section.type] ?? [section.variant]

  return (
    <div
      ref={setNodeRef}
      onClick={onSelect}
      style={{
        border: isSelected ? `1.5px solid ${STUDIO_COLORS.accent}` : `1px solid ${STUDIO_COLORS.border}`,
        borderRadius: '7px',
        padding: '0.55rem 0.65rem',
        background: isSelected
          ? STUDIO_COLORS.accentSoft
          : section.visible
            ? STUDIO_COLORS.surface
            : STUDIO_COLORS.chrome,
        opacity: isDragging ? 0.55 : section.visible ? 1 : 0.72,
        transform: CSS.Transform.toString(transform),
        transition,
        display: 'flex',
        flexDirection: 'column',
        gap: '0.45rem',
        cursor: 'pointer',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.4rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', minWidth: 0 }}>
          <button
            type="button"
            aria-label={`Arrastrar ${label}`}
            onClick={(e) => e.stopPropagation()}
            {...attributes}
            {...listeners}
            style={{
              ...studioIconBtn(false),
              cursor: 'grab',
              border: 'none',
              background: 'transparent',
              fontSize: '0.9rem',
            }}
          >
            ≡
          </button>
          <span
            style={{
              fontWeight: 600,
              fontSize: '0.82rem',
              color: STUDIO_COLORS.text,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {label}
          </span>
        </div>
        <div style={{ display: 'flex', gap: '0.2rem', alignItems: 'center' }} onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={() => onMove(-1)}
            aria-label={`Subir ${label}`}
            disabled={index === 0}
            style={studioIconBtn(index === 0)}
          >
            ↑
          </button>
          <button
            type="button"
            onClick={() => onMove(1)}
            aria-label={`Bajar ${label}`}
            disabled={index === total - 1}
            style={studioIconBtn(index === total - 1)}
          >
            ↓
          </button>
          {onDuplicate && (
            <button
              type="button"
              onClick={onDuplicate}
              aria-label={`Duplicar ${label}`}
              title="Duplicar"
              style={studioIconBtn(false)}
            >
              ⧉
            </button>
          )}
          {onDelete && (
            <button
              type="button"
              onClick={onDelete}
              aria-label={`Eliminar ${label}`}
              title="Eliminar"
              style={{ ...studioIconBtn(false), color: STUDIO_COLORS.danger }}
            >
              ✕
            </button>
          )}
        </div>
      </div>

      <div
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}
        onClick={(e) => e.stopPropagation()}
      >
        <select
          aria-label={`Variante de ${label}`}
          value={section.variant}
          onChange={(e) => onVariantChange(e.target.value)}
          style={{ ...studioSelectStyle, flex: 1, padding: '0.28rem 0.4rem', fontSize: '0.75rem' }}
        >
          {variants.map((v) => (
            <option key={v} value={v}>
              {getVariantLabelEs(v)}
            </option>
          ))}
          {!variants.includes(section.variant) && (
            <option value={section.variant}>{getVariantLabelEs(section.variant)}</option>
          )}
        </select>

        <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem', color: '#334155', whiteSpace: 'nowrap' }}>
          <input
            type="checkbox"
            checked={section.visible}
            onChange={onToggleVisible}
            aria-label={`Visibilidad de ${label}`}
          />
          Visible
        </label>
      </div>
    </div>
  )
}
