import { describe, it, expect, beforeEach, afterEach } from '@jest/globals'
import { mkdtemp, mkdir, writeFile, rm } from 'fs/promises'
import { tmpdir } from 'os'
import path from 'path'
import { createFileAdapter } from '../file-adapter'

describe('file-adapter normalizeSiteConfig integration', () => {
  let tmpRoot: string
  let originalCwd: string

  beforeEach(async () => {
    tmpRoot = await mkdtemp(path.join(tmpdir(), 'qs-file-adapter-'))
    originalCwd = process.cwd()
    process.chdir(tmpRoot)
    await mkdir(path.join(tmpRoot, 'data', 'artists', 'test-artist'), { recursive: true })
  })

  afterEach(async () => {
    process.chdir(originalCwd)
    await rm(tmpRoot, { recursive: true, force: true })
  })

  it('getPublished returns pages[] when JSON has old-shape sections[] at root', async () => {
    const oldShape = {
      template: 'minimal-gallery',
      styleTokens: { background: '#fff', text: '#111', accent: '#c00', fontPair: 'fraunces-nunito', spacing: 'normal', artworkTreatment: 'margin' },
      button: { shape: 'rounded', style: 'filled', buyText: 'Consultar' },
      sizes: { typeScale: 'medium', artworkSize: 'medium', columns: '3', contentWidth: 'mid' },
      animations: { scrollReveal: 'soft', hoverEffect: 'info', pageTransition: 'fade' },
      navigation: { type: 'top', sticky: true },
      sections: [{ id: 'cover', type: 'cover', variant: 'fullscreen', visible: true, content: {} }],
      identity: { siteTitle: 'Luna Vega' },
    }
    await writeFile(
      path.join(tmpRoot, 'data', 'artists', 'test-artist', 'config.published.json'),
      JSON.stringify(oldShape),
      'utf-8'
    )

    const adapter = createFileAdapter()
    const config = await adapter.getPublished('test-artist')
    expect(config).not.toBeNull()
    expect((config as any).pages).toBeDefined()
    expect((config as any).pages).toHaveLength(1)
    expect((config as any).pages[0].isHome).toBe(true)
    expect((config as any).pages[0].title).toBe('Luna Vega')
    expect((config as any).pages[0].sections).toHaveLength(1)
  })

  it('getDraft returns pages[] when draft JSON has old-shape sections[]', async () => {
    const oldShape = {
      template: 'editorial',
      styleTokens: { background: '#fff', text: '#111', accent: '#c00', fontPair: 'playfair-raleway', spacing: 'normal', artworkTreatment: 'margin' },
      button: { shape: 'square', style: 'filled', buyText: 'Consultar' },
      sizes: { typeScale: 'medium', artworkSize: 'medium', columns: '3', contentWidth: 'mid' },
      animations: { scrollReveal: 'soft', hoverEffect: 'info', pageTransition: 'fade' },
      navigation: { type: 'top', sticky: true },
      sections: [],
      identity: { siteTitle: 'Marco' },
    }
    await writeFile(
      path.join(tmpRoot, 'data', 'artists', 'test-artist', 'config.draft.json'),
      JSON.stringify(oldShape),
      'utf-8'
    )

    const adapter = createFileAdapter()
    const config = await adapter.getDraft('test-artist')
    expect((config as any).pages[0].isHome).toBe(true)
  })

  it('getPublished returns null when file missing', async () => {
    const adapter = createFileAdapter()
    expect(await adapter.getPublished('test-artist')).toBeNull()
  })
})
