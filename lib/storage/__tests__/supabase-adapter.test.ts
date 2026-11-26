/**
 * @jest-environment node
 */
import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals'
import type { SupabaseClient } from '@supabase/supabase-js'
import { defaultSiteConfig, normalizeSiteConfig, type SiteConfig } from '@/lib/schemas/site-config.schema'

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

  const updateEq = jest.fn<() => Promise<{ error: { message: string } | null }>>()
  const update = jest.fn(() => ({ eq: updateEq }))

  const from = jest.fn(() => ({ select, update }))

  return {
    client: { from } as unknown as SupabaseClient,
    from,
    select,
    selectEq,
    maybeSingle,
    update,
    updateEq,
  }
}

describe('createSupabaseStorageAdapter', () => {
  const slug = 'luna-vega'
  const sampleConfig: SiteConfig = normalizeSiteConfig({
    ...defaultSiteConfig,
    identity: { siteTitle: 'Luna Vega Studio' },
  }) as SiteConfig

  it('getPublished returns config_published when row exists', async () => {
    const { createSupabaseStorageAdapter } = await import('@/lib/storage/supabase-adapter')
    const mock = createMockSupabaseClient()
    mock.maybeSingle.mockResolvedValue({ data: { config_published: sampleConfig }, error: null })

    const adapter = createSupabaseStorageAdapter(mock.client)
    const result = await adapter.getPublished(slug)

    expect(result).toEqual(sampleConfig)
    expect(mock.from).toHaveBeenCalledWith('artists')
    expect(mock.select).toHaveBeenCalledWith('config_published')
    expect(mock.selectEq).toHaveBeenCalledWith('slug', slug)
  })

  it('getPublished returns null when row does not exist or config_published is null', async () => {
    const { createSupabaseStorageAdapter } = await import('@/lib/storage/supabase-adapter')
    const mock = createMockSupabaseClient()
    mock.maybeSingle.mockResolvedValueOnce({ data: null, error: null })
    mock.maybeSingle.mockResolvedValueOnce({ data: { config_published: null }, error: null })

    const adapter = createSupabaseStorageAdapter(mock.client)
    expect(await adapter.getPublished(slug)).toBeNull()
    expect(await adapter.getPublished(slug)).toBeNull()
  })

  it('getPublished returns null without querying Supabase for invalid slug', async () => {
    const { createSupabaseStorageAdapter } = await import('@/lib/storage/supabase-adapter')
    const mock = createMockSupabaseClient()
    const adapter = createSupabaseStorageAdapter(mock.client)

    expect(await adapter.getPublished('../evil')).toBeNull()
    expect(await adapter.getPublished('')).toBeNull()
    expect(await adapter.getPublished('Invalid_Slug')).toBeNull()
    expect(mock.from).not.toHaveBeenCalled()
  })

  it('getPublished throws descriptive error when Supabase fails', async () => {
    const { createSupabaseStorageAdapter } = await import('@/lib/storage/supabase-adapter')
    const mock = createMockSupabaseClient()
    mock.maybeSingle.mockResolvedValue({ data: null, error: { message: 'connection refused' } })

    const adapter = createSupabaseStorageAdapter(mock.client)
    await expect(adapter.getPublished(slug)).rejects.toThrow('connection refused')
  })

  it('getDraft returns config_draft when row exists', async () => {
    const { createSupabaseStorageAdapter } = await import('@/lib/storage/supabase-adapter')
    const mock = createMockSupabaseClient()
    mock.maybeSingle.mockResolvedValue({ data: { config_draft: sampleConfig }, error: null })

    const adapter = createSupabaseStorageAdapter(mock.client)
    const result = await adapter.getDraft(slug)

    expect(result).toEqual(sampleConfig)
    expect(mock.from).toHaveBeenCalledWith('artists')
    expect(mock.select).toHaveBeenCalledWith('config_draft')
    expect(mock.selectEq).toHaveBeenCalledWith('slug', slug)
  })

  it('getDraft returns null when draft is missing or slug is invalid', async () => {
    const { createSupabaseStorageAdapter } = await import('@/lib/storage/supabase-adapter')
    const mock = createMockSupabaseClient()
    mock.maybeSingle.mockResolvedValue({ data: { config_draft: null }, error: null })

    const adapter = createSupabaseStorageAdapter(mock.client)
    expect(await adapter.getDraft(slug)).toBeNull()
    expect(await adapter.getDraft('../bad')).toBeNull()
    expect(mock.from).toHaveBeenCalledTimes(1)
  })

  it('saveDraft updates config_draft and updated_at for valid slug', async () => {
    const { createSupabaseStorageAdapter } = await import('@/lib/storage/supabase-adapter')
    const mock = createMockSupabaseClient()
    mock.updateEq.mockResolvedValue({ error: null })

    const adapter = createSupabaseStorageAdapter(mock.client)
    await adapter.saveDraft(slug, sampleConfig)

    expect(mock.from).toHaveBeenCalledWith('artists')
    expect(mock.update).toHaveBeenCalledWith({
      config_draft: sampleConfig,
      updated_at: expect.any(String),
    })
    expect(mock.updateEq).toHaveBeenCalledWith('slug', slug)
  })

  it('saveDraft throws on invalid slug and on Supabase error', async () => {
    const { createSupabaseStorageAdapter } = await import('@/lib/storage/supabase-adapter')
    const mock = createMockSupabaseClient()
    mock.updateEq.mockResolvedValue({ error: { message: 'write failed' } })

    const adapter = createSupabaseStorageAdapter(mock.client)
    await expect(adapter.saveDraft('../bad', sampleConfig)).rejects.toThrow('Slug de artista inválido')
    expect(mock.from).not.toHaveBeenCalled()

    await expect(adapter.saveDraft(slug, sampleConfig)).rejects.toThrow('write failed')
  })

  it('discardDraft sets config_draft to null and updates updated_at', async () => {
    const { createSupabaseStorageAdapter } = await import('@/lib/storage/supabase-adapter')
    const mock = createMockSupabaseClient()
    mock.updateEq.mockResolvedValue({ error: null })

    const adapter = createSupabaseStorageAdapter(mock.client)
    await adapter.discardDraft(slug)

    expect(mock.from).toHaveBeenCalledWith('artists')
    expect(mock.update).toHaveBeenCalledWith({
      config_draft: null,
      updated_at: expect.any(String),
    })
    expect(mock.updateEq).toHaveBeenCalledWith('slug', slug)
  })

  it('discardDraft throws on invalid slug and on Supabase error', async () => {
    const { createSupabaseStorageAdapter } = await import('@/lib/storage/supabase-adapter')
    const mock = createMockSupabaseClient()
    mock.updateEq.mockResolvedValue({ error: { message: 'discard failed' } })

    const adapter = createSupabaseStorageAdapter(mock.client)
    await expect(adapter.discardDraft('bad/slug')).rejects.toThrow('Slug de artista inválido')
    expect(mock.from).not.toHaveBeenCalled()

    await expect(adapter.discardDraft(slug)).rejects.toThrow('discard failed')
  })

  it('publish reads draft and promotes it to config_published while clearing config_draft', async () => {
    const { createSupabaseStorageAdapter } = await import('@/lib/storage/supabase-adapter')
    const mock = createMockSupabaseClient()
    mock.maybeSingle.mockResolvedValue({ data: { config_draft: sampleConfig }, error: null })
    mock.updateEq.mockResolvedValue({ error: null })

    const adapter = createSupabaseStorageAdapter(mock.client)
    await adapter.publish(slug)

    expect(mock.select).toHaveBeenCalledWith('config_draft')
    expect(mock.selectEq).toHaveBeenCalledWith('slug', slug)
    expect(mock.update).toHaveBeenCalledWith({
      config_published: sampleConfig,
      config_draft: null,
      updated_at: expect.any(String),
    })
    expect(mock.updateEq).toHaveBeenCalledWith('slug', slug)
  })

  it('publish throws "No hay borrador para publicar" when draft is null or artist missing', async () => {
    const { createSupabaseStorageAdapter } = await import('@/lib/storage/supabase-adapter')
    const mock = createMockSupabaseClient()
    mock.maybeSingle.mockResolvedValueOnce({ data: { config_draft: null }, error: null })
    mock.maybeSingle.mockResolvedValueOnce({ data: null, error: null })

    const adapter = createSupabaseStorageAdapter(mock.client)
    await expect(adapter.publish(slug)).rejects.toThrow('No hay borrador para publicar')
    await expect(adapter.publish(slug)).rejects.toThrow('No hay borrador para publicar')
    expect(mock.update).not.toHaveBeenCalled()
  })

  it('publish throws on invalid slug and on Supabase read/update errors', async () => {
    const { createSupabaseStorageAdapter } = await import('@/lib/storage/supabase-adapter')
    const mock = createMockSupabaseClient()
    const adapter = createSupabaseStorageAdapter(mock.client)

    await expect(adapter.publish('../bad')).rejects.toThrow('Slug de artista inválido')
    expect(mock.from).not.toHaveBeenCalled()

    mock.maybeSingle.mockResolvedValueOnce({ data: null, error: { message: 'read err' } })
    await expect(adapter.publish(slug)).rejects.toThrow('read err')

    mock.maybeSingle.mockResolvedValueOnce({ data: { config_draft: sampleConfig }, error: null })
    mock.updateEq.mockResolvedValueOnce({ error: { message: 'update err' } })
    await expect(adapter.publish(slug)).rejects.toThrow('update err')
  })

  it('getPublished normalizes old-shape sections[] into pages[]', async () => {
    const { createSupabaseStorageAdapter } = await import('@/lib/storage/supabase-adapter')
    const oldShape = {
      template: 'minimal-gallery',
      sections: [{ id: 'cover', type: 'cover', variant: 'fullscreen', visible: true, content: {} }],
      identity: { siteTitle: 'Luna Vega' },
    }
    const mock = createMockSupabaseClient()
    mock.maybeSingle.mockResolvedValue({ data: { config_published: oldShape }, error: null })

    const adapter = createSupabaseStorageAdapter(mock.client)
    const config = await adapter.getPublished(slug)

    expect(config).not.toBeNull()
    expect((config as any).pages).toHaveLength(1)
    expect((config as any).pages[0].isHome).toBe(true)
    expect((config as any).pages[0].title).toBe('Luna Vega')
  })

  it('getDraft normalizes old-shape sections[] into pages[]', async () => {
    const { createSupabaseStorageAdapter } = await import('@/lib/storage/supabase-adapter')
    const oldShape = { template: 'editorial', sections: [], identity: { siteTitle: 'Marco' } }
    const mock = createMockSupabaseClient()
    mock.maybeSingle.mockResolvedValue({ data: { config_draft: oldShape }, error: null })

    const adapter = createSupabaseStorageAdapter(mock.client)
    const config = await adapter.getDraft(slug)

    expect((config as any).pages).toHaveLength(1)
  })
})

describe('getStorageAdapter factory', () => {
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

  it('returns file adapter when STORAGE_BACKEND is not cloud', async () => {
    const { getStorageAdapter } = await import('@/lib/storage')
    process.env.STORAGE_BACKEND = 'file'

    const adapter = getStorageAdapter()
    const result = await adapter.getPublished('nonexistent-artist-for-factory-test')

    expect(result).toBeNull()
    expect(mockGetSupabaseAdminClient).not.toHaveBeenCalled()
  })

  it('returns supabase adapter when STORAGE_BACKEND is cloud', async () => {
    const { getStorageAdapter } = await import('@/lib/storage')
    process.env.STORAGE_BACKEND = 'cloud'
    const mock = createMockSupabaseClient()
    const normalizedConfig = normalizeSiteConfig(defaultSiteConfig) as SiteConfig
    mock.maybeSingle.mockResolvedValue({ data: { config_published: defaultSiteConfig }, error: null })
    mockGetSupabaseAdminClient.mockReturnValue(mock.client)

    const adapter = getStorageAdapter()
    const result = await adapter.getPublished('luna-vega')

    expect(mockGetSupabaseAdminClient).toHaveBeenCalledTimes(1)
    expect(mock.from).toHaveBeenCalledWith('artists')
    expect(result).toEqual(normalizedConfig)
  })
})
