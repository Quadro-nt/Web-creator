export type Viewport = 'desktop' | 'mobile'

export const SECTION_TYPE_LABELS: Record<string, string> = {
  cover: 'Portada',
  artworks: 'Obras',
  bio: 'Biografía',
  exhibitions: 'Exposiciones',
  contact: 'Contacto',
}

export const SECTION_VARIANTS: Record<string, string[]> = {
  cover: ['fullscreen', 'split', 'minimal'],
  artworks: ['grid', 'masonry', 'carousel'],
  bio: ['split', 'centered', 'stacked'],
  exhibitions: ['list', 'timeline', 'cards'],
  contact: ['simple', 'form', 'split'],
}

export const FONT_PAIR_LABELS: Record<string, string> = {
  'playfair-raleway': 'Playfair + Raleway',
  'libre-baskerville-source-sans': 'Libre Baskerville + Source Sans',
  'cormorant-jost': 'Cormorant + Jost',
  'dm-serif-inter': 'DM Serif + Inter',
  'fraunces-nunito': 'Fraunces + Nunito',
  'bodoni-moda-figtree': 'Bodoni Moda + Figtree',
  'garamond-lato': 'EB Garamond + Lato',
  'merriweather-open-sans': 'Merriweather + Open Sans',
  'spectral-work-sans': 'Spectral + Work Sans',
  'big-caslon-muli': 'Big Shoulders + Mulish',
  'IM-fell-outfit': 'IM Fell + Outfit',
  'alice-rubik': 'Alice + Rubik',
}
