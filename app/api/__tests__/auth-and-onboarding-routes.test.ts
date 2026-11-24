/**
 * @jest-environment node
 */
import { mkdtemp, readFile, rm } from 'fs/promises'
import os from 'os'
import path from 'path'
import { afterAll, beforeAll, beforeEach, describe, expect, it, jest } from '@jest/globals'

const ACCESS_COOKIE = 'qs_access_token'
const REFRESH_COOKIE = 'qs_refresh_token'
const PKCE_COOKIE_PREFIX = 'qs_pkce_'

const mockRevalidatePath = jest.fn()
let mockStorageBackend: 'file' | 'cloud' = 'file'

const mockSignUp = jest.fn<(...args: unknown[]) => Promise<unknown>>()
const mockSignInWithOAuth = jest.fn<(...args: unknown[]) => Promise<unknown>>()
const mockExchangeCodeForSession = jest.fn<(...args: unknown[]) => Promise<unknown>>()
const mockArtistsMaybeSingle = jest.fn<() => Promise<unknown>>()

jest.mock('next/cache', () => ({
  revalidatePath: mockRevalidatePath,
}))

jest.mock('@/lib/cloud/supabase-client', () => {
  const actual = jest.requireActual('@/lib/cloud/supabase-client') as Record<string, unknown>
  return {
    ...actual,
    getStorageBackend: () => mockStorageBackend,
    createSupabaseAuthClient: (options?: {
      storage?: {
        getItem: (key: string) => string | null
        setItem: (key: string, value: string) => void
        removeItem: (key: string) => void
      }
    }) => ({
      auth: {
        signUp: (...args: unknown[]) => mockSignUp(...args),
        signInWithOAuth: async (...args: unknown[]) => {
          options?.storage?.setItem('sb-test-auth-token-code-verifier', 'verifier-123')
          return mockSignInWithOAuth(...args)
        },
        exchangeCodeForSession: async (code: string) => {
          const verifier = options?.storage?.getItem('sb-test-auth-token-code-verifier') ?? null
          return mockExchangeCodeForSession(code, verifier)
        },
      },
    }),
    getSupabaseAdminClient: () => ({
      from: () => ({
        select: () => ({
          eq: () => ({
            maybeSingle: () => mockArtistsMaybeSingle(),
          }),
        }),
      }),
    }),
  }
})

let signupPost: (req: Request) => Promise<Response>
let loginPost: (req: Request) => Promise<Response>
let logoutPost: () => Promise<Response>
let googleOAuthGet: (req: Request) => Promise<Response>
let callbackGet: (req: Request) => Promise<Response>
let onboardingGet: (req: Request) => Promise<Response>
let onboardingPost: (req: Request) => Promise<Response>

function extractCookieHeader(response: Response): string {
  const getSetCookie = (response.headers as unknown as { getSetCookie?: () => string[] }).getSetCookie
  const rawList = typeof getSetCookie === 'function' ? getSetCookie.call(response.headers) : []
  if (rawList.length > 0) {
    return rawList.map((entry) => entry.split(';')[0]).join('; ')
  }
  const single = response.headers.get('set-cookie')
  return single ? single.split(';')[0] : ''
}

describe('Auth & Onboarding API routes', () => {
  let tmpDir: string
  let cwdSpy: jest.SpiedFunction<typeof process.cwd>

  beforeAll(async () => {
    tmpDir = await mkdtemp(path.join(os.tmpdir(), 'quadro-auth-onboarding-'))
    cwdSpy = jest.spyOn(process, 'cwd').mockReturnValue(tmpDir)

    const signupMod = await import('@/app/api/auth/signup/route')
    const loginMod = await import('@/app/api/auth/login/route')
    const logoutMod = await import('@/app/api/auth/logout/route')
    const googleMod = await import('@/app/api/auth/oauth/google/route')
    const callbackMod = await import('@/app/api/auth/callback/route')
    const onboardingMod = await import('@/app/api/onboarding/route')

    signupPost = signupMod.POST
    loginPost = loginMod.POST
    logoutPost = logoutMod.POST
    googleOAuthGet = googleMod.GET
    callbackGet = callbackMod.GET
    onboardingGet = onboardingMod.GET
    onboardingPost = onboardingMod.POST
  })

  beforeEach(() => {
    mockStorageBackend = 'file'
    mockRevalidatePath.mockReset()
    mockSignUp.mockReset()
    mockSignInWithOAuth.mockReset()
    mockExchangeCodeForSession.mockReset()
    mockArtistsMaybeSingle.mockReset()
  })

  afterAll(async () => {
    cwdSpy.mockRestore()
    await rm(tmpDir, { recursive: true, force: true })
  })

  describe('POST /api/auth/signup', () => {
    it('returns 400 for invalid payload', async () => {
      const req = new Request('http://localhost:3000/api/auth/signup', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email: 'not-an-email', password: '123' }),
      })

      const res = await signupPost(req)
      expect(res.status).toBe(400)
      const data = (await res.json()) as { error?: string }
      expect(data.error).toBeTruthy()
    })

    it('creates account, sets session cookie and redirects to onboarding with template', async () => {
      const req = new Request('http://localhost:3000/api/auth/signup', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          email: 'artista@quadro.test',
          password: 'password123',
          template: 'editorial',
        }),
      })

      const res = await signupPost(req)
      expect(res.status).toBe(200)
      const data = (await res.json()) as {
        ok: boolean
        needsEmailConfirmation: boolean
        redirectTo: string
      }
      expect(data).toEqual({
        ok: true,
        needsEmailConfirmation: false,
        redirectTo: '/onboarding?template=editorial',
      })
      expect(res.headers.get('set-cookie')).toContain(`${ACCESS_COOKIE}=`)
    })

    it('returns 409 when email already exists', async () => {
      const req = new Request('http://localhost:3000/api/auth/signup', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          email: 'artista@quadro.test',
          password: 'password123',
        }),
      })

      const res = await signupPost(req)
      expect(res.status).toBe(409)
      const data = (await res.json()) as { error: string }
      expect(data.error).toMatch(/existe/i)
    })

    it('returns needsEmailConfirmation when cloud signup requires email verification', async () => {
      mockStorageBackend = 'cloud'
      mockSignUp.mockResolvedValue({
        data: { user: { id: 'cloud-user-1', email: 'confirm@quadro.test' }, session: null },
        error: null,
      })

      const req = new Request('http://localhost:3000/api/auth/signup', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          email: 'confirm@quadro.test',
          password: 'password123',
          template: 'immersive',
        }),
      })

      const res = await signupPost(req)
      expect(res.status).toBe(200)
      expect(mockSignUp).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'confirm@quadro.test',
          options: { emailRedirectTo: 'http://localhost:3000/api/auth/callback?template=immersive' },
        })
      )
      const data = (await res.json()) as {
        ok: boolean
        needsEmailConfirmation: boolean
        message: string
      }
      expect(data).toEqual({
        ok: true,
        needsEmailConfirmation: true,
        message: 'Revisa tu correo para confirmar tu cuenta y continuar.',
      })
    })
  })

  describe('POST /api/auth/login & POST /api/auth/logout', () => {
    it('returns 401 on wrong password', async () => {
      const req = new Request('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          email: 'artista@quadro.test',
          password: 'wrong-password',
        }),
      })

      const res = await loginPost(req)
      expect(res.status).toBe(401)
    })

    it('logs in user without site and redirects to /onboarding', async () => {
      const req = new Request('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          email: 'artista@quadro.test',
          password: 'password123',
        }),
      })

      const res = await loginPost(req)
      expect(res.status).toBe(200)
      const data = (await res.json()) as { ok: boolean; redirectTo: string }
      expect(data).toEqual({ ok: true, redirectTo: '/onboarding' })
      expect(res.headers.get('set-cookie')).toContain(`${ACCESS_COOKIE}=`)
    })

    it('clears session cookies on logout', async () => {
      const res = await logoutPost()
      expect(res.status).toBe(200)
      const data = (await res.json()) as { ok: boolean }
      expect(data).toEqual({ ok: true })
      const setCookie = res.headers.get('set-cookie') ?? ''
      expect(setCookie).toContain(`${ACCESS_COOKIE}=`)
      expect(setCookie).toContain(`${REFRESH_COOKIE}=`)
      expect(setCookie).toContain('Max-Age=0')
    })
  })

  describe('GET /api/onboarding & POST /api/onboarding', () => {
    it('checks slug availability and rejects reserved www slug', async () => {
      const okRes = await onboardingGet(new Request('http://localhost:3000/api/onboarding?slug=mi-taller'))
      expect(okRes.status).toBe(200)
      expect(await okRes.json()).toEqual({ available: true, normalizedSlug: 'mi-taller' })

      const reservedRes = await onboardingGet(new Request('http://localhost:3000/api/onboarding?slug=www'))
      expect(reservedRes.status).toBe(200)
      const reservedData = (await reservedRes.json()) as {
        available: boolean
        normalizedSlug: string
        reason?: string
      }
      expect(reservedData.available).toBe(false)
      expect(reservedData.normalizedSlug).toBe('www')
      expect(reservedData.reason).toBeTruthy()
    })

    it('returns 401 when unauthenticated', async () => {
      const req = new Request('http://localhost:3000/api/onboarding', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          displayName: 'Mi Taller',
          slug: 'mi-taller',
          template: 'minimal-gallery',
        }),
      })

      const res = await onboardingPost(req)
      expect(res.status).toBe(401)
      expect(await res.json()).toEqual({ error: 'Debes iniciar sesión para crear tu sitio' })
    })

    it('creates site, calls revalidatePath, rejects duplicate with 409, and login redirects to /studio', async () => {
      const loginRes = await loginPost(
        new Request('http://localhost:3000/api/auth/login', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            email: 'artista@quadro.test',
            password: 'password123',
          }),
        })
      )
      const cookieHeader = extractCookieHeader(loginRes)
      expect(cookieHeader).toContain(`${ACCESS_COOKIE}=`)

      const createRes = await onboardingPost(
        new Request('http://localhost:3000/api/onboarding', {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            cookie: cookieHeader,
          },
          body: JSON.stringify({
            displayName: 'Taller Norte',
            slug: 'taller-norte',
            template: 'editorial',
            whatsappNumber: '+5491122334455',
          }),
        })
      )

      expect(createRes.status).toBe(200)
      expect(await createRes.json()).toEqual({
        ok: true,
        slug: 'taller-norte',
        redirectTo: '/studio',
      })
      expect(mockRevalidatePath).toHaveBeenCalledWith('/sites/taller-norte', 'layout')

      const publishedRaw = await readFile(
        path.join(tmpDir, 'data', 'artists', 'taller-norte', 'config.published.json'),
        'utf-8'
      )
      expect(JSON.parse(publishedRaw)).toMatchObject({
        template: 'editorial',
        identity: { siteTitle: 'Taller Norte' },
      })

      const duplicateRes = await onboardingPost(
        new Request('http://localhost:3000/api/onboarding', {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            cookie: cookieHeader,
          },
          body: JSON.stringify({
            displayName: 'Otro Taller',
            slug: 'otro-taller',
            template: 'minimal-gallery',
          }),
        })
      )
      expect(duplicateRes.status).toBe(409)

      const loginAfterRes = await loginPost(
        new Request('http://localhost:3000/api/auth/login', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            email: 'artista@quadro.test',
            password: 'password123',
          }),
        })
      )
      expect(loginAfterRes.status).toBe(200)
      expect(await loginAfterRes.json()).toEqual({ ok: true, redirectTo: '/studio' })
    })
  })

  describe('GET /api/auth/oauth/google & GET /api/auth/callback', () => {
    it('redirects to oauth_unavailable when storage backend is file', async () => {
      const res = await googleOAuthGet(new Request('http://localhost:3000/api/auth/oauth/google'))
      expect(res.status).toBe(307)
      expect(res.headers.get('location')).toBe('http://localhost:3000/login?error=oauth_unavailable')
    })

    it('initiates PKCE OAuth and exchanges code in callback', async () => {
      mockStorageBackend = 'cloud'
      mockSignInWithOAuth.mockResolvedValue({
        data: { url: 'https://accounts.google.com/o/oauth2/v2/auth?state=abc' },
        error: null,
      })

      const startRes = await googleOAuthGet(
        new Request('http://localhost:3000/api/auth/oauth/google?template=immersive')
      )
      expect(startRes.status).toBe(307)
      expect(startRes.headers.get('location')).toBe(
        'https://accounts.google.com/o/oauth2/v2/auth?state=abc'
      )
      const pkceCookieHeader = extractCookieHeader(startRes)
      expect(pkceCookieHeader).toContain(`${PKCE_COOKIE_PREFIX}sb-test-auth-token-code-verifier=verifier-123`)

      const missingCodeRes = await callbackGet(
        new Request('http://localhost:3000/api/auth/callback')
      )
      expect(missingCodeRes.status).toBe(307)
      expect(missingCodeRes.headers.get('location')).toBe('http://localhost:3000/login?error=missing_code')

      mockExchangeCodeForSession.mockResolvedValue({
        data: {
          user: { id: 'oauth-user-1', email: 'google@quadro.test' },
          session: { access_token: 'cloud-access', refresh_token: 'cloud-refresh' },
        },
        error: null,
      })
      mockArtistsMaybeSingle.mockResolvedValue({ data: null, error: null })

      const cbRes = await callbackGet(
        new Request('http://localhost:3000/api/auth/callback?code=oauth-code-1&template=immersive', {
          headers: { cookie: pkceCookieHeader },
        })
      )
      expect(mockExchangeCodeForSession).toHaveBeenCalledWith('oauth-code-1', 'verifier-123')
      expect(cbRes.status).toBe(307)
      expect(cbRes.headers.get('location')).toBe('http://localhost:3000/onboarding?template=immersive')
      const setCookie = cbRes.headers.get('set-cookie') ?? ''
      expect(setCookie).toContain(`${ACCESS_COOKIE}=cloud-access`)
      expect(setCookie).toContain(`${REFRESH_COOKIE}=cloud-refresh`)
      expect(setCookie).toContain(`${PKCE_COOKIE_PREFIX}sb-test-auth-token-code-verifier=;`)
    })
  })
})
