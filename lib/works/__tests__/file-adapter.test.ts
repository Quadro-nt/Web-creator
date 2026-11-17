/**
 * @jest-environment node
 */
import { describe, it, expect, beforeAll, afterAll } from '@jest/globals'
import { mkdir, writeFile, rm } from 'fs/promises'
import path from 'path'
import { createFileWorksAdapter } from '@/lib/works/file-adapter'

const FIXTURE_ARTIST = 'test-artist'
const FIXTURE_DIR = path.join(process.cwd(), 'data', 'artists', FIXTURE_ARTIST)
const FIXTURE_PATH = path.join(FIXTURE_DIR, 'works.json')

const validWorks = {
  artistSlug: FIXTURE_ARTIST,
  works: [
    {
      slug: 'obra-1',
      title: 'Primera obra',
      year: 2022,
      medium: 'oleo sobre lienzo',
      dimensions: '80 x 100 cm',
      images: ['https://example.com/obra-1.jpg'],
      tags: [],
    },
    {
      slug: 'obra-2',
      title: 'Segunda obra',
      year: 2023,
      medium: 'acuarela',
      dimensions: '50 x 70 cm',
      images: ['https://example.com/obra-2.jpg'],
      tags: ['abstracto'],
    },
  ],
}

beforeAll(async () => {
  await mkdir(FIXTURE_DIR, { recursive: true })
  await writeFile(FIXTURE_PATH, JSON.stringify(validWorks), 'utf-8')
})

afterAll(async () => {
  await rm(FIXTURE_DIR, { recursive: true, force: true })
})

describe('createFileWorksAdapter', () => {
  const adapter = createFileWorksAdapter()

  it('getWorks returns all works for a valid artist', async () => {
    const works = await adapter.getWorks(FIXTURE_ARTIST)
    expect(works).toHaveLength(2)
  })

  it('getWork returns the correct work by slug', async () => {
    const work = await adapter.getWork(FIXTURE_ARTIST, 'obra-1')
    expect(work).not.toBeNull()
    expect(work?.title).toBe('Primera obra')
  })

  it('getWork returns null for a nonexistent slug', async () => {
    const work = await adapter.getWork(FIXTURE_ARTIST, 'no-existe')
    expect(work).toBeNull()
  })

  it('getWorks returns empty array when artist directory does not exist', async () => {
    const works = await adapter.getWorks('artista-inexistente')
    expect(works).toEqual([])
  })

  it('getWorks throws validation error for invalid works.json', async () => {
    const invalidDir = path.join(process.cwd(), 'data', 'artists', 'invalid-artist')
    const invalidPath = path.join(invalidDir, 'works.json')
    await mkdir(invalidDir, { recursive: true })
    await writeFile(
      invalidPath,
      JSON.stringify({
        artistSlug: 'invalid-artist',
        works: [{ slug: 'obra-sin-titulo', year: 2022, medium: 'oleo', dimensions: '50x70', images: ['https://example.com/img.jpg'] }],
      }),
      'utf-8',
    )
    await expect(adapter.getWorks('invalid-artist')).rejects.toThrow()
    await rm(invalidDir, { recursive: true, force: true })
  })
})
