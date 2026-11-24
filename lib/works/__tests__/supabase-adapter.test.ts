/**
 * @jest-environment node
 */
import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Artwork } from '@/lib/schemas/works.schema'

const mockGetSupabaseAdminClient = jest.fn<() => SupabaseClient>()

jest.mock('@/lib/cloud/supabase-client', () => {
  const actual = jest.requireActual<typeof import('@/lib/cloud/supabase-client')>(
    '@/lib/cloud/supabase-client',
  )
  return {
    ...actual,
    getSupabaseAdminClient: mockGetSupabaseAdminClient,
  }
})

function createMockSupabaseClient() {
  const maybeSingle = jest.fn<() => Promise<{ data: unknown; error: { message: string } | null }>>()
  const selectEq = jest.fn(() => ({ maybeSingle }))
  const select = jest.fn(() => ({ eq: selectEq }))

  const upsert = jest.fn<() => Promise<{ error: { message: string } | null }>>()

  const from = jest.fn(() => ({ select, upsert }))

  return {
    client: { from } as unknown as SupabaseClient,
    from,
    select,
    selectEq,
    maybeSingle,
    upsert,
  }
}

const sampleWorks: Artwork[] = [
  {
    slug: 'obra-1',
    title: 'Primera obra',
    year: 2023,
    medium: 'Óleo sobre lienzo',
    dimensions: '80 x 100 cm',
    currency: 'PEN',
    sold: false,
    images: ['https://example.com/obra-1.jpg'],
    tags: ['oleo'],
  },
  {
    slug: 'obra-2',
    title: 'Segunda obra',
    year: 2024,
    medium: 'Acuarela',
    dimensions: '50 x 70 cm',
    price: 1200,
    currency: 'USD',
    sold: true,
    images: ['/uploads/luna-vega/obra-2.jpg'],
    tags: [],
  },
]

describe('createSupabaseWorksAdapter', () => {
  const artistSlug = 'luna-vega'

  it('getWorks returns validated artworks when row exists', async () => {
    const { createSupabaseWorksAdapter } = await import('@/lib/works/supabase-adapter')
    const mock = createMockSupabaseClient()
    mock.maybeSingle.mockResolvedValue({
      data: {
        items: [
          {
            slug: 'obra-1',
            title: 'Primera obra',
            year: 2023,
            medium: 'Óleo sobre lienzo',
            dimensions: '80 x 100 cm',
            images: ['https://example.com/obra-1.jpg'],
          },
        ],
      },
      error: null,
    })

    const adapter = createSupabaseWorksAdapter(mock.client)
    const works = await adapter.getWorks(artistSlug)

    expect(mock.from).toHaveBeenCalledWith('works')
    expect(mock.select).toHaveBeenCalledWith('items')
    expect(mock.selectEq).toHaveBeenCalledWith('artist_slug', artistSlug)
    expect(works).toEqual([
      {
        slug: 'obra-1',
        title: 'Primera obra',
        year: 2023,
        medium: 'Óleo sobre lienzo',
        dimensions: '80 x 100 cm',
        currency: 'PEN',
        sold: false,
        images: ['https://example.com/obra-1.jpg'],
        tags: [],
      },
    ])
  })

  it('getWorks returns empty array when row does not exist', async () => {
    const { createSupabaseWorksAdapter } = await import('@/lib/works/supabase-adapter')
    const mock = createMockSupabaseClient()
    mock.maybeSingle.mockResolvedValue({ data: null, error: null })

    const adapter = createSupabaseWorksAdapter(mock.client)
    expect(await adapter.getWorks(artistSlug)).toEqual([])
  })

  it('getWorks returns empty array without querying Supabase for invalid artistSlug', async () => {
    const { createSupabaseWorksAdapter } = await import('@/lib/works/supabase-adapter')
    const mock = createMockSupabaseClient()
    const adapter = createSupabaseWorksAdapter(mock.client)

    expect(await adapter.getWorks('../evil')).toEqual([])
    expect(await adapter.getWorks('')).toEqual([])
    expect(await adapter.getWorks('Invalid_Slug')).toEqual([])
    expect(mock.from).not.toHaveBeenCalled()
  })

  it('getWorks throws Zod validation error if stored items are invalid', async () => {
    const { createSupabaseWorksAdapter } = await import('@/lib/works/supabase-adapter')
    const mock = createMockSupabaseClient()
    mock.maybeSingle.mockResolvedValue({
      data: {
        items: [{ slug: 'broken', year: 1800, medium: 'oleo', dimensions: '10x10', images: [] }],
      },
      error: null,
    })

    const adapter = createSupabaseWorksAdapter(mock.client)
    await expect(adapter.getWorks(artistSlug)).rejects.toThrow()
  })

  it('getWorks throws descriptive error when Supabase query fails', async () => {
    const { createSupabaseWorksAdapter } = await import('@/lib/works/supabase-adapter')
    const mock = createMockSupabaseClient()
    mock.maybeSingle.mockResolvedValue({ data: null, error: { message: 'db timeout' } })

    const adapter = createSupabaseWorksAdapter(mock.client)
    await expect(adapter.getWorks(artistSlug)).rejects.toThrow('db timeout')
  })

  it('getWork returns matching work by slug or null if absent', async () => {
    const { createSupabaseWorksAdapter } = await import('@/lib/works/supabase-adapter')
    const mock = createMockSupabaseClient()
    mock.maybeSingle.mockResolvedValue({ data: { items: sampleWorks }, error: null })

    const adapter = createSupabaseWorksAdapter(mock.client)
    const found = await adapter.getWork(artistSlug, 'obra-2')
    expect(found?.title).toBe('Segunda obra')

    const missing = await adapter.getWork(artistSlug, 'no-existe')
    expect(missing).toBeNull()

    const invalid = await adapter.getWork('../bad', 'obra-1')
    expect(invalid).toBeNull()
  })

  it('saveWorks validates with WorksFileSchema and upserts into works table', async () => {
    const { createSupabaseWorksAdapter } = await import('@/lib/works/supabase-adapter')
    const mock = createMockSupabaseClient()
    mock.upsert.mockResolvedValue({ error: null })

    const adapter = createSupabaseWorksAdapter(mock.client)
    await adapter.saveWorks(artistSlug, sampleWorks)

    expect(mock.from).toHaveBeenCalledWith('works')
    expect(mock.upsert).toHaveBeenCalledWith(
      {
        artist_slug: artistSlug,
        items: sampleWorks,
        updated_at: expect.any(String),
      },
      { onConflict: 'artist_slug' },
    )
  })

  it('saveWorks rejects on invalid artistSlug without calling Supabase', async () => {
    const { createSupabaseWorksAdapter } = await import('@/lib/works/supabase-adapter')
    const mock = createMockSupabaseClient()
    const adapter = createSupabaseWorksAdapter(mock.client)

    await expect(adapter.saveWorks('../evil', sampleWorks)).rejects.toThrow('Slug de artista inválido')
    expect(mock.from).not.toHaveBeenCalled()
  })

  it('saveWorks rejects on Zod validation error without calling Supabase', async () => {
    const { createSupabaseWorksAdapter } = await import('@/lib/works/supabase-adapter')
    const mock = createMockSupabaseClient()
    const adapter = createSupabaseWorksAdapter(mock.client)
    const invalidWorks = [
      {
        slug: '',
        title: 'Bad',
        year: 2024,
        medium: 'Oleo',
        dimensions: '50x50',
        currency: 'PEN',
        sold: false,
        images: ['javascript:alert(1)'],
        tags: [],
      },
    ] as Artwork[]

    await expect(adapter.saveWorks(artistSlug, invalidWorks)).rejects.toThrow()
    expect(mock.from).not.toHaveBeenCalled()
  })

  it('saveWorks throws descriptive error when Supabase upsert fails', async () => {
    const { createSupabaseWorksAdapter } = await import('@/lib/works/supabase-adapter')
    const mock = createMockSupabaseClient()
    mock.upsert.mockResolvedValue({ error: { message: 'fk violation' } })

    const adapter = createSupabaseWorksAdapter(mock.client)
    await expect(adapter.saveWorks(artistSlug, sampleWorks)).rejects.toThrow('fk violation')
  })
})

describe('getWorksRepository factory', () => {
  const originalBackend = process.env.STORAGE_BACKEND

  beforeEach(() => {
    delete process.env.STORAGE_BACKEND
    mockGetSupabaseAdminClient.mockReset()
  })

  afterEach(() => {
    if (originalBackend === undefined) {
      delete process.env.STORAGE_BACKEND
    } else {
      process.env.STORAGE_BACKEND = originalBackend
    }
  })

  it('returns file repository when STORAGE_BACKEND is not cloud', async () => {
    const { getWorksRepository } = await import('@/lib/works/repository')
    process.env.STORAGE_BACKEND = 'file'

    const repo = getWorksRepository()
    const works = await repo.getWorks('nonexistent-artist-for-factory-test')

    expect(works).toEqual([])
    expect(mockGetSupabaseAdminClient).not.toHaveBeenCalled()
  })

  it('returns supabase repository when STORAGE_BACKEND is cloud', async () => {
    const { getWorksRepository } = await import('@/lib/works/repository')
    process.env.STORAGE_BACKEND = 'cloud'
    const mock = createMockSupabaseClient()
    mock.maybeSingle.mockResolvedValue({ data: { items: sampleWorks }, error: null })
    mockGetSupabaseAdminClient.mockReturnValue(mock.client)

    const repo = getWorksRepository()
    const works = await repo.getWorks('luna-vega')

    expect(mockGetSupabaseAdminClient).toHaveBeenCalledTimes(1)
    expect(mock.from).toHaveBeenCalledWith('works')
    expect(works).toEqual(sampleWorks)
  })
})
