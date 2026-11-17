export type FontPair = {
  heading: string
  body: string
}

export const TYPOGRAPHY_PAIRS: Record<string, FontPair> = {
  'playfair-raleway': { heading: 'Playfair Display', body: 'Raleway' },
  'libre-baskerville-source-sans': { heading: 'Libre Baskerville', body: 'Source Sans 3' },
  'cormorant-jost': { heading: 'Cormorant Garamond', body: 'Jost' },
  'dm-serif-inter': { heading: 'DM Serif Display', body: 'Inter' },
  'fraunces-nunito': { heading: 'Fraunces', body: 'Nunito' },
  'bodoni-moda-figtree': { heading: 'Bodoni Moda', body: 'Figtree' },
  'garamond-lato': { heading: 'EB Garamond', body: 'Lato' },
  'merriweather-open-sans': { heading: 'Merriweather', body: 'Open Sans' },
  'spectral-work-sans': { heading: 'Spectral', body: 'Work Sans' },
  'big-caslon-muli': { heading: 'Big Shoulders Display', body: 'Mulish' },
  'IM-fell-outfit': { heading: 'IM Fell English', body: 'Outfit' },
  'alice-rubik': { heading: 'Alice', body: 'Rubik' },
}
