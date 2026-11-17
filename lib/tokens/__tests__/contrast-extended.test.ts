import { describe, it, expect } from '@jest/globals'
import { adjustForContrast, getContrastRatio } from '../contrast'

describe('getContrastRatio — extended', () => {
  it('black on white returns exactly 21 (±0.1)', () => {
    const ratio = getContrastRatio('#000000', '#ffffff')
    expect(ratio).toBeCloseTo(21, 0)
  })

  it('white on white returns 1', () => {
    const ratio = getContrastRatio('#ffffff', '#ffffff')
    expect(ratio).toBeCloseTo(1, 1)
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

  it('getContrastRatio black/white equals 21 (±0.1)', () => {
    expect(getContrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 0)
  })
})
