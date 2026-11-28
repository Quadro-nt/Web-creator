import { describe, it, expect } from '@jest/globals'
import { resolveSiteHref } from '../resolve-href'

describe('resolveSiteHref', () => {
  it('prepends /sites/<slug> for internal root path', () => {
    expect(resolveSiteHref('/', 'luna-vega')).toBe('/sites/luna-vega')
  })
  it('prepends /sites/<slug> for internal page path', () => {
    expect(resolveSiteHref('/exhibitions', 'luna-vega')).toBe('/sites/luna-vega/exhibitions')
  })
  it('prepends /sites/<slug> for artwork detail paths', () => {
    expect(resolveSiteHref('/obras/formas-01', 'luna-vega')).toBe('/sites/luna-vega/obras/formas-01')
  })
  it('does not double-prefix paths already scoped under /sites/', () => {
    expect(resolveSiteHref('/sites/luna-vega/obras/formas-01', 'luna-vega')).toBe('/sites/luna-vega/obras/formas-01')
  })
  it('does not rewrite protocol-relative paths', () => {
    expect(resolveSiteHref('//evil.com', 'luna-vega')).toBe('//evil.com')
  })
  it('passes through https URLs', () => {
    expect(resolveSiteHref('https://example.com', 'luna-vega')).toBe('https://example.com')
  })
  it('passes through http URLs', () => {
    expect(resolveSiteHref('http://example.com', 'luna-vega')).toBe('http://example.com')
  })
  it('passes through mailto', () => {
    expect(resolveSiteHref('mailto:a@b.com', 'luna-vega')).toBe('mailto:a@b.com')
  })
  it('passes through tel', () => {
    expect(resolveSiteHref('tel:+5491112345678', 'luna-vega')).toBe('tel:+5491112345678')
  })
  it('passes through anchors', () => {
    expect(resolveSiteHref('#artworks', 'luna-vega')).toBe('#artworks')
  })
  it('returns raw href for malformed input (caller decides)', () => {
    expect(resolveSiteHref('', 'luna-vega')).toBe('')
    expect(resolveSiteHref('javascript:x', 'luna-vega')).toBe('javascript:x')
  })
})
