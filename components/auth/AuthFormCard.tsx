'use client'

import { useState, type FormEvent } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export type AuthFormCardProps = {
  mode: 'login' | 'signup'
  initialTemplate?: string
  initialError?: string
}

function translateInitialError(errorCode?: string): string | null {
  if (!errorCode) return null
  if (errorCode === 'oauth_unavailable') {
    return 'El inicio con Google no está activo en este entorno. Usa tu correo y contraseña.'
  }
  if (errorCode === 'oauth_failed' || errorCode === 'missing_code') {
    return 'No pudimos completar el acceso con Google. Inténtalo nuevamente.'
  }
  return 'No pudimos completar el acceso. Inténtalo nuevamente.'
}

function GoogleIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-4 w-4 shrink-0"
      viewBox="0 0 24 24"
      fill="none"
    >
      <path
        d="M21.805 10.023H12.18v3.955h5.517c-.238 1.273-.957 2.352-2.04 3.074v2.556h3.3c1.93-1.778 3.043-4.395 3.043-7.495 0-.695-.063-1.364-.195-2.09Z"
        fill="#4285F4"
      />
      <path
        d="M12.18 22c2.755 0 5.066-.914 6.755-2.473l-3.3-2.556c-.914.613-2.083.977-3.455.977-2.656 0-4.906-1.793-5.71-4.203H3.06v2.637C4.74 19.719 8.19 22 12.18 22Z"
        fill="#34A853"
      />
      <path
        d="M6.47 13.745a5.98 5.98 0 0 1 0-3.49V7.618H3.06a9.996 9.996 0 0 0 0 8.764l3.41-2.637Z"
        fill="#FBBC05"
      />
      <path
        d="M12.18 6.052c1.498 0 2.842.515 3.9 1.527l2.926-2.926C17.242 3.012 14.93 2 12.18 2 8.19 2 4.74 4.281 3.06 7.618l3.41 2.637c.804-2.41 3.054-4.203 5.71-4.203Z"
        fill="#EA4335"
      />
    </svg>
  )
}

/** Editorial authentication card supporting Google OAuth and email/password login or signup. */
export function AuthFormCard({ mode, initialTemplate, initialError }: AuthFormCardProps) {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(() => translateInitialError(initialError))
  const [confirmationMessage, setConfirmationMessage] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const isSignup = mode === 'signup'
  const googleHref = `/api/auth/oauth/google${
    initialTemplate ? `?template=${encodeURIComponent(initialTemplate)}` : ''
  }`

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setConfirmationMessage(null)

    const trimmedEmail = email.trim()
    if (!trimmedEmail) {
      setError('Ingresa tu correo electrónico.')
      return
    }
    if (isSignup && password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres.')
      return
    }
    if (!isSignup && !password) {
      setError('Ingresa tu contraseña.')
      return
    }

    setIsSubmitting(true)
    try {
      const endpoint = isSignup ? '/api/auth/signup' : '/api/auth/login'
      const payload =
        isSignup && initialTemplate
          ? { email: trimmedEmail, password, template: initialTemplate }
          : { email: trimmedEmail, password }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = (await response.json().catch(() => ({}))) as {
        ok?: boolean
        error?: string
        needsEmailConfirmation?: boolean
        redirectTo?: string
      }

      if (!response.ok || !data.ok) {
        setError(data.error ?? 'No pudimos procesar tu solicitud. Inténtalo nuevamente.')
        return
      }

      if (data.needsEmailConfirmation) {
        setConfirmationMessage(
          'Revisa tu correo electrónico para confirmar tu cuenta y continuar con la creación de tu sitio.'
        )
        setPassword('')
        return
      }

      router.push(data.redirectTo || '/onboarding')
      router.refresh()
    } catch {
      setError('No pudimos conectarnos con el servidor. Inténtalo nuevamente.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="w-full max-w-md rounded-2xl border border-[#161616]/12 bg-white/80 p-7 shadow-sm backdrop-blur-sm sm:p-9">
      <div className="mb-7">
        <p className="text-xs font-medium uppercase tracking-[0.22em] text-[#B86B35]">
          Quadro Sites
        </p>
        <h1 className="mt-2 font-serif text-3xl font-normal tracking-tight text-[#161616]">
          {isSignup ? 'Crea tu espacio editorial' : 'Bienvenido de vuelta'}
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-[#161616]/70">
          {isSignup
            ? 'Publica tu portafolio artístico y recibe consultas directas en minutos.'
            : 'Ingresa a tu estudio para editar obras, textos y publicar cambios.'}
        </p>
      </div>

      {error && (
        <div
          role="alert"
          className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
        >
          {error}
        </div>
      )}

      {confirmationMessage && (
        <div
          role="status"
          className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900"
        >
          {confirmationMessage}
        </div>
      )}

      <a
        href={googleHref}
        className="flex w-full items-center justify-center gap-2.5 rounded-xl border border-[#161616]/20 bg-[#FAF8F5] px-4 py-2.5 text-sm font-medium text-[#161616] transition hover:border-[#161616]/40 hover:bg-[#161616]/[0.03]"
      >
        <GoogleIcon />
        <span>Continuar con Google</span>
      </a>

      <div className="my-6 flex items-center gap-3">
        <div className="h-px flex-1 bg-[#161616]/12" />
        <span className="text-xs uppercase tracking-[0.14em] text-[#161616]/50">
          o con tu correo
        </span>
        <div className="h-px flex-1 bg-[#161616]/12" />
      </div>

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <div>
          <label
            htmlFor="auth-email"
            className="mb-1.5 block text-xs font-medium uppercase tracking-[0.12em] text-[#161616]/75"
          >
            Correo electrónico
          </label>
          <input
            id="auth-email"
            name="email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="tu@correo.com"
            className="w-full rounded-xl border border-[#161616]/20 bg-[#FAF8F5] px-3.5 py-2.5 text-sm text-[#161616] placeholder:text-[#161616]/40 focus:border-[#B86B35] focus:outline-none focus:ring-2 focus:ring-[#B86B35]/20"
          />
        </div>

        <div>
          <label
            htmlFor="auth-password"
            className="mb-1.5 block text-xs font-medium uppercase tracking-[0.12em] text-[#161616]/75"
          >
            Contraseña
          </label>
          <input
            id="auth-password"
            name="password"
            type="password"
            required
            minLength={isSignup ? 8 : undefined}
            autoComplete={isSignup ? 'new-password' : 'current-password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={isSignup ? 'Mínimo 8 caracteres' : '••••••••'}
            className="w-full rounded-xl border border-[#161616]/20 bg-[#FAF8F5] px-3.5 py-2.5 text-sm text-[#161616] placeholder:text-[#161616]/40 focus:border-[#B86B35] focus:outline-none focus:ring-2 focus:ring-[#B86B35]/20"
          />
          {isSignup && (
            <p className="mt-1.5 text-xs text-[#161616]/60">
              Usa al menos 8 caracteres para proteger tu estudio.
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="mt-2 w-full rounded-xl bg-[#161616] px-4 py-2.5 text-sm font-medium text-[#FAF8F5] transition hover:bg-[#B86B35] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting
            ? isSignup
              ? 'Creando cuenta...'
              : 'Iniciando sesión...'
            : isSignup
              ? 'Crear cuenta'
              : 'Iniciar sesión'}
        </button>
      </form>

      <div className="mt-6 space-y-3 border-t border-[#161616]/10 pt-5 text-center text-sm">
        <p className="text-[#161616]/70">
          {isSignup ? (
            <>
              ¿Ya tienes cuenta?{' '}
              <Link
                href="/login"
                className="font-medium text-[#B86B35] underline-offset-4 hover:underline"
              >
                Iniciar sesión
              </Link>
            </>
          ) : (
            <>
              ¿Aún no tienes cuenta?{' '}
              <Link
                href={
                  initialTemplate
                    ? `/signup?template=${encodeURIComponent(initialTemplate)}`
                    : '/signup'
                }
                className="font-medium text-[#B86B35] underline-offset-4 hover:underline"
              >
                Crear cuenta
              </Link>
            </>
          )}
        </p>

        <div>
          <Link
            href="/"
            className="inline-block text-xs font-medium text-[#161616]/60 transition hover:text-[#161616]"
          >
            ← Volver al inicio
          </Link>
        </div>
      </div>
    </div>
  )
}
