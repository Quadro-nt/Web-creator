import { NextResponse } from 'next/server'
import { z } from 'zod'
import {
  ACCESS_COOKIE,
  PKCE_COOKIE_PREFIX,
  REFRESH_COOKIE,
  buildSessionCookieOptions,
  signUpWithEmail,
} from '@/lib/auth/session'

const ACCESS_MAX_AGE_SECONDS = 60 * 60 * 24 * 7
const REFRESH_MAX_AGE_SECONDS = 60 * 60 * 24 * 30
const PKCE_COOKIE_MAX_AGE_SECONDS = 3600

const SignupBodySchema = z.object({
  email: z.string().trim().email('Ingresa un correo electrónico válido.'),
  password: z
    .string()
    .min(8, 'La contraseña debe tener al menos 8 caracteres.')
    .max(128, 'La contraseña no puede superar los 128 caracteres.'),
  template: z.enum(['minimal-gallery', 'editorial', 'immersive']).optional(),
})

export async function POST(request: Request) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Cuerpo JSON inválido.' }, { status: 400 })
  }

  const parsed = SignupBodySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Datos de registro inválidos.' },
      { status: 400 }
    )
  }

  const { email, password, template } = parsed.data
  const origin = new URL(request.url).origin
  const emailRedirectTo = `${origin}/api/auth/callback${template ? `?template=${template}` : ''}`

  const result = await signUpWithEmail({ email, password, emailRedirectTo })
  if (!result.ok) {
    const isDuplicate = /ya existe|already registered|already exists/i.test(result.error)
    return NextResponse.json({ error: result.error }, { status: isDuplicate ? 409 : 400 })
  }

  if (result.needsEmailConfirmation || !result.tokens) {
    const response = NextResponse.json({
      ok: true,
      needsEmailConfirmation: true,
      message: 'Revisa tu correo para confirmar tu cuenta y continuar.',
    })
    if (result.needsEmailConfirmation && result.pkceCookies?.length) {
      const pkceOptions = buildSessionCookieOptions(PKCE_COOKIE_MAX_AGE_SECONDS)
      for (const cookie of result.pkceCookies) {
        const cookieName = cookie.name.startsWith(PKCE_COOKIE_PREFIX)
          ? cookie.name
          : `${PKCE_COOKIE_PREFIX}${cookie.name}`
        response.cookies.set(cookieName, cookie.value, pkceOptions)
      }
    }
    return response
  }

  const redirectTo = template ? `/onboarding?template=${template}` : '/onboarding'
  const response = NextResponse.json({
    ok: true,
    needsEmailConfirmation: false,
    redirectTo,
  })

  response.cookies.set(
    ACCESS_COOKIE,
    result.tokens.accessToken,
    buildSessionCookieOptions(ACCESS_MAX_AGE_SECONDS)
  )
  if (result.tokens.refreshToken) {
    response.cookies.set(
      REFRESH_COOKIE,
      result.tokens.refreshToken,
      buildSessionCookieOptions(REFRESH_MAX_AGE_SECONDS)
    )
  }

  return response
}
