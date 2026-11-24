/**
 * @jest-environment node
 */
import { describe, it, expect, jest, beforeAll, beforeEach } from '@jest/globals'
import { existsSync } from 'fs'
import path from 'path'
import type { SiteConfig } from '@/lib/storage'

const mockAddSubscriber = jest.fn<
  (
    artistSlug: string,
    rawEmail: string,
    baseDir?: string
  ) => Promise<{ alreadySubscribed: boolean; total: number }>
>()
const mockGetPublished = jest.fn<(slug: string) => Promise<SiteConfig | null>>()

jest.mock('@/lib/newsletter/newsletter-store', () => {
  const actual = jest.requireActual<typeof import('@/lib/newsletter/newsletter-store')>(
    '@/lib/newsletter/newsletter-store'
  )
  return {
    ...actual,
    addSubscriber: (...args: Parameters<typeof actual.addSubscriber>) =>
      mockAddSubscriber(...args),
  }
})

jest.mock('@/lib/storage', () => {
  const actual = jest.requireActual<typeof import('@/lib/storage')>('@/lib/storage')
  return {
    ...actual,
    createFileAdapter: () => ({
      ...actual.createFileAdapter(),
      getPublished: (slug: string) => mockGetPublished(slug),
    }),
  }
})

let POST: typeof import('../newsletter/route').POST
let resetNewsletterRateLimitForTests: typeof import('@/lib/newsletter/newsletter-store').resetNewsletterRateLimitForTests
let NEWSLETTER_RATE_LIMIT_MAX: number

function makePostRequest(body: unknown, ip = '198.51.100.1'): Request {
  return new Request('http://localhost/api/newsletter', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-forwarded-for': ip,
    },
    body: JSON.stringify(body),
  })
}

describe('POST /api/newsletter', () => {
  beforeAll(async () => {
    const routeMod = await import('../newsletter/route')
    POST = routeMod.POST
    const storeMod = await import('@/lib/newsletter/newsletter-store')
    resetNewsletterRateLimitForTests = storeMod.resetNewsletterRateLimitForTests
    NEWSLETTER_RATE_LIMIT_MAX = storeMod.NEWSLETTER_RATE_LIMIT_MAX
  })

  beforeEach(() => {
    resetNewsletterRateLimitForTests()
    mockAddSubscriber.mockReset()
    const actualStorage = jest.requireActual<typeof import('@/lib/storage')>('@/lib/storage')
    mockGetPublished.mockReset()
    mockGetPublished.mockImplementation((slug: string) =>
      actualStorage.createFileAdapter().getPublished(slug)
    )
  })

  it('retorna 404 para artista inexistente y no crea carpeta en data/artists/', async () => {
    const fakeSlug = 'artista-inexistente-no-crear'
    const fakeDir = path.join(process.cwd(), 'data', 'artists', fakeSlug)

    const res = await POST(
      makePostRequest({ artistSlug: fakeSlug, email: 'fan@ejemplo.com' })
    )

    expect(res.status).toBe(404)
    expect(await res.json()).toEqual({ error: 'Artista no encontrado' })
    expect(mockAddSubscriber).not.toHaveBeenCalled()
    expect(existsSync(fakeDir)).toBe(false)
  })

  it('retorna 200 para artista válido publicado', async () => {
    mockGetPublished.mockResolvedValue({} as SiteConfig)
    mockAddSubscriber.mockResolvedValue({ alreadySubscribed: false, total: 1 })

    const res = await POST(
      makePostRequest({ artistSlug: 'luna-vega', email: 'fan@ejemplo.com' })
    )

    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ ok: true, alreadySubscribed: false, total: 1 })
    expect(mockAddSubscriber).toHaveBeenCalledWith('luna-vega', 'fan@ejemplo.com')
  })

  it('retorna 429 al exceder el rate limit por ip y artistSlug', async () => {
    mockGetPublished.mockResolvedValue({} as SiteConfig)
    mockAddSubscriber.mockResolvedValue({ alreadySubscribed: false, total: 1 })

    for (let i = 0; i < NEWSLETTER_RATE_LIMIT_MAX; i++) {
      const res = await POST(
        makePostRequest(
          { artistSlug: 'luna-vega', email: `fan${i}@ejemplo.com` },
          '203.0.113.10'
        )
      )
      expect(res.status).toBe(200)
    }

    const blocked = await POST(
      makePostRequest(
        { artistSlug: 'luna-vega', email: 'extra@ejemplo.com' },
        '203.0.113.10'
      )
    )
    expect(blocked.status).toBe(429)

    const otherIp = await POST(
      makePostRequest(
        { artistSlug: 'luna-vega', email: 'otro@ejemplo.com' },
        '203.0.113.11'
      )
    )
    expect(otherIp.status).toBe(200)
  })
})
