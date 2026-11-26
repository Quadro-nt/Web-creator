import { afterAll, beforeEach, describe, expect, it, jest } from '@jest/globals'
import type { SupabaseClient } from '@supabase/supabase-js'

type AnyAsyncFn = (...args: unknown[]) => Promise<unknown>
type AnyFn = (...args: unknown[]) => unknown

const mockStorageClient = {
  storage: {
    from: jest.fn(),
  },
} as unknown as SupabaseClient

const mockGetSupabaseAdminClient = jest.fn<() => SupabaseClient>(() => mockStorageClient)

jest.mock('@/lib/cloud/supabase-client', () => ({
  getStorageBackend: () =>
    (process.env.STORAGE_BACKEND ?? '').toLowerCase() === 'cloud' ? 'cloud' : 'file',
  getSupabaseStorageBucket: () => process.env.SUPABASE_STORAGE_BUCKET || 'artist-media',
  getSupabaseAdminClient: () => mockGetSupabaseAdminClient(),
}))

function createMockSupabaseStorage(overrides?: {
  listResult?: { data: unknown[] | null; error: { message: string } | null }
  uploadResult?: { data?: unknown; error: { message: string } | null }
  getBucketResult?: { data: unknown | null; error: { message: string } | null }
  createBucketResult?: { data?: unknown; error: { message: string } | null }
}) {
  const listMock = jest.fn<AnyAsyncFn>().mockResolvedValue(
    overrides?.listResult ?? {
      data: [
        { name: '1700000000000-abcd-obra.png', metadata: { size: 1234 } },
        { name: '.emptyFolderPlaceholder', metadata: null },
        { name: 'notes.txt', metadata: { size: 40 } },
        { name: '1700000000001-efgh-foto.JPG', metadata: { size: 5678 } },
      ],
      error: null,
    }
  )

  const uploadMock = jest.fn<AnyAsyncFn>().mockResolvedValue(
    overrides?.uploadResult ?? { data: { path: 'uploaded' }, error: null }
  )

  const getPublicUrlMock = jest.fn<AnyFn>((objectPath: unknown) => ({
    data: {
      publicUrl: `https://example.supabase.co/storage/v1/object/public/artist-media/${String(objectPath)}`,
    },
  }))

  const fromMock = jest.fn<AnyFn>(() => ({
    list: listMock,
    upload: uploadMock,
    getPublicUrl: getPublicUrlMock,
  }))

  const getBucketMock = jest.fn<AnyAsyncFn>().mockResolvedValue(
    overrides?.getBucketResult ?? { data: { name: 'artist-media', public: true }, error: null }
  )

  const createBucketMock = jest.fn<AnyAsyncFn>().mockResolvedValue(
    overrides?.createBucketResult ?? { data: { name: 'artist-media' }, error: null }
  )

  const client = {
    storage: {
      from: fromMock,
      getBucket: getBucketMock,
      createBucket: createBucketMock,
    },
  } as unknown as SupabaseClient

  return {
    client,
    fromMock,
    listMock,
    uploadMock,
    getPublicUrlMock,
    getBucketMock,
    createBucketMock,
  }
}

const VALID_PNG_BUFFER = Buffer.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
])

describe('createSupabaseMediaAdapter', () => {
  const originalBackend = process.env.STORAGE_BACKEND
  const originalBucket = process.env.SUPABASE_STORAGE_BUCKET

  beforeEach(async () => {
    jest.clearAllMocks()
    delete process.env.STORAGE_BACKEND
    delete process.env.SUPABASE_STORAGE_BUCKET
    const { resetEnsuredBucketsForTests } = await import('../supabase-media-adapter')
    resetEnsuredBucketsForTests()
  })

  afterAll(() => {
    if (originalBackend === undefined) delete process.env.STORAGE_BACKEND
    else process.env.STORAGE_BACKEND = originalBackend

    if (originalBucket === undefined) delete process.env.SUPABASE_STORAGE_BUCKET
    else process.env.SUPABASE_STORAGE_BUCKET = originalBucket
  })

  it('lists valid image files from Supabase Storage sorted by created_at desc with public URLs', async () => {
    const { createSupabaseMediaAdapter } = await import('../supabase-media-adapter')
    const { client, fromMock, listMock, getPublicUrlMock } = createMockSupabaseStorage()
    const adapter = createSupabaseMediaAdapter({ client, bucket: 'custom-bucket' })

    const items = await adapter.list('luna-vega')

    expect(fromMock).toHaveBeenCalledWith('custom-bucket')
    expect(listMock).toHaveBeenCalledWith('luna-vega', {
      sortBy: { column: 'created_at', order: 'desc' },
    })
    expect(getPublicUrlMock).toHaveBeenCalledTimes(2)
    expect(items).toEqual([
      {
        url: 'https://example.supabase.co/storage/v1/object/public/artist-media/luna-vega/1700000000000-abcd-obra.png',
        filename: '1700000000000-abcd-obra.png',
        size: 1234,
      },
      {
        url: 'https://example.supabase.co/storage/v1/object/public/artist-media/luna-vega/1700000000001-efgh-foto.JPG',
        filename: '1700000000001-efgh-foto.JPG',
        size: 5678,
      },
    ])
  })

  it('throws when Supabase Storage list returns an error', async () => {
    const { createSupabaseMediaAdapter } = await import('../supabase-media-adapter')
    const { client } = createMockSupabaseStorage({
      listResult: { data: null, error: { message: 'Bucket not found' } },
    })
    const adapter = createSupabaseMediaAdapter({ client })

    await expect(adapter.list('luna-vega')).rejects.toThrow('Bucket not found')
  })

  it('saves a valid PNG buffer to Supabase Storage and returns public URL metadata', async () => {
    const { createSupabaseMediaAdapter } = await import('../supabase-media-adapter')
    const { client, fromMock, uploadMock } = createMockSupabaseStorage()
    const adapter = createSupabaseMediaAdapter({ client })

    const saved = await adapter.save('luna-vega', 'Mi Obra!.png', 'image/png', VALID_PNG_BUFFER)

    expect(fromMock).toHaveBeenCalledWith('artist-media')
    expect(saved.filename).toMatch(/^\d+-[a-z0-9]+-mi-obra\.png$/)
    expect(saved.size).toBe(VALID_PNG_BUFFER.byteLength)
    expect(saved.url).toBe(
      `https://example.supabase.co/storage/v1/object/public/artist-media/luna-vega/${saved.filename}`
    )
    expect(uploadMock).toHaveBeenCalledWith(
      `luna-vega/${saved.filename}`,
      VALID_PNG_BUFFER,
      { contentType: 'image/png', upsert: false }
    )
  })

  it('rejects files with invalid magic bytes for declared MIME type', async () => {
    const { createSupabaseMediaAdapter } = await import('../supabase-media-adapter')
    const { client, uploadMock } = createMockSupabaseStorage()
    const adapter = createSupabaseMediaAdapter({ client })

    const fakePng = Buffer.from('not-actually-a-png-file')
    await expect(
      adapter.save('luna-vega', 'fake.png', 'image/png', fakePng)
    ).rejects.toThrow('El contenido del archivo no corresponde a una imagen válida')
    expect(uploadMock).not.toHaveBeenCalled()
  })

  it('rejects empty buffers and files larger than 5 MB', async () => {
    const { MAX_MEDIA_SIZE_BYTES } = await import('../media-adapter')
    const { createSupabaseMediaAdapter } = await import('../supabase-media-adapter')
    const { client, uploadMock } = createMockSupabaseStorage()
    const adapter = createSupabaseMediaAdapter({ client })

    await expect(
      adapter.save('luna-vega', 'empty.png', 'image/png', Buffer.alloc(0))
    ).rejects.toThrow('El archivo está vacío')

    const oversized = Buffer.alloc(MAX_MEDIA_SIZE_BYTES + 1)
    VALID_PNG_BUFFER.copy(oversized, 0)
    await expect(
      adapter.save('luna-vega', 'huge.png', 'image/png', oversized)
    ).rejects.toThrow('La imagen supera el máximo de 5 MB')

    expect(uploadMock).not.toHaveBeenCalled()
  })

  it('rejects invalid artist slugs in list and save', async () => {
    const { createSupabaseMediaAdapter } = await import('../supabase-media-adapter')
    const { client, listMock, uploadMock } = createMockSupabaseStorage()
    const adapter = createSupabaseMediaAdapter({ client })

    await expect(adapter.list('../etc')).rejects.toThrow('Slug de artista inválido')
    await expect(
      adapter.save('Invalid_Slug', 'obra.png', 'image/png', VALID_PNG_BUFFER)
    ).rejects.toThrow('Slug de artista inválido')

    expect(listMock).not.toHaveBeenCalled()
    expect(uploadMock).not.toHaveBeenCalled()
  })

  it('auto-creates the bucket as public when getBucket returns "Bucket not found"', async () => {
    const { createSupabaseMediaAdapter } = await import('../supabase-media-adapter')
    const { client, getBucketMock, createBucketMock } = createMockSupabaseStorage({
      getBucketResult: { data: null, error: { message: 'Bucket not found' } },
    })
    const adapter = createSupabaseMediaAdapter({ client, bucket: 'artist-media' })

    await adapter.list('luna-vega')

    expect(getBucketMock).toHaveBeenCalledWith('artist-media')
    expect(createBucketMock).toHaveBeenCalledWith('artist-media', { public: true })
  })

  it('caches the ensured bucket so getBucket is called only once across multiple operations', async () => {
    const { createSupabaseMediaAdapter } = await import('../supabase-media-adapter')
    const { client, getBucketMock, createBucketMock } = createMockSupabaseStorage()
    const adapter = createSupabaseMediaAdapter({ client, bucket: 'artist-media' })

    await adapter.list('luna-vega')
    await adapter.list('marco-torres')
    await adapter.save('luna-vega', 'obra.png', 'image/png', VALID_PNG_BUFFER)

    expect(getBucketMock).toHaveBeenCalledTimes(1)
    expect(createBucketMock).not.toHaveBeenCalled()
  })

  it('treats "already exists" from createBucket as success (race-safe)', async () => {
    const { createSupabaseMediaAdapter } = await import('../supabase-media-adapter')
    const { client } = createMockSupabaseStorage({
      getBucketResult: { data: null, error: { message: 'Bucket not found' } },
      createBucketResult: { error: { message: 'The resource already exists' } },
    })
    const adapter = createSupabaseMediaAdapter({ client, bucket: 'artist-media' })

    await expect(adapter.list('luna-vega')).resolves.toBeDefined()
  })

  it('throws a descriptive error when bucket creation fails with an unexpected error', async () => {
    const { createSupabaseMediaAdapter } = await import('../supabase-media-adapter')
    const { client } = createMockSupabaseStorage({
      getBucketResult: { data: null, error: { message: 'Bucket not found' } },
      createBucketResult: { error: { message: 'permission denied' } },
    })
    const adapter = createSupabaseMediaAdapter({ client, bucket: 'artist-media' })

    await expect(adapter.list('luna-vega')).rejects.toThrow(
      /No se pudo crear el bucket "artist-media".*permission denied/
    )
  })

  it('getMediaAdapter returns Supabase adapter when STORAGE_BACKEND=cloud and local adapter otherwise', async () => {
    const { getMediaAdapter } = await import('../media-adapter')
    const { client, listMock } = createMockSupabaseStorage({
      listResult: { data: [], error: null },
    })
    mockGetSupabaseAdminClient.mockReturnValue(client)

    process.env.STORAGE_BACKEND = 'cloud'
    const cloudAdapter = getMediaAdapter()
    await cloudAdapter.list('luna-vega')
    expect(mockGetSupabaseAdminClient).toHaveBeenCalledTimes(1)
    expect(listMock).toHaveBeenCalledWith('luna-vega', {
      sortBy: { column: 'created_at', order: 'desc' },
    })

    jest.clearAllMocks()
    delete process.env.STORAGE_BACKEND
    const localAdapter = getMediaAdapter()
    const items = await localAdapter.list('nonexistent-artist-for-test-only')
    expect(items).toEqual([])
    expect(mockGetSupabaseAdminClient).not.toHaveBeenCalled()
  })
})
