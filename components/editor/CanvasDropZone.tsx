'use client'

import { useState } from 'react'
import { useDroppable } from '@dnd-kit/core'
import { STUDIO_COLORS } from './studio-styles'

type Props = {
  index: number
  isDraggingPalette: boolean
  onQuickAddAt?: (index: number) => void
}

export default function CanvasDropZone({ index, isDraggingPalette, onQuickAddAt }: Props) {
  const [hovered, setHovered] = useState(false)
  const { setNodeRef, isOver } = useDroppable({
    id: `drop-index:${index}`,
    data: { source: 'drop-zone', insertIndex: index },
  })

  const showActive = isOver || isDraggingPalette

  return (
    <div
      ref={setNodeRef}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: 'relative',
        height: showActive ? (isOver ? '38px' : '20px') : '10px',
        margin: showActive ? '4px 12px' : '-4px 0',
        borderRadius: '6px',
        border: isOver
          ? `2px dashed ${STUDIO_COLORS.accent}`
          : showActive
            ? `1px dashed ${STUDIO_COLORS.inputBorder}`
            : '1px solid transparent',
        background: isOver ? STUDIO_COLORS.accentSoft : 'transparent',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'all 120ms ease',
        zIndex: 15,
      }}
    >
      {isOver && (
        <span
          style={{
            fontSize: '0.72rem',
            fontWeight: 700,
            color: STUDIO_COLORS.accent,
            pointerEvents: 'none',
          }}
        >
          Soltar módulo aquí
        </span>
      )}

      {!isDraggingPalette && hovered && onQuickAddAt && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onQuickAddAt(index)
          }}
          style={{
            padding: '0.15rem 0.55rem',
            fontSize: '0.68rem',
            fontWeight: 600,
            background: STUDIO_COLORS.primary,
            color: '#ffffff',
            border: 'none',
            borderRadius: '9999px',
            cursor: 'pointer',
            boxShadow: '0 2px 6px rgba(15,23,42,0.18)',
          }}
        >
          + Agregar módulo aquí
        </button>
      )}
    </div>
  )
}
