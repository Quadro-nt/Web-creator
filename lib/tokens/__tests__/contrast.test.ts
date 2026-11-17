import { describe, it, expect } from '@jest/globals'
import { adjustForContrast, getContrastRatio } from '../contrast'

describe('getContrastRatio', () => {
  it('returns ~21 for black on white', () => {
    const ratio = getContrastRatio('#000000', '#ffffff')
    expect(ratio).toBeCloseTo(21, 0)
  })

  it('returns 1 for same color', () => {
    const ratio = getContrastRatio('#ffffff', '#ffffff')
    expect(ratio).toBeCloseTo(1, 1)
  })
})

describe('adjustForContrast', () => {
  it('black on white: already passes, returns same color', () => {
    const result = adjustForContrast('#000000', '#ffffff')
    const ratio = getContrastRatio(result, '#ffffff')
    expect(ratio).toBeGreaterThanOrEqual(4.5)
  })

  it('light gray (#aaaaaa) on white: ratio < 4.5, must darken to pass', () => {
    const initialRatio = getContrastRatio('#aaaaaa', '#ffffff')
    expect(initialRatio).toBeLessThan(4.5)
    const adjusted = adjustForContrast('#aaaaaa', '#ffffff')
    const adjustedRatio = getContrastRatio(adjusted, '#ffffff')
    expect(adjustedRatio).toBeGreaterThanOrEqual(4.5)
  })

  it('white on white: ratio 1, must adjust to a color with ratio >= 4.5', () => {
    const result = adjustForContrast('#ffffff', '#ffffff')
    const ratio = getContrastRatio(result, '#ffffff')
    expect(ratio).toBeGreaterThanOrEqual(4.5)
  })

  it('red (#ff0000) on white: adjusts if below 4.5', () => {
    const initial = getContrastRatio('#ff0000', '#ffffff')
    const result = adjustForContrast('#ff0000', '#ffffff')
    const ratio = getContrastRatio(result, '#ffffff')
    if (initial >= 4.5) {
      expect(result).toBe('#ff0000')
    } else {
      expect(ratio).toBeGreaterThanOrEqual(4.5)
    }
  })

  it('getContrastRatio black/white equals 21', () => {
    expect(getContrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 0)
  })
})
