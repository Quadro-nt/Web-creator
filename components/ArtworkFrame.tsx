import React from 'react'

type ArtworkTreatment = 'frame' | 'margin' | 'bleed'

interface ArtworkFrameProps {
  treatment: ArtworkTreatment
  children: React.ReactNode
  className?: string
}

const treatmentStyles: Record<ArtworkTreatment, React.CSSProperties> = {
  frame: {
    border: '2px solid var(--color-text)',
    padding: 'var(--spacing-sm)',
  },
  margin: {
    padding: 'var(--spacing-md)',
  },
  bleed: {
    padding: 0,
    overflow: 'hidden',
  },
}

export function ArtworkFrame({ treatment, children, className }: ArtworkFrameProps) {
  return (
    <div
      style={treatmentStyles[treatment]}
      className={className}
      data-treatment={treatment}
    >
      {children}
    </div>
  )
}
