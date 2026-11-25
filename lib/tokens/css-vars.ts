import { isSafeCssColor, type SiteConfig } from '@/lib/schemas/site-config.schema'
import { getFontFallback } from './font-catalog'
import { MUSEUM_PALETTE } from './museum-palette'
import { TYPOGRAPHY_PAIRS } from './typography-pairs'

const SPACING_SCALE = {
  compact: { xs: '0.25rem', sm: '0.375rem', md: '0.5rem', lg: '0.75rem', xl: '1rem' },
  normal: { xs: '0.5rem', sm: '0.75rem', md: '1rem', lg: '1.5rem', xl: '2rem' },
  spacious: { xs: '0.75rem', sm: '1.125rem', md: '1.5rem', lg: '2.25rem', xl: '3rem' },
} as const

const RADIUS_SCALE = {
  sm: '6px',
  md: '10px',
  lg: '14px',
} as const

function safeColor(value: string | undefined, fallback: string): string {
  if (typeof value !== 'string') return fallback
  const trimmed = value.trim()
  if (!trimmed || !isSafeCssColor(trimmed)) return fallback
  return trimmed
}

export function cssVarMap(config: SiteConfig): Record<string, string> {
  const t = config.styleTokens
  const pair = TYPOGRAPHY_PAIRS[t.fontPair] ?? TYPOGRAPHY_PAIRS['fraunces-nunito']
  const headingFamily = t.headingFont ?? pair.heading
  const bodyFamily = t.bodyFont ?? pair.body
  const headingFallback = t.headingFont ? getFontFallback(t.headingFont) : 'serif'
  const bodyFallback = t.bodyFont ? getFontFallback(t.bodyFont) : 'sans-serif'
  const spacing = SPACING_SCALE[t.spacing]

  return {
    '--qs-bg': safeColor(t.background, MUSEUM_PALETTE.background),
    '--qs-text': safeColor(t.text, MUSEUM_PALETTE.text),
    '--qs-accent': safeColor(t.accent, MUSEUM_PALETTE.accent),
    '--qs-secondary-bg': safeColor(t.secondaryBg, MUSEUM_PALETTE.secondaryBg),
    '--qs-border': MUSEUM_PALETTE.border,
    '--qs-font-heading': `'${headingFamily}', ${headingFallback}`,
    '--qs-font-body': `'${bodyFamily}', ${bodyFallback}`,
    '--qs-space-xs': spacing.xs,
    '--qs-space-sm': spacing.sm,
    '--qs-space-md': spacing.md,
    '--qs-space-lg': spacing.lg,
    '--qs-space-xl': spacing.xl,
    '--qs-radius-sm': RADIUS_SCALE.sm,
    '--qs-radius-md': RADIUS_SCALE.md,
    '--qs-radius-lg': RADIUS_SCALE.lg,
  }
}
