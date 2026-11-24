import { createHmac, randomBytes, randomUUID, scryptSync, timingSafeEqual } from 'crypto'
import { mkdir, readFile, writeFile } from 'fs/promises'
import path from 'path'
import { createSupabaseAuthClient, getStorageBackend } from '../cloud/supabase-client'

export const SESSION_SENTINEL_TOKEN = '__session__'
export const ACCESS_COOKIE = 'qs_access_token'
export const REFRESH_COOKIE = 'qs_refresh_token'
export const PKCE_COOKIE_PREFIX = 'qs_pkce_'
export const ACCESS_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 7
export const REFRESH_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 30

export type SessionUser = {
  id: string
  email: string
}

export type SessionTokens = {
  accessToken: string
  refreshToken?: string
}

export type LocalAuthUserRecord = {
  id: string
  email: string
  passwordHash: string
  artistSlug?: string
  displayName?: string
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const LOCAL_TOKEN_TTL_SECONDS = 60 * 60 * 24 * 7

function getLocalSessionSecret(): string {
  return process.env.SESSION_SECRET || process.env.AUTH_SECRET || 'quadro-local-dev-session-secret'
}

export function getLocalAuthUsersPath(baseDir?: string): string {
  return baseDir
    ? path.join(baseDir, 'auth-users.local.json')
    : path.join(process.cwd(), 'data', 'auth-users.local.json')
}

/** Reads the local JSON user store (returns [] when missing). */
export async function readLocalAuthUsers(baseDir?: string): Promise<LocalAuthUserRecord[]> {
  try {
    const raw = await readFile(getLocalAuthUsersPath(baseDir), 'utf-8')
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter(
      (item): item is LocalAuthUserRecord =>
        Boolean(item) &&
        typeof item === 'object' &&
        typeof (item as LocalAuthUserRecord).id === 'string' &&
        typeof (item as LocalAuthUserRecord).email === 'string' &&
        typeof (item as LocalAuthUserRecord).passwordHash === 'string'
    )
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
      return []
    }
    throw err
  }
}

/** Persists the local JSON user store. */
export async function writeLocalAuthUsers(
  users: LocalAuthUserRecord[],
  baseDir?: string
): Promise<void> {
  const filePath = getLocalAuthUsersPath(baseDir)
  await mkdir(path.dirname(filePath), { recursive: true })
  await writeFile(filePath, `${JSON.stringify(users, null, 2)}\n`, 'utf-8')
}

function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex')
  const derived = scryptSync(password, salt, 64).toString('hex')
  return `${salt}:${derived}`
}

function verifyPassword(password: string, stored: string): boolean {
  const parts = stored.split(':')
  if (parts.length !== 2) return false
  const [salt, hashHex] = parts
  if (!salt || !hashHex) return false

  const expected = Buffer.from(hashHex, 'hex')
  const actual = scryptSync(password, salt, 64)
  if (expected.length !== actual.length) return false
  return timingSafeEqual(actual, expected)
}

function signLocalAccessToken(user: SessionUser): string {
  const payload = {
    sub: user.id,
    email: user.email,
    exp: Math.floor(Date.now() / 1000) + LOCAL_TOKEN_TTL_SECONDS,
  }
  const encoded = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url')
  const sig = createHmac('sha256', getLocalSessionSecret())
    .update(encoded)
    .digest('base64url')
  return `${encoded}.${sig}`
}

function verifyLocalAccessToken(token: string): SessionUser | null {
  const parts = token.split('.')
  if (parts.length !== 2) return null
  const [encoded, sig] = parts
  if (!encoded || !sig) return null

  const expectedSig = createHmac('sha256', getLocalSessionSecret())
    .update(encoded)
    .digest('base64url')

  const sigBuf = Buffer.from(sig, 'utf8')
  const expectedBuf = Buffer.from(expectedSig, 'utf8')
  if (sigBuf.length !== expectedBuf.length || !timingSafeEqual(sigBuf, expectedBuf)) {
    return null
  }

  try {
    const parsed: unknown = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8'))
    if (!parsed || typeof parsed !== 'object') return null
    const { sub, email, exp } = parsed as { sub?: unknown; email?: unknown; exp?: unknown }
    if (typeof sub !== 'string' || typeof email !== 'string' || typeof exp !== 'number') {
      return null
    }
    if (exp <= Math.floor(Date.now() / 1000)) {
      return null
    }
    return { id: sub, email }
  } catch {
    return null
  }
}

/** Parses an HTTP `Cookie` header into a key-value map. */
export function parseCookieHeader(header: string | null): Record<string, string> {
  if (!header) return {}
  const result: Record<string, string> = {}
  for (const part of header.split(';')) {
    const eqIdx = part.indexOf('=')
    if (eqIdx <= 0) continue
    const key = part.slice(0, eqIdx).trim()
    const rawVal = part.slice(eqIdx + 1).trim()
    if (!key) continue
    try {
      result[key] = decodeURIComponent(rawVal)
    } catch {
      result[key] = rawVal
    }
  }
  return result
}

/** Returns standard cookie attributes for auth session cookies. */
export function buildSessionCookieOptions(maxAgeSeconds: number) {
  return {
    httpOnly: true,
    sameSite: 'lax' as const,
    path: '/',
    secure: process.env.NODE_ENV === 'production',
    maxAge: maxAgeSeconds,
  }
}

function isCloudAuth(baseDir?: string): boolean {
  return !baseDir && getStorageBackend() === 'cloud'
}

/** Creates an in-memory PKCE storage adapter backed by a Map. */
function createInMemoryPkceStorage(initialEntries?: Iterable<[string, string]>) {
  const store = new Map<string, string>(initialEntries)
  return {
    store,
    storage: {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => {
        store.set(k, v)
      },
      removeItem: (k: string) => {
        store.delete(k)
      },
    },
  }
}

/** Registers an artist account with email and password. */
export async function signUpWithEmail(
  params: { email: string; password: string; emailRedirectTo?: string },
  baseDir?: string
): Promise<
  | {
      ok: true
      user: SessionUser
      tokens: SessionTokens | null
      needsEmailConfirmation: boolean
      pkceCookies?: Array<{ name: string; value: string }>
    }
  | { ok: false; error: string }
> {
  const email = params.email.trim().toLowerCase()
  if (!EMAIL_RE.test(email)) {
    return { ok: false, error: 'Ingresa un email válido.' }
  }
  if (!params.password || params.password.length < 6) {
    return { ok: false, error: 'La contraseña debe tener al menos 6 caracteres.' }
  }

  if (isCloudAuth(baseDir)) {
    const { store, storage } = createInMemoryPkceStorage()
    const supabase = createSupabaseAuthClient({ storage })
    const { data, error } = await supabase.auth.signUp({
      email,
      password: params.password,
      options: params.emailRedirectTo ? { emailRedirectTo: params.emailRedirectTo } : undefined,
    })
    if (error || !data.user) {
      return { ok: false, error: error?.message ?? 'No se pudo crear la cuenta.' }
    }
    const user: SessionUser = { id: data.user.id, email: data.user.email ?? email }
    const tokens: SessionTokens | null = data.session?.access_token
      ? {
          accessToken: data.session.access_token,
          refreshToken: data.session.refresh_token,
        }
      : null
    const pkceCookies = Array.from(store.entries()).map(([name, value]) => ({
      name: name.startsWith(PKCE_COOKIE_PREFIX) ? name : `${PKCE_COOKIE_PREFIX}${name}`,
      value,
    }))
    return {
      ok: true,
      user,
      tokens,
      needsEmailConfirmation: !data.session,
      pkceCookies,
    }
  }

  const users = await readLocalAuthUsers(baseDir)
  if (users.some((u) => u.email.toLowerCase() === email)) {
    return { ok: false, error: 'Ya existe una cuenta con ese email.' }
  }

  const newUser: LocalAuthUserRecord = {
    id: randomUUID(),
    email,
    passwordHash: hashPassword(params.password),
  }
  users.push(newUser)
  await writeLocalAuthUsers(users, baseDir)

  const sessionUser: SessionUser = { id: newUser.id, email: newUser.email }
  return {
    ok: true,
    user: sessionUser,
    tokens: { accessToken: signLocalAccessToken(sessionUser) },
    needsEmailConfirmation: false,
  }
}

/** Signs in an artist account with email and password. */
export async function signInWithEmail(
  params: { email: string; password: string },
  baseDir?: string
): Promise<{ ok: true; user: SessionUser; tokens: SessionTokens } | { ok: false; error: string }> {
  const email = params.email.trim().toLowerCase()
  if (!EMAIL_RE.test(email) || !params.password) {
    return { ok: false, error: 'Email o contraseña incorrectos.' }
  }

  if (isCloudAuth(baseDir)) {
    const supabase = createSupabaseAuthClient()
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password: params.password,
    })
    if (error || !data.user || !data.session?.access_token) {
      return { ok: false, error: error?.message ?? 'Email o contraseña incorrectos.' }
    }
    return {
      ok: true,
      user: { id: data.user.id, email: data.user.email ?? email },
      tokens: {
        accessToken: data.session.access_token,
        refreshToken: data.session.refresh_token,
      },
    }
  }

  const users = await readLocalAuthUsers(baseDir)
  const found = users.find((u) => u.email.toLowerCase() === email)
  if (!found || !verifyPassword(params.password, found.passwordHash)) {
    return { ok: false, error: 'Email o contraseña incorrectos.' }
  }

  const sessionUser: SessionUser = { id: found.id, email: found.email }
  return {
    ok: true,
    user: sessionUser,
    tokens: { accessToken: signLocalAccessToken(sessionUser) },
  }
}

/** Initiates Google OAuth PKCE flow via Supabase Auth in cloud mode. */
export async function createGoogleOAuthRedirect(params: {
  redirectTo: string
}): Promise<
  | { ok: true; url: string; pkceCookies: Array<{ name: string; value: string }> }
  | { ok: false; error: string }
> {
  if (getStorageBackend() !== 'cloud') {
    return {
      ok: false,
      error: 'Google Login solo está disponible cuando STORAGE_BACKEND=cloud con Supabase Auth.',
    }
  }

  const { store, storage } = createInMemoryPkceStorage()
  const supabase = createSupabaseAuthClient({ storage })

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: params.redirectTo,
      skipBrowserRedirect: true,
    },
  })

  if (error || !data?.url) {
    return { ok: false, error: error?.message ?? 'No se pudo iniciar Google Login.' }
  }

  const pkceCookies = Array.from(store.entries()).map(([name, value]) => ({ name, value }))
  return { ok: true, url: data.url, pkceCookies }
}

/** Exchanges an OAuth PKCE authorization code for Supabase session tokens. */
export async function exchangeOAuthCode(params: {
  code: string
  pkceCookies: Array<{ name: string; value: string }>
}): Promise<{ ok: true; user: SessionUser; tokens: SessionTokens } | { ok: false; error: string }> {
  if (getStorageBackend() !== 'cloud') {
    return {
      ok: false,
      error: 'Google Login solo está disponible cuando STORAGE_BACKEND=cloud con Supabase Auth.',
    }
  }

  const { store, storage } = createInMemoryPkceStorage()
  for (const cookie of params.pkceCookies) {
    store.set(cookie.name, cookie.value)
    if (cookie.name.startsWith(PKCE_COOKIE_PREFIX)) {
      store.set(cookie.name.slice(PKCE_COOKIE_PREFIX.length), cookie.value)
    }
  }

  const supabase = createSupabaseAuthClient({ storage })

  const { data, error } = await supabase.auth.exchangeCodeForSession(params.code)
  if (error || !data.user || !data.session?.access_token) {
    return { ok: false, error: error?.message ?? 'No se pudo completar el inicio de sesión.' }
  }

  return {
    ok: true,
    user: { id: data.user.id, email: data.user.email ?? '' },
    tokens: {
      accessToken: data.session.access_token,
      refreshToken: data.session.refresh_token,
    },
  }
}

/** Resolves a session user from access/refresh tokens, refreshing if allowed in cloud mode. */
export async function getSessionUserFromTokens(
  tokens: { accessToken?: string; refreshToken?: string },
  optionsOrBaseDir?: { allowRefresh?: boolean; baseDir?: string } | string
): Promise<{ user: SessionUser; refreshedTokens?: SessionTokens } | null> {
  const baseDir = typeof optionsOrBaseDir === 'string' ? optionsOrBaseDir : optionsOrBaseDir?.baseDir
  const allowRefresh =
    typeof optionsOrBaseDir === 'string' ? true : (optionsOrBaseDir?.allowRefresh ?? true)

  if (!tokens.accessToken && !tokens.refreshToken) {
    return null
  }

  if (isCloudAuth(baseDir)) {
    const supabase = createSupabaseAuthClient()
    if (tokens.accessToken) {
      const { data, error } = await supabase.auth.getUser(tokens.accessToken)
      if (!error && data.user) {
        return {
          user: { id: data.user.id, email: data.user.email ?? '' },
        }
      }
    }

    if (allowRefresh && tokens.refreshToken) {
      const { data, error } = await supabase.auth.refreshSession({
        refresh_token: tokens.refreshToken,
      })
      if (!error && data.user && data.session?.access_token) {
        return {
          user: { id: data.user.id, email: data.user.email ?? '' },
          refreshedTokens: {
            accessToken: data.session.access_token,
            refreshToken: data.session.refresh_token,
          },
        }
      }
    }

    return null
  }

  if (!tokens.accessToken) return null
  const user = verifyLocalAccessToken(tokens.accessToken)
  return user ? { user } : null
}

/** Reads and validates the authenticated user from a Request's `Cookie` header. */
export async function getSessionUserFromRequest(
  request: Request,
  baseDir?: string
): Promise<SessionUser | null> {
  const parsedCookies = parseCookieHeader(request.headers.get('cookie'))
  const result = await getSessionUserFromTokens(
    {
      accessToken: parsedCookies[ACCESS_COOKIE],
      refreshToken: parsedCookies[REFRESH_COOKIE],
    },
    { allowRefresh: true, baseDir }
  )

  if (result?.refreshedTokens) {
    try {
      const { cookies } = await import('next/headers')
      const store = cookies()
      store.set(
        ACCESS_COOKIE,
        result.refreshedTokens.accessToken,
        buildSessionCookieOptions(ACCESS_COOKIE_MAX_AGE_SECONDS)
      )
      if (result.refreshedTokens.refreshToken) {
        store.set(
          REFRESH_COOKIE,
          result.refreshedTokens.refreshToken,
          buildSessionCookieOptions(REFRESH_COOKIE_MAX_AGE_SECONDS)
        )
      }
    } catch {
      /* fuera de contexto request de Next.js en tests unitarios */
    }
  }

  return result?.user ?? null
}

/** Reads and validates the authenticated user from a Next.js `cookies()` store without rotating refresh tokens. */
export async function getSessionUserFromCookies(
  cookieStore: { get(name: string): { value: string } | undefined },
  baseDir?: string
): Promise<SessionUser | null> {
  const result = await getSessionUserFromTokens(
    {
      accessToken: cookieStore.get(ACCESS_COOKIE)?.value,
      refreshToken: cookieStore.get(REFRESH_COOKIE)?.value,
    },
    { allowRefresh: false, baseDir }
  )
  return result?.user ?? null
}

/** Returns true when a non-empty refresh token cookie is present in the cookie store. */
export function hasRefreshCookie(cookieStore: {
  get(name: string): { value: string } | undefined
}): boolean {
  return Boolean(cookieStore.get(REFRESH_COOKIE)?.value)
}
