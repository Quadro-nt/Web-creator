/**
 * @jest-environment node
 */
import { describe, it, expect, jest, beforeAll, beforeEach } from '@jest/globals'
import { defaultSiteConfig } from '@/lib/schemas/site-config.schema'

const mockRevalidatePath = jest.fn()
const mockVerifyEditorRequest = jest.fn<
  (
    request: Request,
    expectedSlug?: string
  ) => Promise<{ ok: true; artistSlug: string } | { ok: false; error: string; status: number }>
>()
const mockSaveDraft = jest.fn<(...args: unknown[]) => Promise<void>>()
const mockPublish = jest.fn<(...args: unknown[]) => Promise<void>>()
const mockSaveWorks = jest.fn<(...args: unknown[]) => Promise<void>>()

jest.mock('next/cache', () => ({
  revalidatePath: (...args: unknown[]) => mockRevalidatePath(...args),
}))

jest.mock('@/lib/auth/verify-api-request', () => ({
  verifyEditorRequest: (request: Request, expectedSlug?: string) =>
    mockVerifyEditorRequest(request, expectedSlug),
}))

jest.mock('@/lib/storage', () => {
  const actual = jest.requireActual<typeof import('@/lib/storage')>('@/lib/storage')
  return {
    ...actual,
    getStorageAdapter: () => ({
      ...actual.createFileAdapter(),
      saveDraft: (...args: unknown[]) => mockSaveDraft(...args),
      publish: (...args: unknown[]) => mockPublish(...args),
    }),
  }
})

jest.mock('@/lib/works/repository', () => ({
  getWorksRepository: () => ({
    getWorks: jest.fn(),
    getWork: jest.fn(),
    saveWorks: (...args: unknown[]) => mockSaveWorks(...args),
  }),
}))

let publishPost: typeof import('../publish/route').POST
let worksPost: typeof import('../works/route').POST

function makeJsonRequest(url: string, body: unknown): Request {
  return new Request(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('revalidatePath en POST /api/publish y POST /api/works', () => {
  beforeAll(async () => {
    const publishMod = await import('../publish/route')
    publishPost = publishMod.POST
    const worksMod = await import('../works/route')
    worksPost = worksMod.POST
  })

  beforeEach(() => {
    mockRevalidatePath.mockReset()
    mockVerifyEditorRequest.mockReset()
    mockSaveDraft.mockReset().mockResolvedValue(undefined)
    mockPublish.mockReset().mockResolvedValue(undefined)
    mockSaveWorks.mockReset().mockResolvedValue(undefined)
  })

  it('POST /api/publish llama a revalidatePath("/sites/luna-vega", "layout") tras publicar', async () => {
    mockVerifyEditorRequest.mockResolvedValue({ ok: true, artistSlug: 'luna-vega' })

    const res = await publishPost(
      makeJsonRequest('http://localhost/api/publish', {
        artistSlug: 'luna-vega',
        config: defaultSiteConfig,
      })
    )

    expect(res.status).toBe(200)
    expect(mockPublish).toHaveBeenCalledWith('luna-vega')
    expect(mockRevalidatePath).toHaveBeenCalledWith('/sites/luna-vega', 'layout')
    expect(mockPublish.mock.invocationCallOrder[0]).toBeLessThan(
      mockRevalidatePath.mock.invocationCallOrder[0]
    )
  })

  it('POST /api/works llama a revalidatePath("/sites/luna-vega", "layout") tras guardar obras', async () => {
    mockVerifyEditorRequest.mockResolvedValue({ ok: true, artistSlug: 'luna-vega' })

    const res = await worksPost(
      makeJsonRequest('http://localhost/api/works', {
        artistSlug: 'luna-vega',
        works: [],
      })
    )

    expect(res.status).toBe(200)
    expect(mockSaveWorks).toHaveBeenCalledWith('luna-vega', [])
    expect(mockRevalidatePath).toHaveBeenCalledWith('/sites/luna-vega', 'layout')
    expect(mockSaveWorks.mock.invocationCallOrder[0]).toBeLessThan(
      mockRevalidatePath.mock.invocationCallOrder[0]
    )
  })

  it('no llama a revalidatePath cuando la autenticación falla con 401 en POST /api/publish', async () => {
    mockVerifyEditorRequest.mockResolvedValue({
      ok: false,
      error: 'No autorizado',
      status: 401,
    })

    const res = await publishPost(
      makeJsonRequest('http://localhost/api/publish', {
        artistSlug: 'luna-vega',
        config: defaultSiteConfig,
      })
    )

    expect(res.status).toBe(401)
    expect(mockPublish).not.toHaveBeenCalled()
    expect(mockRevalidatePath).not.toHaveBeenCalled()
  })

  it('no llama a revalidatePath cuando la autenticación falla con 401 en POST /api/works', async () => {
    mockVerifyEditorRequest.mockResolvedValue({
      ok: false,
      error: 'No autorizado',
      status: 401,
    })

    const res = await worksPost(
      makeJsonRequest('http://localhost/api/works', {
        artistSlug: 'luna-vega',
        works: [],
      })
    )

    expect(res.status).toBe(401)
    expect(mockSaveWorks).not.toHaveBeenCalled()
    expect(mockRevalidatePath).not.toHaveBeenCalled()
  })
})
