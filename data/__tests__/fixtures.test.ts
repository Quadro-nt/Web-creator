/**
 * @jest-environment node
 */
import { describe, it, expect } from '@jest/globals'
import { readFileSync } from 'fs'
import path from 'path'
import { WorksFileSchema } from '@/lib/schemas/works.schema'
import { SiteConfigSchema } from '@/lib/schemas/site-config.schema'

const ARTISTS = ['luna-vega', 'marco-torres', 'sofia-rios'] as const

function loadJson(slug: string, file: string): unknown {
  const full = path.join(process.cwd(), 'data', 'artists', slug, file)
  return JSON.parse(readFileSync(full, 'utf-8'))
}

describe.each(ARTISTS)('fixtures: %s', (slug) => {
  it('works.json cumple con WorksFileSchema', () => {
    const data = loadJson(slug, 'works.json')
    expect(() => WorksFileSchema.parse(data)).not.toThrow()
  })

  it('config.published.json cumple con SiteConfigSchema', () => {
    const data = loadJson(slug, 'config.published.json')
    expect(() => SiteConfigSchema.parse(data)).not.toThrow()
  })

  it('tiene exactamente 12 obras', () => {
    const data = WorksFileSchema.parse(loadJson(slug, 'works.json'))
    expect(data.works).toHaveLength(12)
  })

  it('tiene al menos una obra marcada como vendida', () => {
    const data = WorksFileSchema.parse(loadJson(slug, 'works.json'))
    expect(data.works.some((w) => w.sold === true)).toBe(true)
  })
})
