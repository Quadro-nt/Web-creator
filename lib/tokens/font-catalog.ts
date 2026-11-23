export type FontCategory = 'pop-retro' | 'editorial' | 'moderna' | 'artesanal'

export const FONT_FAMILY_NAMES = [
  'Bagel Fat One',
  'Rubik Bubbles',
  'Shrikhand',
  'Syne',
  'Bricolage Grotesque',
  'Oswald',
  'Playfair Display',
  'Cormorant Garamond',
  'Instrument Serif',
  'Bodoni Moda',
  'EB Garamond',
  'Libre Baskerville',
  'DM Serif Display',
  'Spectral',
  'Merriweather',
  'Alice',
  'Barlow Condensed',
  'Open Sans',
  'Space Grotesk',
  'DM Sans',
  'Inter',
  'Jost',
  'Work Sans',
  'Raleway',
  'Fraunces',
  'Caveat',
] as const

export type FontFamilyName = (typeof FONT_FAMILY_NAMES)[number]

export interface FontCatalogEntry {
  family: FontFamilyName
  category: FontCategory
  fallback: 'serif' | 'sans-serif' | 'display' | 'cursive'
  sample: string
  weightsParam?: string
}

export const FONT_CATEGORY_LABELS: Record<FontCategory, string> = {
  'pop-retro': 'Pop / Retro / Expresiva',
  editorial: 'Editorial / Galería',
  moderna: 'Moderna / Limpia',
  artesanal: 'Artesanal / Orgánica',
}

export const FONT_CATALOG: FontCatalogEntry[] = [
  // Pop / Retro / Expresiva
  { family: 'Bagel Fat One', category: 'pop-retro', fallback: 'display', sample: 'ARTE POP', weightsParam: 'wght@400' },
  { family: 'Rubik Bubbles', category: 'pop-retro', fallback: 'display', sample: 'BURBUJA', weightsParam: 'wght@400' },
  { family: 'Shrikhand', category: 'pop-retro', fallback: 'display', sample: 'Studio', weightsParam: 'wght@400' },
  { family: 'Syne', category: 'pop-retro', fallback: 'sans-serif', sample: 'CONTEMPORÁNEO', weightsParam: 'wght@400;600;700;800' },
  { family: 'Bricolage Grotesque', category: 'pop-retro', fallback: 'sans-serif', sample: 'Obra Nueva', weightsParam: 'wght@400;600;700' },
  { family: 'Oswald', category: 'pop-retro', fallback: 'sans-serif', sample: 'EXPOSICIÓN', weightsParam: 'wght@400;500;700' },

  // Editorial / Galería
  { family: 'Playfair Display', category: 'editorial', fallback: 'serif', sample: 'Galería', weightsParam: 'wght@400;600;700' },
  { family: 'Cormorant Garamond', category: 'editorial', fallback: 'serif', sample: 'Curaduría', weightsParam: 'wght@400;600;700' },
  { family: 'Instrument Serif', category: 'editorial', fallback: 'serif', sample: 'Catálogo', weightsParam: 'wght@400' },
  { family: 'Bodoni Moda', category: 'editorial', fallback: 'serif', sample: 'Edición', weightsParam: 'wght@400;600;700' },
  { family: 'EB Garamond', category: 'editorial', fallback: 'serif', sample: 'Archivo', weightsParam: 'wght@400;600;700' },
  { family: 'Libre Baskerville', category: 'editorial', fallback: 'serif', sample: 'Taller', weightsParam: 'wght@400;700' },
  { family: 'DM Serif Display', category: 'editorial', fallback: 'serif', sample: 'Colección', weightsParam: 'wght@400' },
  { family: 'Spectral', category: 'editorial', fallback: 'serif', sample: 'Monografía', weightsParam: 'wght@400;600;700' },
  { family: 'Merriweather', category: 'editorial', fallback: 'serif', sample: 'Relato', weightsParam: 'wght@400;700' },
  { family: 'Alice', category: 'editorial', fallback: 'serif', sample: 'Poética', weightsParam: 'wght@400' },

  // Moderna / Limpia
  { family: 'Barlow Condensed', category: 'moderna', fallback: 'sans-serif', sample: 'TIENDA · 2026', weightsParam: 'wght@400;600;700' },
  { family: 'Open Sans', category: 'moderna', fallback: 'sans-serif', sample: 'Lectura clara', weightsParam: 'wght@400;600;700' },
  { family: 'Space Grotesk', category: 'moderna', fallback: 'sans-serif', sample: 'Estudio Visual', weightsParam: 'wght@400;600;700' },
  { family: 'DM Sans', category: 'moderna', fallback: 'sans-serif', sample: 'Minimal', weightsParam: 'wght@400;500;700' },
  { family: 'Inter', category: 'moderna', fallback: 'sans-serif', sample: 'Portfolio', weightsParam: 'wght@400;600;700' },
  { family: 'Jost', category: 'moderna', fallback: 'sans-serif', sample: 'Geometría', weightsParam: 'wght@400;600;700' },
  { family: 'Work Sans', category: 'moderna', fallback: 'sans-serif', sample: 'Muestra', weightsParam: 'wght@400;600;700' },
  { family: 'Raleway', category: 'moderna', fallback: 'sans-serif', sample: 'Exhibición', weightsParam: 'wght@400;600;700' },

  // Artesanal / Orgánica
  { family: 'Fraunces', category: 'artesanal', fallback: 'serif', sample: 'Hecho a mano', weightsParam: 'wght@400;600;700' },
  { family: 'Caveat', category: 'artesanal', fallback: 'cursive', sample: 'Firma de taller', weightsParam: 'wght@400;700' },
]

const CATALOG_MAP = new Map<string, FontCatalogEntry>(
  FONT_CATALOG.map((entry) => [entry.family, entry])
)

export function getFontFallback(family: string): string {
  const found = CATALOG_MAP.get(family)
  if (!found) return 'sans-serif'
  if (found.fallback === 'display') return 'sans-serif'
  return found.fallback
}

export function buildGoogleFontsUrl(families: string[]): string {
  const unique = Array.from(new Set(families.map((f) => f.trim()).filter(Boolean)))
  if (unique.length === 0) return ''
  const query = unique
    .map((family) => {
      const entry = CATALOG_MAP.get(family)
      const encoded = family.replace(/ /g, '+')
      const weights = entry?.weightsParam ?? 'wght@400;700'
      return `family=${encoded}:${weights}`
    })
    .join('&')
  return `https://fonts.googleapis.com/css2?${query}&display=swap`
}

export function getEditorPreviewFontsUrl(): string {
  return buildGoogleFontsUrl(FONT_CATALOG.map((f) => f.family))
}
