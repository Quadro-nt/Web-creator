export const TYPE_SCALES = {
  small: {
    '--text-xs': '0.625rem',
    '--text-sm': '0.75rem',
    '--text-base': '0.875rem',
    '--text-lg': '1rem',
    '--text-xl': '1.125rem',
    '--text-2xl': '1.25rem',
    '--text-3xl': '1.5rem',
    '--text-4xl': '1.875rem',
  },
  medium: {
    '--text-xs': '0.75rem',
    '--text-sm': '0.875rem',
    '--text-base': '1rem',
    '--text-lg': '1.125rem',
    '--text-xl': '1.25rem',
    '--text-2xl': '1.5rem',
    '--text-3xl': '1.875rem',
    '--text-4xl': '2.25rem',
  },
  large: {
    '--text-xs': '0.875rem',
    '--text-sm': '1rem',
    '--text-base': '1.125rem',
    '--text-lg': '1.25rem',
    '--text-xl': '1.5rem',
    '--text-2xl': '1.875rem',
    '--text-3xl': '2.25rem',
    '--text-4xl': '3rem',
  },
} as const satisfies Record<string, Record<string, string>>

export const ARTWORK_SIZES = {
  small: { width: '240px', height: '240px' },
  medium: { width: '360px', height: '360px' },
  large: { width: '480px', height: '480px' },
} as const satisfies Record<string, { width: string; height: string }>

export const COLUMN_GAPS = {
  '2': 'repeat(2, 1fr)',
  '3': 'repeat(3, 1fr)',
  '4': 'repeat(4, 1fr)',
} as const satisfies Record<string, string>
