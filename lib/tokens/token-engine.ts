import type { SiteConfig } from '../schemas/site-config.schema'
import { adjustForContrast } from './contrast'
import { TYPOGRAPHY_PAIRS } from './typography-pairs'

const SPACING_SCALES = {
  compact: { xs: '0.25rem', sm: '0.375rem', md: '0.5rem', lg: '0.75rem', xl: '1rem' },
  normal: { xs: '0.5rem', sm: '0.75rem', md: '1rem', lg: '1.5rem', xl: '2rem' },
  spacious: { xs: '0.75rem', sm: '1.125rem', md: '1.5rem', lg: '2.25rem', xl: '3rem' },
} as const

const TYPE_SCALES = {
  small: {
    xs: '0.625rem',
    sm: '0.75rem',
    base: '0.875rem',
    lg: '1rem',
    xl: '1.125rem',
    '2xl': '1.25rem',
    '3xl': '1.5rem',
    '4xl': '1.875rem',
  },
  medium: {
    xs: '0.75rem',
    sm: '0.875rem',
    base: '1rem',
    lg: '1.125rem',
    xl: '1.25rem',
    '2xl': '1.5rem',
    '3xl': '1.875rem',
    '4xl': '2.25rem',
  },
  large: {
    xs: '0.875rem',
    sm: '1rem',
    base: '1.125rem',
    lg: '1.25rem',
    xl: '1.5rem',
    '2xl': '1.875rem',
    '3xl': '2.25rem',
    '4xl': '3rem',
  },
} as const

const ARTWORK_TREATMENT_CLASSES = {
  frame: `.artwork-treatment {
  border: 2px solid var(--color-text);
  padding: var(--spacing-md);
}`,
  margin: `.artwork-treatment {
  padding: var(--spacing-md);
}`,
  bleed: `.artwork-treatment {
  padding: 0;
  border: none;
  width: 100%;
}`,
}

export function getGoogleFontsUrl(fontPairKey: string): string {
  const pair = TYPOGRAPHY_PAIRS[fontPairKey]
  if (!pair) return ''
  const families = [pair.heading, pair.body]
    .map((f) => f.replace(/ /g, '+') + ':ital,wght@0,400;0,700;1,400')
    .join('&family=')
  return `https://fonts.googleapis.com/css2?family=${families}&display=swap`
}

export function generateTokenStyles(config: SiteConfig): string {
  const { styleTokens, sizes } = config
  const { background, text, accent, fontPair, spacing, artworkTreatment } = styleTokens
  const { typeScale } = sizes

  const adjustedText = adjustForContrast(text, background)
  const adjustedAccent = adjustForContrast(accent, background)

  const pair = TYPOGRAPHY_PAIRS[fontPair] ?? TYPOGRAPHY_PAIRS['playfair-raleway']
  const spacingScale = SPACING_SCALES[spacing]
  const typeScaleValues = TYPE_SCALES[typeScale]
  const fontsUrl = getGoogleFontsUrl(fontPair)

  const lines: string[] = []
  lines.push(`@import url('${fontsUrl}');`)
  lines.push('')
  lines.push(':root {')
  lines.push(`  --color-bg: ${background};`)
  lines.push(`  --color-text: ${adjustedText};`)
  lines.push(`  --color-accent: ${adjustedAccent};`)
  lines.push(`  --font-heading: '${pair.heading}', serif;`)
  lines.push(`  --font-body: '${pair.body}', sans-serif;`)
  lines.push(`  --spacing-xs: ${spacingScale.xs};`)
  lines.push(`  --spacing-sm: ${spacingScale.sm};`)
  lines.push(`  --spacing-md: ${spacingScale.md};`)
  lines.push(`  --spacing-lg: ${spacingScale.lg};`)
  lines.push(`  --spacing-xl: ${spacingScale.xl};`)
  lines.push(`  --text-xs: ${typeScaleValues.xs};`)
  lines.push(`  --text-sm: ${typeScaleValues.sm};`)
  lines.push(`  --text-base: ${typeScaleValues.base};`)
  lines.push(`  --text-lg: ${typeScaleValues.lg};`)
  lines.push(`  --text-xl: ${typeScaleValues.xl};`)
  lines.push(`  --text-2xl: ${typeScaleValues['2xl']};`)
  lines.push(`  --text-3xl: ${typeScaleValues['3xl']};`)
  lines.push(`  --text-4xl: ${typeScaleValues['4xl']};`)
  lines.push('}')
  lines.push('')
  lines.push(ARTWORK_TREATMENT_CLASSES[artworkTreatment])

  return lines.join('\n')
}
