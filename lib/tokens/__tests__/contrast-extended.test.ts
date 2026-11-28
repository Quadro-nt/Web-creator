import { describe, it, expect } from '@jest/globals'
import { adjustForContrast, getContrastRatio, pickReadableOnColor } from '../contrast'

describe('getContrastRatio — extended', () => {
  it('black on white returns exactly 21 (±0.1)', () => {
    const ratio = getContrastRatio('#000000', '#ffffff')
    expect(ratio).toBeCloseTo(21, 0)
  })

  it('white on white returns 1', () => {
    const ratio = getContrastRatio('#ffffff', '#ffffff')
    expect(ratio).toBeCloseTo(1, 1)
  })

  it('parses shorthand hex, rgb(), and CSS names consistently', () => {
    expect(getContrastRatio('#111', '#fff')).toBeCloseTo(getContrastRatio('#111111', '#ffffff'), 2)
    expect(getContrastRatio('rgb(17, 17, 17)', 'white')).toBeCloseTo(
      getContrastRatio('#111111', '#ffffff'),
      2
    )
  })
})

describe('adjustForContrast — extended', () => {
  it('black on white: ratio is 21, no adjustment needed, returns black', () => {
    const result = adjustForContrast('#000000', '#ffffff')
    const ratio = getContrastRatio(result, '#ffffff')
    expect(ratio).toBeGreaterThanOrEqual(4.5)
  })

  it('white on white: ratio 1, adjusts to a color with ratio >= 4.5', () => {
    const result = adjustForContrast('#ffffff', '#ffffff')
    const ratio = getContrastRatio(result, '#ffffff')
    expect(ratio).toBeGreaterThanOrEqual(4.5)
  })

  it('mid-gray #808080 on white: initial ratio < 4.5, adjusted result >= 4.5', () => {
    const initial = getContrastRatio('#808080', '#ffffff')
    expect(initial).toBeLessThan(4.5)
    const adjusted = adjustForContrast('#808080', '#ffffff')
    const adjustedRatio = getContrastRatio(adjusted, '#ffffff')
    expect(adjustedRatio).toBeGreaterThanOrEqual(4.5)
  })

  it('red #ff0000 on white: adjusted result meets >= 4.5', () => {
    const result = adjustForContrast('#ff0000', '#ffffff')
    const ratio = getContrastRatio(result, '#ffffff')
    expect(ratio).toBeGreaterThanOrEqual(4.5)
  })

  it('yellow #ffff00 on white: very low ratio, adjusts to >= 4.5', () => {
    const initial = getContrastRatio('#ffff00', '#ffffff')
    expect(initial).toBeLessThan(4.5)
    const adjusted = adjustForContrast('#ffff00', '#ffffff')
    const adjustedRatio = getContrastRatio(adjusted, '#ffffff')
    expect(adjustedRatio).toBeGreaterThanOrEqual(4.5)
  })

  it('colors already meeting 4.5 threshold return a color that still meets threshold', () => {
    const colors = ['#000000', '#1a1a1a', '#333333']
    for (const color of colors) {
      const initial = getContrastRatio(color, '#ffffff')
      expect(initial).toBeGreaterThanOrEqual(4.5)
      const result = adjustForContrast(color, '#ffffff')
      const resultRatio = getContrastRatio(result, '#ffffff')
      expect(resultRatio).toBeGreaterThanOrEqual(4.5)
    }
  })

  it('lightens mid/dark colors on dark backgrounds (#111111, #0a0a0a) preserving hue instead of jumping to pure white', () => {
    const cases: Array<{ fg: string; bg: string }> = [
      { fg: '#6b4423', bg: '#111111' },
      { fg: '#123456', bg: '#0a0a0a' },
      { fg: '#0000ff', bg: '#0a0a0a' },
      { fg: '#444444', bg: '#111111' },
    ]
    for (const { fg, bg } of cases) {
      expect(getContrastRatio(fg, bg)).toBeLessThan(4.5)
      const adjusted = adjustForContrast(fg, bg)
      expect(adjusted.toLowerCase()).not.toBe('#ffffff')
      expect(getContrastRatio(adjusted, bg)).toBeGreaterThanOrEqual(4.5)
    }
  })

  it('getContrastRatio black/white equals 21 (±0.1)', () => {
    expect(getContrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 0)
  })
})

describe('pickReadableOnColor — extended', () => {
  it('picks #111111 for #c47a3a and #b86b35 so contrast meets WCAG AA (>= 4.5)', () => {
    const c1 = pickReadableOnColor('#c47a3a')
    expect(c1).toBe('#111111')
    expect(getContrastRatio(c1, '#c47a3a')).toBeGreaterThanOrEqual(4.5)

    const c2 = pickReadableOnColor('#b86b35')
    expect(c2).toBe('#111111')
    expect(getContrastRatio(c2, '#b86b35')).toBeGreaterThanOrEqual(4.5)
  })

  it('picks #ffffff for dark terracotta #9a5220 and guarantees >= 4.5 contrast', () => {
    const c = pickReadableOnColor('#9a5220')
    expect(c).toBe('#ffffff')
    expect(getContrastRatio(c, '#9a5220')).toBeGreaterThanOrEqual(4.5)
  })
})
