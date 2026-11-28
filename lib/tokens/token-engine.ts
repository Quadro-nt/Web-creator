import { isSafeCssColor, type SiteConfig } from '../schemas/site-config.schema'
import { adjustForContrast, pickReadableOnColor } from './contrast'
import { buildGoogleFontsUrl, getFontFallback } from './font-catalog'
import { TYPOGRAPHY_PAIRS } from './typography-pairs'

const DEFAULT_BG_FALLBACK = '#ffffff'
const DEFAULT_TEXT_FALLBACK = '#1a1a1a'
const DEFAULT_ACCENT_FALLBACK = '#c47a3a'
const DEFAULT_SURFACE_FALLBACK = 'rgba(128,128,128,0.06)'

function sanitizeCssColor(value: unknown, fallback: string): string {
  if (typeof value !== 'string') return fallback
  const trimmed = value.trim()
  if (!trimmed || !isSafeCssColor(trimmed)) return fallback
  return trimmed
}

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

const RADIUS_VALUES = {
  none: '0px',
  sm: '6px',
  md: '10px',
  lg: '14px',
} as const

const TRACKING_VALUES = {
  tight: '-0.025em',
  normal: '0.02em',
  wide: '0.08em',
} as const

const ARTWORK_TREATMENT_CLASSES = {
  frame: `.artwork-treatment {
  border: 2px solid var(--color-text);
  padding: var(--spacing-md);
  border-radius: var(--radius-media);
}`,
  margin: `.artwork-treatment {
  padding: var(--spacing-md);
  border: var(--card-border);
  border-radius: var(--radius-media);
}`,
  bleed: `.artwork-treatment {
  padding: 0;
  border: var(--card-border);
  border-radius: var(--radius-media);
  overflow: hidden;
  width: 100%;
}`,
}

export function getGoogleFontsUrl(fontPairKey: string): string {
  const pair = TYPOGRAPHY_PAIRS[fontPairKey]
  if (!pair) return ''
  return buildGoogleFontsUrl([pair.heading, pair.body])
}

export function generateTokenStyles(config: SiteConfig, scopeSelector = ':root'): string {
  const { styleTokens, sizes } = config
  const {
    background,
    text,
    accent,
    fontPair,
    spacing,
    artworkTreatment,
    headingFont,
    bodyFont,
    uppercaseHeadings,
    headingTracking,
    borderRadius,
    cardBorder,
    secondaryBg,
  } = styleTokens
  const { typeScale } = sizes

  const safeBackground = sanitizeCssColor(background, DEFAULT_BG_FALLBACK)
  const safeText = sanitizeCssColor(text, DEFAULT_TEXT_FALLBACK)
  const safeAccent = sanitizeCssColor(accent, DEFAULT_ACCENT_FALLBACK)

  const adjustedText = sanitizeCssColor(
    adjustForContrast(safeText, safeBackground),
    DEFAULT_TEXT_FALLBACK
  )
  const adjustedAccent = sanitizeCssColor(
    adjustForContrast(safeAccent, safeBackground),
    safeAccent
  )
  const onAccent = pickReadableOnColor(adjustedAccent)

  const pair = TYPOGRAPHY_PAIRS[fontPair] ?? TYPOGRAPHY_PAIRS['playfair-raleway']
  const resolvedHeading = headingFont ?? pair.heading
  const resolvedBody = bodyFont ?? pair.body
  const headingFallback = headingFont ? getFontFallback(headingFont) : 'serif'
  const bodyFallback = bodyFont ? getFontFallback(bodyFont) : 'sans-serif'

  const spacingScale = SPACING_SCALES[spacing]
  const typeScaleValues = TYPE_SCALES[typeScale]
  const fontsUrl = buildGoogleFontsUrl([resolvedHeading, resolvedBody])
  const treatmentPrefix = scopeSelector === ':root' ? '' : `${scopeSelector} `

  const radiusVal = RADIUS_VALUES[borderRadius ?? 'none']
  const cardBorderVal = cardBorder ? '1px solid currentColor' : 'none'
  const headingTransformVal = uppercaseHeadings ? 'uppercase' : 'none'
  const headingTrackingVal = TRACKING_VALUES[headingTracking ?? 'normal']
  const surfaceBgVal = sanitizeCssColor(secondaryBg, DEFAULT_SURFACE_FALLBACK)

  const lines: string[] = []
  if (fontsUrl) {
    lines.push(`@import url('${fontsUrl}');`)
    lines.push('')
  }
  lines.push(`${scopeSelector} {`)
  lines.push(`  --color-bg: ${safeBackground};`)
  lines.push(`  --color-text: ${adjustedText};`)
  lines.push(`  --color-accent: ${adjustedAccent};`)
  lines.push(`  --color-on-accent: ${onAccent};`)
  lines.push(`  --color-surface: ${surfaceBgVal};`)
  lines.push(`  --qs-bg: var(--color-bg);`)
  lines.push(`  --qs-text: var(--color-text);`)
  lines.push(`  --qs-accent: var(--color-accent);`)
  lines.push(`  --qs-on-accent: var(--color-on-accent);`)
  lines.push(`  --qs-secondary-bg: var(--color-surface);`)
  lines.push(`  --qs-font-heading: var(--font-heading);`)
  lines.push(`  --qs-font-body: var(--font-body);`)
  lines.push(`  --font-heading: '${resolvedHeading}', ${headingFallback};`)
  lines.push(`  --font-body: '${resolvedBody}', ${bodyFallback};`)
  lines.push(`  --heading-transform: ${headingTransformVal};`)
  lines.push(`  --heading-tracking: ${headingTrackingVal};`)
  lines.push(`  --radius-media: ${radiusVal};`)
  lines.push(`  --radius-card: ${radiusVal};`)
  lines.push(`  --card-border: ${cardBorderVal};`)
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
  lines.push('  font-family: var(--font-body);')
  lines.push('  font-size: var(--text-base);')
  lines.push('}')
  lines.push('')
  lines.push(`${treatmentPrefix}h1, ${treatmentPrefix}h2, ${treatmentPrefix}h3 {`)
  lines.push('  font-family: var(--font-heading);')
  lines.push('  text-transform: var(--heading-transform);')
  lines.push('  letter-spacing: var(--heading-tracking);')
  lines.push('}')
  lines.push('')
  lines.push(`${treatmentPrefix}${ARTWORK_TREATMENT_CLASSES[artworkTreatment]}`)
  lines.push('')
  lines.push(`${treatmentPrefix}.qs-scheme-dark { background-color: #0d0d0d; color: #f5f5f5; }`)
  lines.push(`${treatmentPrefix}.qs-scheme-accent { background-color: var(--color-accent); color: var(--color-on-accent); }`)
  lines.push(`${treatmentPrefix}.qs-scheme-soft { background-color: var(--color-surface); color: var(--color-text); }`)
  lines.push('')
  lines.push(`${treatmentPrefix}:focus-visible { outline: 2px solid var(--color-accent); outline-offset: 3px; }`)
  lines.push(`${treatmentPrefix}.qs-skip-link { position: fixed; top: -999px; left: 1rem; z-index: 9999; background-color: var(--color-text); color: var(--color-bg); padding: 0.75rem 1.25rem; border-radius: 6px; font-size: 0.875rem; font-weight: 600; text-decoration: none; box-shadow: 0 4px 16px rgba(0, 0, 0, 0.25); }`)
  lines.push(`${treatmentPrefix}.qs-skip-link:focus, ${treatmentPrefix}.qs-skip-link:focus-visible { top: 1rem; outline: 2px solid var(--color-accent); outline-offset: 2px; }`)
  lines.push('')
  lines.push('@keyframes qs-marquee-left { 0% { transform: translateX(0%); } 100% { transform: translateX(-50%); } }')
  lines.push('@keyframes qs-marquee-right { 0% { transform: translateX(-50%); } 100% { transform: translateX(0%); } }')
  lines.push(`${treatmentPrefix}.qs-marquee-track:hover { animation-play-state: paused; }`)
  lines.push('@media (prefers-reduced-motion: reduce) {')
  lines.push(`  ${treatmentPrefix}.qs-marquee-track { animation: none !important; }`)
  lines.push('}')
  lines.push('')
  lines.push('@container qs-canvas (max-width: 760px) {')
  lines.push(`  ${treatmentPrefix}.qs-grid-responsive { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; }`)
  lines.push(`  ${treatmentPrefix}.qs-split-responsive { grid-template-columns: 1fr !important; gap: 2rem !important; }`)
  lines.push(`  ${treatmentPrefix}.qs-section-pad { padding-left: 2rem !important; padding-right: 2rem !important; }`)
  lines.push(`  ${treatmentPrefix}.qs-nav-links { gap: 1rem !important; flex-wrap: wrap !important; }`)
  lines.push('}')
  lines.push('')
  lines.push('@container qs-canvas (max-width: 480px) {')
  lines.push(`  ${treatmentPrefix}.qs-grid-responsive { grid-template-columns: 1fr !important; }`)
  lines.push(`  ${treatmentPrefix}.qs-split-responsive { grid-template-columns: 1fr !important; gap: 1.5rem !important; }`)
  lines.push(`  ${treatmentPrefix}.qs-section-pad { padding: 2.5rem 1.25rem !important; }`)
  lines.push(`  ${treatmentPrefix}.qs-nav-links { gap: 0.75rem !important; font-size: 0.75rem !important; }`)
  lines.push('}')

  return lines.join('\n')
}
