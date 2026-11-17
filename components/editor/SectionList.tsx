'use client'

import type { SiteConfig } from '@/lib/schemas/site-config.schema'
import { SECTION_TYPE_LABELS, SECTION_VARIANTS } from '@/app/editor/[token]/EditorConfig'

type SectionConfig = SiteConfig['sections'][number]

type Props = {
  sections: SectionConfig[]
  onChange: (sections: SectionConfig[]) => void
}

export default function SectionList({ sections, onChange }: Props) {
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      {sections.map((section, index) => {
        const variants = SECTION_VARIANTS[section.type] ?? [section.variant]
        return (
          <div
            key={section.id}
            style={{
              border: '1px solid #e5e7eb',
              borderRadius: '6px',
              padding: '0.6rem 0.75rem',
              background: section.visible ? '#ffffff' : '#f9fafb',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
              <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                {SECTION_TYPE_LABELS[section.type] ?? section.type}
              </span>
              <div style={{ display: 'flex', gap: '0.25rem' }}>
                <button
                  type="button"
                  onClick={() => move(index, -1)}
                  aria-label={`Subir ${SECTION_TYPE_LABELS[section.type] ?? section.type}`}
                  disabled={index === 0}
                  style={iconBtn(index === 0)}
                >
                  ↑
                </button>
                <button
                  type="button"
                  onClick={() => move(index, 1)}
                  aria-label={`Bajar ${SECTION_TYPE_LABELS[section.type] ?? section.type}`}
                  disabled={index === sections.length - 1}
                  style={iconBtn(index === sections.length - 1)}
                >
                  ↓
                </button>
                <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.8rem' }}>
                  <input
                    type="checkbox"
                    checked={section.visible}
                    onChange={() => toggleVisible(index)}
                    aria-label={`Visibilidad de ${SECTION_TYPE_LABELS[section.type] ?? section.type}`}
                  />
                  Visible
                </label>
              </div>
            </div>
            <label style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', fontSize: '0.75rem', color: '#4b5563' }}>
              <span>Variante</span>
              <select
                value={section.variant}
                onChange={(e) => setVariant(index, e.target.value)}
                style={selectStyle}
              >
                {variants.map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
                {!variants.includes(section.variant) && (
                  <option value={section.variant}>{section.variant}</option>
                )}
              </select>
            </label>
          </div>
        )
      })}
    </div>
  )
}

function iconBtn(disabled: boolean): React.CSSProperties {
  return {
    width: '24px',
    height: '24px',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '1px solid #d4d4d8',
    borderRadius: '4px',
    background: disabled ? '#f3f4f6' : '#ffffff',
    color: disabled ? '#9ca3af' : '#111827',
    cursor: disabled ? 'not-allowed' : 'pointer',
    fontSize: '0.8rem',
    lineHeight: 1,
  }
}

const selectStyle: React.CSSProperties = {
  padding: '0.3rem 0.4rem',
  border: '1px solid #d4d4d8',
  borderRadius: '4px',
  fontSize: '0.8rem',
  background: '#ffffff',
}
