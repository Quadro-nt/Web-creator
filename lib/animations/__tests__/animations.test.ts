import { describe, it, expect, beforeEach, jest } from '@jest/globals'
import { getScrollRevealClasses } from '../scroll-reveal'
import { getHoverClasses } from '../hover-effect'

describe('getScrollRevealClasses', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: (_query: string) => ({
        matches: false,
        media: _query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      }),
    })
  })

  it("'none' retorna cadena vacia", () => {
    expect(getScrollRevealClasses('none')).toBe('')
  })

  it("'soft' retorna cadena no vacia", () => {
    expect(getScrollRevealClasses('soft')).not.toBe('')
  })

  it("'bold' retorna cadena no vacia", () => {
    expect(getScrollRevealClasses('bold')).not.toBe('')
  })
})

describe('getHoverClasses', () => {
  it("'none' retorna { container: '' }", () => {
    expect(getHoverClasses('none')).toEqual({ container: '' })
  })

  it("'zoom' retorna objeto con clase de zoom en container", () => {
    const result = getHoverClasses('zoom')
    expect(result.container).not.toBe('')
    expect(result.container).toContain('zoom')
  })

  it("'info' retorna objeto con container e overlay", () => {
    const result = getHoverClasses('info')
    expect(result.container).not.toBe('')
    expect(result.overlay).toBeDefined()
  })
})

describe('prefers-reduced-motion', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: (query: string) => ({
        matches: query.includes('reduce'),
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      }),
    })
  })

  it("'bold' retorna '' cuando prefers-reduced-motion esta activo", () => {
    expect(getScrollRevealClasses('bold')).toBe('')
  })

  it("'soft' retorna '' cuando prefers-reduced-motion esta activo", () => {
    expect(getScrollRevealClasses('soft')).toBe('')
  })
})
