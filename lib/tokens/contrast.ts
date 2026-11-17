function hexToRgb(hex: string): [number, number, number] | null {
  const cleaned = hex.replace('#', '')
  if (cleaned.length === 6) {
    const r = parseInt(cleaned.slice(0, 2), 16)
    const g = parseInt(cleaned.slice(2, 4), 16)
    const b = parseInt(cleaned.slice(4, 6), 16)
    if (!isNaN(r) && !isNaN(g) && !isNaN(b)) return [r, g, b]
  }
  if (cleaned.length === 3) {
    const r = parseInt(cleaned[0] + cleaned[0], 16)
    const g = parseInt(cleaned[1] + cleaned[1], 16)
    const b = parseInt(cleaned[2] + cleaned[2], 16)
    if (!isNaN(r) && !isNaN(g) && !isNaN(b)) return [r, g, b]
  }
  const CSS_NAMES: Record<string, string> = {
    white: '#ffffff',
    black: '#000000',
    red: '#ff0000',
    green: '#008000',
    blue: '#0000ff',
    yellow: '#ffff00',
    gray: '#808080',
    grey: '#808080',
  }
  const lower = hex.toLowerCase()
  if (CSS_NAMES[lower]) return hexToRgb(CSS_NAMES[lower])
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
  const fgRgb = hexToRgb(fg)
  const bgRgb = hexToRgb(bg)
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

export function adjustForContrast(fg: string, bg: string): string {
  const fgRgb = hexToRgb(fg)
  const bgRgb = hexToRgb(bg)
  if (!fgRgb || !bgRgb) return fg

  const lBg = relativeLuminance(...bgRgb)
  const initialRatio = contrastRatio(relativeLuminance(...fgRgb), lBg)
  if (initialRatio >= 4.5) return rgbToHex(...fgRgb)

  let [h, s, l] = rgbToHsl(...fgRgb)

  // Darken iteratively in steps of 5%
  let bestRatio = initialRatio
  let bestL = l
  let currentL = l

  while (currentL > 0) {
    currentL = Math.max(0, currentL - 0.05)
    const rgb = hslToRgb(h, s, currentL)
    const ratio = contrastRatio(relativeLuminance(...rgb), lBg)
    if (ratio > bestRatio) {
      bestRatio = ratio
      bestL = currentL
    }
    if (ratio >= 4.5) {
      return rgbToHex(...hslToRgb(h, s, currentL))
    }
  }

  // Couldn't reach 4.5 by darkening — try white vs black
  const whiteRatio = contrastRatio(1, lBg)
  const blackRatio = contrastRatio(0, lBg)
  if (whiteRatio >= blackRatio) return '#ffffff'
  return '#000000'
}
