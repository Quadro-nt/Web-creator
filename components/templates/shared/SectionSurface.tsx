import type { CSSProperties, ReactNode } from 'react'
import type { SectionStyleConfig } from '@/lib/schemas/site-config.schema'

type Props = {
  styleConfig?: SectionStyleConfig
  children: ReactNode
}

const QS_BRIDGE: CSSProperties = {
  '--qs-bg': 'var(--color-bg)',
  '--qs-text': 'var(--color-text)',
  '--qs-accent': 'var(--color-accent)',
  '--qs-secondary-bg': 'var(--color-surface)',
  '--qs-font-heading': 'var(--font-heading)',
  '--qs-font-body': 'var(--font-body)',
  '--qs-space-xs': 'var(--spacing-xs)',
  '--qs-space-sm': 'var(--spacing-sm)',
  '--qs-space-md': 'var(--spacing-md)',
  '--qs-space-lg': 'var(--spacing-lg)',
  '--qs-space-xl': 'var(--spacing-xl)',
  '--qs-radius-sm': 'var(--radius-media)',
  '--qs-radius-md': 'var(--radius-card)',
  '--qs-radius-lg': 'var(--radius-card)',
} as CSSProperties

export default function SectionSurface({ styleConfig, children }: Props) {
  const scheme = styleConfig?.colorScheme ?? 'default'
  const framed = Boolean(styleConfig?.framed)
  const padding = styleConfig?.padding

  const schemeClass =
    scheme === 'dark'
      ? 'qs-scheme-dark'
      : scheme === 'accent'
        ? 'qs-scheme-accent'
        : scheme === 'soft'
          ? 'qs-scheme-soft'
          : ''

  const py =
    padding === 'sm'
      ? '0.5rem 0'
      : padding === 'lg'
        ? '2.5rem 0'
        : undefined

  return (
    <div
      className={schemeClass}
      style={{
        ...QS_BRIDGE,
        padding: py,
        ...(framed
          ? {
              margin: '1.25rem auto',
              maxWidth: '1240px',
              border: '1px solid var(--qs-border)',
              borderRadius: 'var(--qs-radius-md)',
              overflow: 'hidden',
            }
          : {}),
      }}
    >
      {children}
    </div>
  )
}
