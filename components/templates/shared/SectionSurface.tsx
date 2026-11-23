import type { ReactNode } from 'react'
import type { SectionStyleConfig } from '@/lib/schemas/site-config.schema'

type Props = {
  styleConfig?: SectionStyleConfig
  children: ReactNode
}

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
        padding: py,
        ...(framed
          ? {
              margin: '1.25rem auto',
              maxWidth: '1240px',
              border: '1px solid currentColor',
              borderRadius: 'var(--radius-card)',
              overflow: 'hidden',
            }
          : {}),
      }}
    >
      {children}
    </div>
  )
}
