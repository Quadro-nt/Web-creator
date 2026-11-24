import { mkdtemp, readFile, rm } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { afterAll, beforeEach, describe, expect, it, jest } from '@jest/globals'

type AnyAsyncFn = (...args: unknown[]) => Promise<unknown>
type AnyFn = (...args: unknown[]) => unknown

const mockGetSupabaseAdminClient = jest.fn<AnyFn>()

jest.mock('@/lib/cloud/supabase-client', () => ({
  getStorageBackend: () =>
    (process.env.STORAGE_BACKEND ?? '').toLowerCase() === 'cloud' ? 'cloud' : 'file',
  getSupabaseAdminClient: () => mockGetSupabaseAdminClient(),
}))

describe('Cloud stores (STORAGE_BACKEND=cloud)', () => {
  const originalBackend = process.env.STORAGE_BACKEND
  const originalLimit = process.env.AI_DAILY_LIMIT_PER_ARTIST

  beforeEach(() => {
    jest.clearAllMocks()
    process.env.STORAGE_BACKEND = 'cloud'
    delete process.env.AI_DAILY_LIMIT_PER_ARTIST
  })

  afterAll(() => {
    if (originalBackend === undefined) delete process.env.STORAGE_BACKEND
    else process.env.STORAGE_BACKEND = originalBackend

    if (originalLimit === undefined) delete process.env.AI_DAILY_LIMIT_PER_ARTIST
    else process.env.AI_DAILY_LIMIT_PER_ARTIST = originalLimit
  })

  describe('newsletter-store', () => {
    it('listSubscribers queries newsletter_subscribers ordered by created_at asc', async () => {
      const orderMock = jest.fn<AnyAsyncFn>().mockResolvedValue({
        data: [
          { email: 'uno@example.com', created_at: '2026-01-01T10:00:00.000Z' },
          { email: 'dos@example.com', created_at: '2026-01-02T10:00:00.000Z' },
        ],
        error: null,
      })
      const eqMock = jest.fn<AnyFn>(() => ({ order: orderMock }))
      const selectMock = jest.fn<AnyFn>(() => ({ eq: eqMock }))
      const fromMock = jest.fn<AnyFn>(() => ({ select: selectMock }))
      mockGetSupabaseAdminClient.mockReturnValue({ from: fromMock })

      const { listSubscribers } = await import('@/lib/newsletter/newsletter-store')
      const result = await listSubscribers('luna-vega')

      expect(fromMock).toHaveBeenCalledWith('newsletter_subscribers')
      expect(selectMock).toHaveBeenCalledWith('email, created_at')
      expect(eqMock).toHaveBeenCalledWith('artist_slug', 'luna-vega')
      expect(orderMock).toHaveBeenCalledWith('created_at', { ascending: true })
      expect(result).toEqual([
        { email: 'uno@example.com', createdAt: '2026-01-01T10:00:00.000Z' },
        { email: 'dos@example.com', createdAt: '2026-01-02T10:00:00.000Z' },
      ])
    })

    it('addSubscriber normalizes email, deduplicates case-insensitively, and inserts new rows', async () => {
      const orderMock = jest
        .fn<AnyAsyncFn>()
        .mockResolvedValueOnce({
          data: [{ email: 'existing@example.com', created_at: '2026-01-01T10:00:00.000Z' }],
          error: null,
        })
        .mockResolvedValueOnce({
          data: [{ email: 'existing@example.com', created_at: '2026-01-01T10:00:00.000Z' }],
          error: null,
        })
      const eqMock = jest.fn<AnyFn>(() => ({ order: orderMock }))
      const selectMock = jest.fn<AnyFn>(() => ({ eq: eqMock }))
      const insertMock = jest.fn<AnyAsyncFn>().mockResolvedValue({ error: null })
      const fromMock = jest.fn<AnyFn>(() => ({ select: selectMock, insert: insertMock }))
      mockGetSupabaseAdminClient.mockReturnValue({ from: fromMock })

      const { addSubscriber } = await import('@/lib/newsletter/newsletter-store')

      const dup = await addSubscriber('luna-vega', '  EXISTING@Example.COM ')
      expect(dup).toEqual({ alreadySubscribed: true, total: 1 })
      expect(insertMock).not.toHaveBeenCalled()

      const added = await addSubscriber('luna-vega', '  Nuevo@Example.COM ')
      expect(added).toEqual({ alreadySubscribed: false, total: 2 })
      expect(insertMock).toHaveBeenCalledWith({
        artist_slug: 'luna-vega',
        email: 'nuevo@example.com',
      })
    })

    it('addSubscriber enforces MAX_SUBSCRIBERS_PER_ARTIST in cloud mode', async () => {
      const { MAX_SUBSCRIBERS_PER_ARTIST, addSubscriber } = await import(
        '@/lib/newsletter/newsletter-store'
      )
      const fullList = Array.from({ length: MAX_SUBSCRIBERS_PER_ARTIST }, (_, i) => ({
        email: `user${i}@example.com`,
        created_at: '2026-01-01T00:00:00.000Z',
      }))
      const orderMock = jest.fn<AnyAsyncFn>().mockResolvedValue({ data: fullList, error: null })
      const eqMock = jest.fn<AnyFn>(() => ({ order: orderMock }))
      const selectMock = jest.fn<AnyFn>(() => ({ eq: eqMock }))
      const insertMock = jest.fn<AnyAsyncFn>()
      mockGetSupabaseAdminClient.mockReturnValue({
        from: jest.fn<AnyFn>(() => ({ select: selectMock, insert: insertMock })),
      })

      await expect(addSubscriber('luna-vega', 'extra@example.com')).rejects.toThrow(
        'límite máximo de suscriptores'
      )
      expect(insertMock).not.toHaveBeenCalled()
    })

    it('uses local filesystem when baseDir is provided even if STORAGE_BACKEND=cloud', async () => {
      const tmpDir = await mkdtemp(path.join(os.tmpdir(), 'quadro-news-'))
      try {
        const { addSubscriber, listSubscribers } = await import(
          '@/lib/newsletter/newsletter-store'
        )
        await addSubscriber('luna-vega', 'local@example.com', tmpDir)
        const list = await listSubscribers('luna-vega', tmpDir)
        expect(list).toHaveLength(1)
        expect(list[0].email).toBe('local@example.com')
        expect(mockGetSupabaseAdminClient).not.toHaveBeenCalled()
      } finally {
        await rm(tmpDir, { recursive: true, force: true })
      }
    })
  })

  describe('ai/rate-limiter', () => {
    it('checkLimit selects today count from ai_daily_usage and computes allowed/remaining', async () => {
      process.env.AI_DAILY_LIMIT_PER_ARTIST = '5'
      const today = new Date().toISOString().slice(0, 10)

      const maybeSingleMock = jest
        .fn<AnyAsyncFn>()
        .mockResolvedValueOnce({ data: null, error: null })
        .mockResolvedValueOnce({ data: { count: 5 }, error: null })

      const eqDateMock = jest.fn<AnyFn>(() => ({ maybeSingle: maybeSingleMock }))
      const eqSlugMock = jest.fn<AnyFn>(() => ({ eq: eqDateMock }))
      const selectMock = jest.fn<AnyFn>(() => ({ eq: eqSlugMock }))
      const fromMock = jest.fn<AnyFn>(() => ({ select: selectMock }))
      mockGetSupabaseAdminClient.mockReturnValue({ from: fromMock })

      const { checkLimit } = await import('@/lib/ai/rate-limiter')

      const first = await checkLimit('luna-vega')
      expect(fromMock).toHaveBeenCalledWith('ai_daily_usage')
      expect(selectMock).toHaveBeenCalledWith('count')
      expect(eqSlugMock).toHaveBeenCalledWith('artist_slug', 'luna-vega')
      expect(eqDateMock).toHaveBeenCalledWith('usage_date', today)
      expect(first.allowed).toBe(true)
      expect(first.remaining).toBe(5)
      expect(first.resetAt).toBeInstanceOf(Date)

      const exhausted = await checkLimit('luna-vega')
      expect(exhausted.allowed).toBe(false)
      expect(exhausted.remaining).toBe(0)
    })

    it('incrementCount selects current count and upserts incremented count into ai_daily_usage', async () => {
      const today = new Date().toISOString().slice(0, 10)
      const maybeSingleMock = jest
        .fn<AnyAsyncFn>()
        .mockResolvedValueOnce({ data: null, error: null })
        .mockResolvedValueOnce({ data: { count: 3 }, error: null })
      const eqDateMock = jest.fn<AnyFn>(() => ({ maybeSingle: maybeSingleMock }))
      const eqSlugMock = jest.fn<AnyFn>(() => ({ eq: eqDateMock }))
      const selectMock = jest.fn<AnyFn>(() => ({ eq: eqSlugMock }))
      const upsertMock = jest.fn<AnyAsyncFn>().mockResolvedValue({ error: null })
      const fromMock = jest.fn<AnyFn>(() => ({ select: selectMock, upsert: upsertMock }))
      mockGetSupabaseAdminClient.mockReturnValue({ from: fromMock })

      const { incrementCount } = await import('@/lib/ai/rate-limiter')

      await incrementCount('luna-vega')
      expect(upsertMock).toHaveBeenNthCalledWith(
        1,
        { artist_slug: 'luna-vega', usage_date: today, count: 1 },
        { onConflict: 'artist_slug,usage_date' }
      )

      await incrementCount('luna-vega')
      expect(upsertMock).toHaveBeenNthCalledWith(
        2,
        { artist_slug: 'luna-vega', usage_date: today, count: 4 },
        { onConflict: 'artist_slug,usage_date' }
      )
    })

    it('uses local filesystem when baseDir is provided even if STORAGE_BACKEND=cloud', async () => {
      const tmpDir = await mkdtemp(path.join(os.tmpdir(), 'quadro-rl-'))
      try {
        const { checkLimit, incrementCount } = await import('@/lib/ai/rate-limiter')
        await incrementCount('luna-vega', tmpDir)
        const result = await checkLimit('luna-vega', tmpDir)
        expect(result.remaining).toBe(19)
        expect(mockGetSupabaseAdminClient).not.toHaveBeenCalled()
      } finally {
        await rm(tmpDir, { recursive: true, force: true })
      }
    })
  })

  describe('ai/logger', () => {
    it('logAIRequest inserts structured entry into ai_logs when STORAGE_BACKEND=cloud', async () => {
      const insertMock = jest.fn<AnyAsyncFn>().mockResolvedValue({ error: null })
      const fromMock = jest.fn<AnyFn>(() => ({ insert: insertMock }))
      mockGetSupabaseAdminClient.mockReturnValue({ from: fromMock })

      const { logAIRequest } = await import('@/lib/ai/logger')
      const entry = {
        timestamp: '2026-11-24T15:00:00.000Z',
        artistSlug: 'luna-vega',
        prompt: 'Cambia el fondo a negro',
        applied: true,
        unsatisfied: ['tipografía serif'],
        validationError: null,
      }

      await logAIRequest(entry)

      expect(fromMock).toHaveBeenCalledWith('ai_logs')
      expect(insertMock).toHaveBeenCalledWith({
        artist_slug: 'luna-vega',
        prompt: 'Cambia el fondo a negro',
        applied: true,
        unsatisfied: ['tipografía serif'],
        validation_error: null,
        created_at: '2026-11-24T15:00:00.000Z',
      })
    })

    it('throws when Supabase ai_logs insert returns an error', async () => {
      const insertMock = jest.fn<AnyAsyncFn>().mockResolvedValue({
        error: { message: 'Insert failed' },
      })
      mockGetSupabaseAdminClient.mockReturnValue({
        from: jest.fn<AnyFn>(() => ({ insert: insertMock })),
      })

      const { logAIRequest } = await import('@/lib/ai/logger')
      await expect(
        logAIRequest({
          timestamp: '2026-11-24T15:00:00.000Z',
          artistSlug: 'luna-vega',
          prompt: 'test',
          applied: false,
          unsatisfied: [],
          validationError: 'invalid',
        })
      ).rejects.toThrow('Insert failed')
    })

    it('writes local ai-log.jsonl when baseDir is provided even if STORAGE_BACKEND=cloud', async () => {
      const tmpDir = await mkdtemp(path.join(os.tmpdir(), 'quadro-log-'))
      try {
        const { logAIRequest } = await import('@/lib/ai/logger')
        const entry = {
          timestamp: '2026-11-24T15:00:00.000Z',
          artistSlug: 'luna-vega',
          prompt: 'local test',
          applied: true,
          unsatisfied: [],
          validationError: null,
        }
        await logAIRequest(entry, tmpDir)
        const raw = await readFile(path.join(tmpDir, 'luna-vega', 'ai-log.jsonl'), 'utf8')
        expect(JSON.parse(raw.trim())).toEqual(entry)
        expect(mockGetSupabaseAdminClient).not.toHaveBeenCalled()
      } finally {
        await rm(tmpDir, { recursive: true, force: true })
      }
    })
  })
})
