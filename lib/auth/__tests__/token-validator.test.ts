import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals'
import { createHash } from 'crypto'
import { mkdtemp, mkdir, rm, writeFile } from 'fs/promises'
import os from 'os'
import path from 'path'

describe('token-validator and supabase-client', () => {
  const originalEnv = { ...process.env }
  const tempDirs: string[] = []

  beforeEach(() => {
    jest.resetModules()
    jest.dontMock('../../cloud/supabase-client')
    jest.dontMock('@supabase/supabase-js')
    jest.dontMock('crypto')
    process.env = { ...originalEnv }
    delete process.env.STORAGE_BACKEND
    delete process.env.ARTIST_TOKEN_HASHES
    delete process.env.SUPABASE_URL
    delete process.env.SUPABASE_SERVICE_ROLE_KEY
    delete process.env.SUPABASE_STORAGE_BUCKET
  })

  afterEach(async () => {
    process.env = { ...originalEnv }
    jest.restoreAllMocks()
    while (tempDirs.length > 0) {
      const dir = tempDirs.pop()
      if (dir) {
        await rm(dir, { recursive: true, force: true })
      }
    }
  })

  async function createTempArtistsDir(): Promise<string> {
    const dir = await mkdtemp(path.join(os.tmpdir(), 'quadro-token-test-'))
    tempDirs.push(dir)
    return dir
  }

  function mockCryptoTimingSafeEqual() {
    const actualCrypto = jest.requireActual('crypto') as typeof import('crypto')
    const timingSpy = jest.fn((a: NodeJS.ArrayBufferView, b: NodeJS.ArrayBufferView) =>
      actualCrypto.timingSafeEqual(a, b)
    )
    jest.doMock('crypto', () => ({
      ...actualCrypto,
      timingSafeEqual: timingSpy,
    }))
    return timingSpy
  }

  describe('hashTokenSha256 and constantTimeTokenEqual', () => {
    it('computes consistent lowercase SHA-256 hex digests', async () => {
      const { hashTokenSha256 } = await import('../token-validator')
      const expected = createHash('sha256').update('my-secret-token', 'utf8').digest('hex')
      expect(hashTokenSha256('my-secret-token')).toBe(expected)
      expect(hashTokenSha256('my-secret-token')).toMatch(/^[0-9a-f]{64}$/)
    })

    it('compares tokens in constant time using crypto.timingSafeEqual', async () => {
      const timingSpy = mockCryptoTimingSafeEqual()
      const { constantTimeTokenEqual } = await import('../token-validator')

      expect(constantTimeTokenEqual('alpha-token', 'alpha-token')).toBe(true)
      expect(constantTimeTokenEqual('alpha-token', 'alpha-tokeN')).toBe(false)
      expect(constantTimeTokenEqual('short', 'much-longer-token')).toBe(false)
      expect(timingSpy).toHaveBeenCalledTimes(3)
    })
  })

  describe('file mode (baseDir / local token.txt)', () => {
    it('validates tokens from temporary token.txt files and ignores unsafe/empty entries', async () => {
      const root = await createTempArtistsDir()
      await mkdir(path.join(root, 'artist-one'), { recursive: true })
      await mkdir(path.join(root, 'artist-two'), { recursive: true })
      await mkdir(path.join(root, 'Unsafe_Slug'), { recursive: true })
      await mkdir(path.join(root, 'empty-artist'), { recursive: true })

      await writeFile(path.join(root, 'artist-one', 'token.txt'), '  secret-one\n', 'utf-8')
      await writeFile(path.join(root, 'artist-two', 'token.txt'), 'secret-two', 'utf-8')
      await writeFile(path.join(root, 'Unsafe_Slug', 'token.txt'), 'secret-unsafe', 'utf-8')
      await writeFile(path.join(root, 'empty-artist', 'token.txt'), '   \n', 'utf-8')

      const { validateEditorToken } = await import('../token-validator')

      await expect(validateEditorToken('secret-one', root)).resolves.toBe('artist-one')
      await expect(validateEditorToken('  secret-two  ', root)).resolves.toBe('artist-two')
      await expect(validateEditorToken('secret-unsafe', root)).resolves.toBeNull()
      await expect(validateEditorToken('wrong-token', root)).resolves.toBeNull()
      await expect(validateEditorToken('', root)).resolves.toBeNull()
      await expect(validateEditorToken('   ', root)).resolves.toBeNull()
    })

    it('uses file mode when baseDir is provided even if STORAGE_BACKEND=cloud', async () => {
      process.env.STORAGE_BACKEND = 'cloud'
      const root = await createTempArtistsDir()
      await mkdir(path.join(root, 'local-artist'), { recursive: true })
      await writeFile(path.join(root, 'local-artist', 'token.txt'), 'local-secret', 'utf-8')

      const { validateEditorToken } = await import('../token-validator')
      await expect(validateEditorToken('local-secret', root)).resolves.toBe('local-artist')
    })

    it('returns null when baseDir does not exist', async () => {
      const { validateEditorToken } = await import('../token-validator')
      const missingDir = path.join(os.tmpdir(), 'non-existent-quadro-dir-12345')
      await expect(validateEditorToken('any-token', missingDir)).resolves.toBeNull()
    })
  })

  describe('cloud mode (Supabase + ARTIST_TOKEN_HASHES)', () => {
    it('validates against mocked Supabase artists table in constant time', async () => {
      process.env.STORAGE_BACKEND = 'cloud'
      const timingSpy = mockCryptoTimingSafeEqual()

      const validHash = createHash('sha256').update('cloud-secret-1', 'utf8').digest('hex')
      const unsafeSlugHash = createHash('sha256').update('unsafe-secret', 'utf8').digest('hex')

      const mockSelect = jest.fn(async () => ({
        data: [
          { slug: 'Unsafe_Slug', token_hash: unsafeSlugHash },
          { slug: 'bad-hex-artist', token_hash: 'not-a-valid-sha256' },
          { slug: 'artist-cloud', token_hash: validHash },
        ],
        error: null,
      }))
      const mockFrom = jest.fn(() => ({ select: mockSelect }))

      jest.doMock('../../cloud/supabase-client', () => ({
        getStorageBackend: () => 'cloud',
        getSupabaseAdminClient: () => ({ from: mockFrom }),
      }))

      const { validateEditorToken } = await import('../token-validator')

      await expect(validateEditorToken('  cloud-secret-1  ')).resolves.toBe('artist-cloud')
      expect(mockFrom).toHaveBeenCalledWith('artists')
      expect(mockSelect).toHaveBeenCalledWith('slug, token_hash')
      expect(timingSpy).toHaveBeenCalled()

      await expect(validateEditorToken('unsafe-secret')).resolves.toBeNull()
      await expect(validateEditorToken('wrong-secret')).resolves.toBeNull()
      await expect(validateEditorToken('   ')).resolves.toBeNull()
    })

    it('falls back to ARTIST_TOKEN_HASHES when Supabase has no match or fails', async () => {
      process.env.STORAGE_BACKEND = 'cloud'
      const fallbackHash = createHash('sha256').update('fallback-secret', 'utf8').digest('hex')
      const unsafeHash = createHash('sha256').update('unsafe-fallback', 'utf8').digest('hex')

      process.env.ARTIST_TOKEN_HASHES = JSON.stringify({
        Unsafe_Env: unsafeHash,
        'short-hash': 'abcd1234',
        'artist-env': fallbackHash.toUpperCase(),
      })

      const mockSelect = jest.fn(async () => ({
        data: null,
        error: { message: 'connection failed' },
      }))

      jest.doMock('../../cloud/supabase-client', () => ({
        getStorageBackend: () => 'cloud',
        getSupabaseAdminClient: () => ({ from: () => ({ select: mockSelect }) }),
      }))

      const { validateEditorToken } = await import('../token-validator')

      await expect(validateEditorToken('fallback-secret')).resolves.toBe('artist-env')
      await expect(validateEditorToken('unsafe-fallback')).resolves.toBeNull()
      await expect(validateEditorToken('unknown-token')).resolves.toBeNull()
    })

    it('returns null gracefully when Supabase throws and ARTIST_TOKEN_HASHES is missing or malformed', async () => {
      process.env.STORAGE_BACKEND = 'cloud'

      jest.doMock('../../cloud/supabase-client', () => ({
        getStorageBackend: () => 'cloud',
        getSupabaseAdminClient: () => {
          throw new Error('Missing Supabase env')
        },
      }))

      const { validateEditorToken } = await import('../token-validator')

      await expect(validateEditorToken('any-token')).resolves.toBeNull()

      process.env.ARTIST_TOKEN_HASHES = '{invalid-json'
      await expect(validateEditorToken('any-token')).resolves.toBeNull()

      process.env.ARTIST_TOKEN_HASHES = '["not-an-object"]'
      await expect(validateEditorToken('any-token')).resolves.toBeNull()
    })
  })

  describe('supabase-client helpers', () => {
    it('resolves storage backend, bucket, and lazy singleton client', async () => {
      const fakeClient = { from: jest.fn() }
      const createClientMock = jest.fn(() => fakeClient)

      jest.doMock('@supabase/supabase-js', () => ({
        createClient: createClientMock,
      }))

      const {
        getStorageBackend,
        getSupabaseStorageBucket,
        getSupabaseAdminClient,
        resetSupabaseClientForTests,
      } = await import('../../cloud/supabase-client')

      expect(getStorageBackend()).toBe('file')
      process.env.STORAGE_BACKEND = 'CLOUD'
      expect(getStorageBackend()).toBe('cloud')
      process.env.STORAGE_BACKEND = 'local'
      expect(getStorageBackend()).toBe('file')

      expect(getSupabaseStorageBucket()).toBe('artist-media')
      process.env.SUPABASE_STORAGE_BUCKET = 'custom-bucket'
      expect(getSupabaseStorageBucket()).toBe('custom-bucket')

      expect(() => getSupabaseAdminClient()).toThrow(/SUPABASE_URL/)

      process.env.SUPABASE_URL = 'https://example.supabase.co'
      process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key'

      const client1 = getSupabaseAdminClient()
      const client2 = getSupabaseAdminClient()
      expect(client1).toBe(fakeClient)
      expect(client2).toBe(client1)
      expect(createClientMock).toHaveBeenCalledTimes(1)
      expect(createClientMock).toHaveBeenCalledWith(
        'https://example.supabase.co',
        'test-service-role-key',
        {
          auth: {
            persistSession: false,
            autoRefreshToken: false,
          },
        }
      )

      resetSupabaseClientForTests()
      getSupabaseAdminClient()
      expect(createClientMock).toHaveBeenCalledTimes(2)
    })
  })
})
