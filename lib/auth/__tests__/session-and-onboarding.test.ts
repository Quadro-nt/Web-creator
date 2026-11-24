/**
 * @jest-environment node
 */
import { describe, it, expect, jest, beforeEach, beforeAll, afterAll } from '@jest/globals'
import { mkdtemp, readFile, rm } from 'fs/promises'
import os from 'os'
import path from 'path'
import { SiteConfigSchema } from '../../schemas/site-config.schema'

const mockGetStorageBackend = jest.fn<() => 'file' | 'cloud'>(() => 'file')
const mockCreateSupabaseAuthClient = jest.fn()
const mockGetSupabaseAdminClient = jest.fn()

jest.mock('../../cloud/supabase-client', () => {
  const actual = jest.requireActual<typeof import('../../cloud/supabase-client')>(
    '../../cloud/supabase-client'
  )
  return {
    ...actual,
    getStorageBackend: () => mockGetStorageBackend(),
    createSupabaseAuthClient: (opts?: unknown) => mockCreateSupabaseAuthClient(opts),
    getSupabaseAdminClient: () => mockGetSupabaseAdminClient(),
  }
})

let reservedSlugsMod: typeof import('../reserved-slugs')
let sessionMod: typeof import('../session')
let onboardingMod: typeof import('../../onboarding/artist-onboarding')
let verifyApiMod: typeof import('../verify-api-request')

beforeAll(async () => {
  reservedSlugsMod = await import('../reserved-slugs')
  sessionMod = await import('../session')
  onboardingMod = await import('../../onboarding/artist-onboarding')
  verifyApiMod = await import('../verify-api-request')
})

describe('reserved-slugs and validation', () => {
  it('detects reserved slugs such as www, login, and studio', () => {
    expect(reservedSlugsMod.isReservedArtistSlug('www')).toBe(true)
    expect(reservedSlugsMod.isReservedArtistSlug('LOGIN')).toBe(true)
    expect(reservedSlugsMod.isReservedArtistSlug('studio')).toBe(true)
    expect(reservedSlugsMod.isReservedArtistSlug('clara-mendez')).toBe(false)
  })

  it('normalizes accents, spaces, and max length (40 chars)', () => {
    expect(reservedSlugsMod.normalizeArtistSlug('  María José Peña!  ')).toBe('maria-jose-pena')
    expect(reservedSlugsMod.normalizeArtistSlug('a'.repeat(55))).toHaveLength(40)
  })

  it('validateNewArtistSlug rejects reserved slugs, accents, and invalid lengths', () => {
    expect(reservedSlugsMod.validateNewArtistSlug('www').ok).toBe(false)
    expect(reservedSlugsMod.validateNewArtistSlug('login').ok).toBe(false)
    expect(reservedSlugsMod.validateNewArtistSlug('studio').ok).toBe(false)
    expect(reservedSlugsMod.validateNewArtistSlug('maría').ok).toBe(false)
    expect(reservedSlugsMod.validateNewArtistSlug('ab').ok).toBe(false)
    expect(reservedSlugsMod.validateNewArtistSlug('a'.repeat(41)).ok).toBe(false)
    expect(reservedSlugsMod.validateNewArtistSlug('luna--vega').ok).toBe(false)
    expect(reservedSlugsMod.validateNewArtistSlug('Clara-Mendez')).toEqual({
      ok: true,
      slug: 'clara-mendez',
    })
  })
})

describe('buildInitialSiteConfig', () => {
  it('builds valid configs for minimal-gallery, editorial, and immersive templates', () => {
    const minimal = onboardingMod.buildInitialSiteConfig({
      displayName: 'Clara Méndez',
      template: 'minimal-gallery',
      whatsappNumber: '+5491122334455',
    })
    expect(() => SiteConfigSchema.parse(minimal)).not.toThrow()
    expect(minimal.styleTokens).toMatchObject({
      background: '#ffffff',
      text: '#1a1a1a',
      accent: '#b86b35',
    })
    expect(minimal.identity.siteTitle).toBe('Clara Méndez')
    expect(minimal.header?.whatsappNumber).toBe('+5491122334455')
    expect(minimal.footer?.whatsapp).toBe('+5491122334455')

    const editorial = onboardingMod.buildInitialSiteConfig({
      displayName: 'Mateo Solís',
      template: 'editorial',
    })
    expect(() => SiteConfigSchema.parse(editorial)).not.toThrow()
    expect(editorial.styleTokens).toMatchObject({
      background: '#faf7f2',
      text: '#1c1917',
      accent: '#9a3412',
      fontPair: 'playfair-raleway',
    })

    const immersive = onboardingMod.buildInitialSiteConfig({
      displayName: 'Nora Luz',
      template: 'immersive',
    })
    expect(() => SiteConfigSchema.parse(immersive)).not.toThrow()
    expect(immersive.styleTokens).toMatchObject({
      background: '#111111',
      text: '#f5f3ef',
      accent: '#d4a373',
      fontPair: 'cormorant-jost',
    })
  })
})

describe('file mode auth + onboarding + verifyEditorRequest flow', () => {
  let tempDir: string

  beforeAll(async () => {
    tempDir = await mkdtemp(path.join(os.tmpdir(), 'quadro-auth-test-'))
  })

  beforeEach(() => {
    mockGetStorageBackend.mockReturnValue('file')
  })

  afterAll(async () => {
    await rm(tempDir, { recursive: true, force: true })
  })

  it('completes signUp -> signIn -> session -> onboarding -> verifyEditorRequest', async () => {
    const signUpRes = await sessionMod.signUpWithEmail(
      { email: 'clara@ejemplo.com', password: 'password123' },
      tempDir
    )
    expect(signUpRes.ok).toBe(true)
    if (!signUpRes.ok) return
    expect(signUpRes.needsEmailConfirmation).toBe(false)
    expect(signUpRes.tokens?.accessToken).toBeTruthy()

    const dupRes = await sessionMod.signUpWithEmail(
      { email: 'CLARA@ejemplo.com', password: 'password123' },
      tempDir
    )
    expect(dupRes.ok).toBe(false)

    const badSignIn = await sessionMod.signInWithEmail(
      { email: 'clara@ejemplo.com', password: 'wrong-password' },
      tempDir
    )
    expect(badSignIn.ok).toBe(false)

    const signInRes = await sessionMod.signInWithEmail(
      { email: 'clara@ejemplo.com', password: 'password123' },
      tempDir
    )
    expect(signInRes.ok).toBe(true)
    if (!signInRes.ok) return

    const cookieHeader = `${sessionMod.ACCESS_COOKIE}=${encodeURIComponent(
      signInRes.tokens.accessToken
    )}`

    const sessionUser = await sessionMod.getSessionUserFromRequest(
      new Request('http://localhost/api/auth/me', { headers: { cookie: cookieHeader } }),
      tempDir
    )
    expect(sessionUser).toEqual({ id: signInRes.user.id, email: 'clara@ejemplo.com' })

    const cookieStoreUser = await sessionMod.getSessionUserFromCookies(
      {
        get: (name) =>
          name === sessionMod.ACCESS_COOKIE ? { value: signInRes.tokens.accessToken } : undefined,
      },
      tempDir
    )
    expect(cookieStoreUser).toEqual({ id: signInRes.user.id, email: 'clara@ejemplo.com' })

    const availBefore = await onboardingMod.isSlugAvailable('clara-mendez', tempDir)
    expect(availBefore).toEqual({ available: true, normalizedSlug: 'clara-mendez' })

    const created = await onboardingMod.createArtistSiteForUser(
      {
        userId: signInRes.user.id,
        email: signInRes.user.email,
        displayName: 'Clara Méndez',
        slug: 'clara-mendez',
        template: 'editorial',
        whatsappNumber: '+5491112345678',
      },
      tempDir
    )
    expect(created.ok).toBe(true)

    const publishedRaw = await readFile(
      path.join(tempDir, 'clara-mendez', 'config.published.json'),
      'utf-8'
    )
    expect(JSON.parse(publishedRaw).identity.siteTitle).toBe('Clara Méndez')

    const artist = await onboardingMod.getArtistByUserId(signInRes.user.id, tempDir)
    expect(artist).toEqual({ slug: 'clara-mendez', displayName: 'Clara Méndez' })

    const availAfter = await onboardingMod.isSlugAvailable('clara-mendez', tempDir)
    expect(availAfter.available).toBe(false)

    const secondSite = await onboardingMod.createArtistSiteForUser(
      {
        userId: signInRes.user.id,
        email: signInRes.user.email,
        displayName: 'Clara Dos',
        slug: 'clara-dos',
        template: 'minimal-gallery',
      },
      tempDir
    )
    expect(secondSite).toMatchObject({ ok: false, status: 409 })

    // verifyEditorRequest with sentinel header + valid cookie
    const okReq = new Request('http://localhost/api/draft', {
      method: 'POST',
      headers: {
        'x-editor-token': sessionMod.SESSION_SENTINEL_TOKEN,
        cookie: cookieHeader,
      },
    })
    const okVerify = await verifyApiMod.verifyEditorRequest(okReq, 'clara-mendez', undefined, tempDir)
    expect(okVerify).toEqual({ ok: true, artistSlug: 'clara-mendez' })

    // 403 for another artist slug
    const wrongSlugVerify = await verifyApiMod.verifyEditorRequest(
      okReq,
      'otro-artista',
      undefined,
      tempDir
    )
    expect(wrongSlugVerify).toMatchObject({ ok: false, status: 403 })

    // 401 when __session__ sent without cookie
    const noCookieReq = new Request('http://localhost/api/draft', {
      method: 'POST',
      headers: { 'x-editor-token': sessionMod.SESSION_SENTINEL_TOKEN },
    })
    const noCookieVerify = await verifyApiMod.verifyEditorRequest(
      noCookieReq,
      'clara-mendez',
      undefined,
      tempDir
    )
    expect(noCookieVerify).toMatchObject({ ok: false, status: 401 })
  })

  it('rejects Google OAuth in file mode with a clear error', async () => {
    const res = await sessionMod.createGoogleOAuthRedirect({
      redirectTo: 'http://localhost:3000/api/auth/callback',
    })
    expect(res.ok).toBe(false)
    if (!res.ok) {
      expect(res.error).toContain('STORAGE_BACKEND=cloud')
    }
  })
})

describe('cloud mode with mocked Supabase client', () => {
  beforeEach(() => {
    mockGetStorageBackend.mockReturnValue('cloud')
    mockCreateSupabaseAuthClient.mockReset()
    mockGetSupabaseAdminClient.mockReset()
  })

  afterAll(() => {
    mockGetStorageBackend.mockReturnValue('file')
  })

  it('signs in with email via Supabase Auth', async () => {
    mockCreateSupabaseAuthClient.mockReturnValue({
      auth: {
        signInWithPassword: jest.fn(async () => ({
          data: {
            user: { id: 'user-uuid-1', email: 'sol@ejemplo.com' },
            session: { access_token: 'sb-access', refresh_token: 'sb-refresh' },
          },
          error: null,
        })),
      },
    })

    const res = await sessionMod.signInWithEmail({
      email: 'sol@ejemplo.com',
      password: 'secret-password',
    })

    expect(res).toEqual({
      ok: true,
      user: { id: 'user-uuid-1', email: 'sol@ejemplo.com' },
      tokens: { accessToken: 'sb-access', refreshToken: 'sb-refresh' },
    })
  })

  it('creates Google OAuth PKCE redirect and exchanges code using captured PKCE cookies', async () => {
    mockCreateSupabaseAuthClient.mockImplementation((opts?: unknown) => {
      const storage = (
        opts as {
          storage?: {
            getItem: (k: string) => string | null
            setItem: (k: string, v: string) => void
          }
        }
      )?.storage

      return {
        auth: {
          signInWithOAuth: jest.fn(async () => {
            storage?.setItem('sb-test-code-verifier', 'pkce-verifier-123')
            return {
              data: { url: 'https://accounts.google.com/o/oauth2/auth?state=xyz' },
              error: null,
            }
          }),
          exchangeCodeForSession: jest.fn(async (code: string) => {
            const verifier = storage?.getItem('sb-test-code-verifier')
            if (code !== 'oauth-code-1' || verifier !== 'pkce-verifier-123') {
              return { data: { user: null, session: null }, error: { message: 'PKCE mismatch' } }
            }
            return {
              data: {
                user: { id: 'oauth-user-1', email: 'google@ejemplo.com' },
                session: { access_token: 'oauth-access', refresh_token: 'oauth-refresh' },
              },
              error: null,
            }
          }),
        },
      }
    })

    const redirectRes = await sessionMod.createGoogleOAuthRedirect({
      redirectTo: 'https://quadro-nt.com/api/auth/callback',
    })
    expect(redirectRes.ok).toBe(true)
    if (!redirectRes.ok) return
    expect(redirectRes.url).toContain('accounts.google.com')
    expect(redirectRes.pkceCookies).toEqual([
      { name: 'sb-test-code-verifier', value: 'pkce-verifier-123' },
    ])

    const exchangeRes = await sessionMod.exchangeOAuthCode({
      code: 'oauth-code-1',
      pkceCookies: redirectRes.pkceCookies.map((c) => ({
        name: `${sessionMod.PKCE_COOKIE_PREFIX}${c.name}`,
        value: c.value,
      })),
    })
    expect(exchangeRes).toEqual({
      ok: true,
      user: { id: 'oauth-user-1', email: 'google@ejemplo.com' },
      tokens: { accessToken: 'oauth-access', refreshToken: 'oauth-refresh' },
    })
  })

  it('creates an artist site in Supabase artists and works tables', async () => {
    const insertArtistMock = jest.fn(async () => ({ error: null }))
    const upsertWorksMock = jest.fn(async () => ({ error: null }))

    mockGetSupabaseAdminClient.mockReturnValue({
      from: jest.fn((table: string) => {
        if (table === 'artists') {
          return {
            select: jest.fn(() => ({
              eq: jest.fn(() => ({
                maybeSingle: jest.fn(async () => ({ data: null, error: null })),
              })),
            })),
            insert: insertArtistMock,
          }
        }
        if (table === 'works') {
          return {
            upsert: upsertWorksMock,
          }
        }
        throw new Error(`Unexpected table ${table}`)
      }),
    })

    const res = await onboardingMod.createArtistSiteForUser({
      userId: '11111111-1111-1111-1111-111111111111',
      email: 'sol@ejemplo.com',
      displayName: 'Sol García',
      slug: 'sol-garcia',
      template: 'immersive',
    })

    expect(res.ok).toBe(true)
    expect(insertArtistMock).toHaveBeenCalledTimes(1)
    const insertedPayload = (insertArtistMock.mock.calls[0] as unknown as [Record<string, unknown>])[0]
    expect(insertedPayload.slug).toBe('sol-garcia')
    expect(insertedPayload.owner_user_id).toBe('11111111-1111-1111-1111-111111111111')
    expect(insertedPayload.owner_email).toBe('sol@ejemplo.com')
    expect(insertedPayload.display_name).toBe('Sol García')
    expect(insertedPayload.token_hash).toMatch(/^[0-9a-f]{64}$/)
    expect(upsertWorksMock).toHaveBeenCalledWith(
      expect.objectContaining({ artist_slug: 'sol-garcia', items: [] }),
      { onConflict: 'artist_slug' }
    )
  })

  it('writes code-verifier into PKCE storage using the real createSupabaseAuthClient', async () => {
    const prevUrl = process.env.SUPABASE_URL
    const prevAnonKey = process.env.SUPABASE_ANON_KEY
    const prevPublicAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    process.env.SUPABASE_URL = 'https://test-project.supabase.co'
    process.env.SUPABASE_ANON_KEY = 'dummy-anon-key-for-pkce-test'
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    try {
      const actualCloudClient = jest.requireActual<typeof import('../../cloud/supabase-client')>(
        '../../cloud/supabase-client'
      )
      mockCreateSupabaseAuthClient.mockImplementation((opts?: unknown) =>
        actualCloudClient.createSupabaseAuthClient(
          opts as Parameters<typeof actualCloudClient.createSupabaseAuthClient>[0]
        )
      )

      const redirectRes = await sessionMod.createGoogleOAuthRedirect({
        redirectTo: 'http://localhost:3000/api/auth/callback',
      })
      expect(redirectRes.ok).toBe(true)
      if (!redirectRes.ok) return

      expect(redirectRes.url).toContain('https://test-project.supabase.co/auth/v1/authorize')
      expect(redirectRes.url).toContain('code_challenge=')
      expect(
        redirectRes.pkceCookies.some(
          (cookie) => cookie.name.includes('code-verifier') && cookie.value.length > 0
        )
      ).toBe(true)
    } finally {
      if (prevUrl === undefined) delete process.env.SUPABASE_URL
      else process.env.SUPABASE_URL = prevUrl
      if (prevAnonKey === undefined) delete process.env.SUPABASE_ANON_KEY
      else process.env.SUPABASE_ANON_KEY = prevAnonKey
      if (prevPublicAnonKey !== undefined) {
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = prevPublicAnonKey
      }
    }
  })

  it('does not invoke refreshSession in getSessionUserFromCookies (allowRefresh: false)', async () => {
    const getUserMock = jest.fn(async () => ({
      data: { user: null },
      error: { message: 'JWT expired' },
    }))
    const refreshSessionMock = jest.fn(async () => ({
      data: {
        user: { id: 'user-1', email: 'sol@ejemplo.com' },
        session: { access_token: 'new-access', refresh_token: 'new-refresh' },
      },
      error: null,
    }))

    mockCreateSupabaseAuthClient.mockReturnValue({
      auth: {
        getUser: getUserMock,
        refreshSession: refreshSessionMock,
      },
    })

    const cookieStore = {
      get: (name: string) => {
        if (name === sessionMod.ACCESS_COOKIE) return { value: 'expired-access-token' }
        if (name === sessionMod.REFRESH_COOKIE) return { value: 'valid-refresh-token' }
        return undefined
      },
    }

    const user = await sessionMod.getSessionUserFromCookies(cookieStore)
    expect(user).toBeNull()
    expect(getUserMock).toHaveBeenCalledTimes(1)
    expect(refreshSessionMock).not.toHaveBeenCalled()
    expect(sessionMod.hasRefreshCookie(cookieStore)).toBe(true)
    expect(sessionMod.hasRefreshCookie({ get: () => undefined })).toBe(false)
  })

  it('returns prefixed pkceCookies from signUpWithEmail when email confirmation is required', async () => {
    mockCreateSupabaseAuthClient.mockImplementation((opts?: unknown) => {
      const storage = (
        opts as {
          storage?: {
            setItem: (k: string, v: string) => void
          }
        }
      )?.storage

      return {
        auth: {
          signUp: jest.fn(async () => {
            storage?.setItem('sb-test-project-auth-token-code-verifier', 'signup-verifier-abc')
            return {
              data: {
                user: { id: 'new-user-1', email: 'nueva@ejemplo.com' },
                session: null,
              },
              error: null,
            }
          }),
        },
      }
    })

    const res = await sessionMod.signUpWithEmail({
      email: 'nueva@ejemplo.com',
      password: 'password123',
      emailRedirectTo: 'http://localhost:3000/api/auth/callback',
    })

    expect(res).toEqual({
      ok: true,
      user: { id: 'new-user-1', email: 'nueva@ejemplo.com' },
      tokens: null,
      needsEmailConfirmation: true,
      pkceCookies: [
        {
          name: `${sessionMod.PKCE_COOKIE_PREFIX}sb-test-project-auth-token-code-verifier`,
          value: 'signup-verifier-abc',
        },
      ],
    })
  })
})
