const CSS_NAMES: Record<string, string> = {
  white: '#ffffff',
  black: '#000000',
  red: '#ff0000',
  green: '#008000',
  blue: '#0000ff',
  yellow: '#ffff00',
  gray: '#808080',
  grey: '#808080',
  orange: '#ffa500',
  purple: '#800080',
  pink: '#ffc0cb',
  brown: '#a52a2a',
  cyan: '#00ffff',
  magenta: '#ff00ff',
  silver: '#c0c0c0',
  maroon: '#800000',
  olive: '#808000',
  lime: '#00ff00',
  aqua: '#00ffff',
  teal: '#008080',
  navy: '#000080',
  fuchsia: '#ff00ff',
  ivory: '#fffff0',
  beige: '#f5f5dc',
  linen: '#faf0e6',
}

function parseCssColor(color: string): [number, number, number] | null {
  if (!color || typeof color !== 'string') return null
  const trimmed = color.trim()
  if (!trimmed) return null

  const named = CSS_NAMES[trimmed.toLowerCase()]
  if (named) return parseCssColor(named)

  const hex6 = trimmed.match(/^#?([0-9a-f]{6})$/i)
  if (hex6) {
    const h = hex6[1]
    return [
      parseInt(h.slice(0, 2), 16),
      parseInt(h.slice(2, 4), 16),
      parseInt(h.slice(4, 6), 16),
    ]
  }

  const hex3 = trimmed.match(/^#?([0-9a-f]{3})$/i)
  if (hex3) {
    const h = hex3[1]
    return [
      parseInt(h[0] + h[0], 16),
      parseInt(h[1] + h[1], 16),
      parseInt(h[2] + h[2], 16),
    ]
  }

  const rgbMatch = trimmed.match(
    /^rgba?\(\s*([\d.]+%?)\s*[,\s]\s*([\d.]+%?)\s*[,\s]\s*([\d.]+%?)(?:\s*[,/]\s*[\d.]+%?)?\s*\)$/i
  )
  if (rgbMatch) {
    const parseChannel = (raw: string): number => {
      if (raw.endsWith('%')) {
        return Math.max(0, Math.min(255, Math.round((parseFloat(raw) / 100) * 255)))
      }
      return Math.max(0, Math.min(255, Math.round(parseFloat(raw))))
    }
    const r = parseChannel(rgbMatch[1])
    const g = parseChannel(rgbMatch[2])
    const b = parseChannel(rgbMatch[3])
    if (!isNaN(r) && !isNaN(g) && !isNaN(b)) return [r, g, b]
  }

  const hslMatch = trimmed.match(
    /^hsla?\(\s*([\d.-]+)(?:deg)?\s*[,\s]\s*([\d.]+)%\s*[,\s]\s*([\d.]+)%(?:\s*[,/]\s*[\d.]+%?)?\s*\)$/i
  )
  if (hslMatch) {
    const rawH = ((parseFloat(hslMatch[1]) % 360) + 360) % 360
    const s = Math.max(0, Math.min(100, parseFloat(hslMatch[2]))) / 100
    const l = Math.max(0, Math.min(100, parseFloat(hslMatch[3]))) / 100
    if (!isNaN(rawH) && !isNaN(s) && !isNaN(l)) {
      return hslToRgb(rawH / 360, s, l)
    }
  }

  return null
}

function rgbToHex(r: number, g: number, b: number): string {
  return (
    '#' +
    [r, g, b]
      .map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0'))
      .join('')
  )
}

function linearize(c: number): number {
  const v = c / 255
  return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)
}

function relativeLuminance(r: number, g: number, b: number): number {
  return 0.2126 * linearize(r) + 0.7152 * linearize(g) + 0.0722 * linearize(b)
}

function contrastRatio(l1: number, l2: number): number {
  const lighter = Math.max(l1, l2)
  const darker = Math.min(l1, l2)
  return (lighter + 0.05) / (darker + 0.05)
}

export function getContrastRatio(fg: string, bg: string): number {
  const fgRgb = parseCssColor(fg)
  const bgRgb = parseCssColor(bg)
  if (!fgRgb || !bgRgb) return 1
  const lFg = relativeLuminance(...fgRgb)
  const lBg = relativeLuminance(...bgRgb)
  return contrastRatio(lFg, lBg)
}

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  const rn = r / 255
  const gn = g / 255
  const bn = b / 255
  const max = Math.max(rn, gn, bn)
  const min = Math.min(rn, gn, bn)
  const l = (max + min) / 2
  if (max === min) return [0, 0, l]
  const d = max - min
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
  let h = 0
  if (max === rn) h = (gn - bn) / d + (gn < bn ? 6 : 0)
  else if (max === gn) h = (bn - rn) / d + 2
  else h = (rn - gn) / d + 4
  h /= 6
  return [h, s, l]
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  if (s === 0) {
    const v = Math.round(l * 255)
    return [v, v, v]
  }
  const hue2rgb = (p: number, q: number, t: number): number => {
    let tc = t
    if (tc < 0) tc += 1
    if (tc > 1) tc -= 1
    if (tc < 1 / 6) return p + (q - p) * 6 * tc
    if (tc < 1 / 2) return q
    if (tc < 2 / 3) return p + (q - p) * (2 / 3 - tc) * 6
    return p
  }
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s
  const p = 2 * l - q
  return [
    Math.round(hue2rgb(p, q, h + 1 / 3) * 255),
    Math.round(hue2rgb(p, q, h) * 255),
    Math.round(hue2rgb(p, q, h - 1 / 3) * 255),
  ]
}

export function adjustForContrast(fg: string, bg: string, minRatio = 4.5): string {
  const fgRgb = parseCssColor(fg)
  const bgRgb = parseCssColor(bg)
  if (!fgRgb || !bgRgb) return fg

  const lBg = relativeLuminance(...bgRgb)
  const initialRatio = contrastRatio(relativeLuminance(...fgRgb), lBg)
  if (initialRatio >= minRatio) return rgbToHex(...fgRgb)

  const [h, s, l] = rgbToHsl(...fgRgb)
  let currentL = l

  if (lBg >= 0.5) {
    while (currentL > 0) {
      currentL = Math.max(0, Number((currentL - 0.03).toFixed(4)))
      const rgb = hslToRgb(h, s, currentL)
      const ratio = contrastRatio(relativeLuminance(...rgb), lBg)
      if (ratio >= minRatio) {
        return rgbToHex(...rgb)
      }
    }
  } else {
    while (currentL < 0.97) {
      currentL = Math.min(0.97, Number((currentL + 0.03).toFixed(4)))
      const rgb = hslToRgb(h, s, currentL)
      const ratio = contrastRatio(relativeLuminance(...rgb), lBg)
      if (ratio >= minRatio) {
        return rgbToHex(...rgb)
      }
    }
  }

  const whiteRatio = contrastRatio(1, lBg)
  const blackRatio = contrastRatio(0, lBg)
  if (whiteRatio >= blackRatio) return '#ffffff'
  return '#000000'
}

export function pickReadableOnColor(bg: string): string {
  const whiteRatio = getContrastRatio('#ffffff', bg)
  const darkRatio = getContrastRatio('#111111', bg)
  if (whiteRatio >= darkRatio) {
    if (whiteRatio >= 4.5) return '#ffffff'
    return getContrastRatio('#000000', bg) >= 4.5 ? '#000000' : '#ffffff'
  }
  if (darkRatio >= 4.5) return '#111111'
  return getContrastRatio('#000000', bg) >= 4.5 ? '#000000' : '#111111'
}
