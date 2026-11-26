import { describe, it, expect } from '@jest/globals'
import { validateHref, hrefSchema } from '../href-schema'

describe('validateHref', () => {
  it('accepts root internal path', () => {
    expect(validateHref('/')).toBe(true)
  })
  it('accepts page-slug internal paths', () => {
    expect(validateHref('/exhibitions')).toBe(true)
    expect(validateHref('/serie-2024')).toBe(true)
  })
  it('accepts https URLs', () => {
    expect(validateHref('https://example.com/path')).toBe(true)
  })
  it('accepts http URLs', () => {
    expect(validateHref('http://example.com')).toBe(true)
  })
  it('accepts mailto', () => {
    expect(validateHref('mailto:hola@ejemplo.com')).toBe(true)
  })
  it('accepts tel', () => {
    expect(validateHref('tel:+5491112345678')).toBe(true)
  })
  it('accepts anchors', () => {
    expect(validateHref('#artworks')).toBe(true)
    expect(validateHref('#top_section-2')).toBe(true)
  })
  it('rejects javascript scheme', () => {
    expect(validateHref('javascript:alert(1)')).toBe(false)
  })
  it('rejects data scheme', () => {
    expect(validateHref('data:text/html,<script>')).toBe(false)
  })
  it('rejects vbscript scheme', () => {
    expect(validateHref('vbscript:msgbox')).toBe(false)
  })
  it('rejects mixed-case javascript scheme', () => {
    expect(validateHref('JavaScript:alert(1)')).toBe(false)
    expect(validateHref('JAVASCRIPT:alert(1)')).toBe(false)
    expect(validateHref('jAvAsCrIpT:alert(1)')).toBe(false)
  })
  it('rejects leading-whitespace bypass attempts', () => {
    expect(validateHref(' javascript:x')).toBe(false)
    expect(validateHref('\tjavascript:x')).toBe(false)
    expect(validateHref('\njavascript:x')).toBe(false)
  })
  it('rejects bare schemes with no content after colon', () => {
    expect(validateHref('https:')).toBe(false)
    expect(validateHref('mailto:')).toBe(false)
    expect(validateHref('tel:')).toBe(false)
  })
  it('rejects empty string', () => {
    expect(validateHref('')).toBe(false)
  })
  it('rejects uppercase in internal path', () => {
    expect(validateHref('/Exhibitions')).toBe(false)
  })
  it('rejects malformed URLs', () => {
    expect(validateHref('not a url')).toBe(false)
  })
})

describe('hrefSchema', () => {
  it('parses valid href', () => {
    expect(hrefSchema.parse('/exhibitions')).toBe('/exhibitions')
  })
  it('throws on invalid href', () => {
    expect(() => hrefSchema.parse('javascript:x')).toThrow()
  })
})
