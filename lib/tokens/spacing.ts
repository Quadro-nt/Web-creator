export const SPACING_SCALES = {
  compact: {
    '--spacing-xs': '0.25rem',
    '--spacing-sm': '0.375rem',
    '--spacing-md': '0.5rem',
    '--spacing-lg': '0.75rem',
    '--spacing-xl': '1rem',
  },
  normal: {
    '--spacing-xs': '0.5rem',
    '--spacing-sm': '0.75rem',
    '--spacing-md': '1rem',
    '--spacing-lg': '1.5rem',
    '--spacing-xl': '2rem',
  },
  spacious: {
    '--spacing-xs': '0.75rem',
    '--spacing-sm': '1.125rem',
    '--spacing-md': '1.5rem',
    '--spacing-lg': '2.25rem',
    '--spacing-xl': '3rem',
  },
} as const satisfies Record<string, Record<string, string>>
