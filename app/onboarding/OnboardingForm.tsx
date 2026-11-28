'use client'

import { useEffect, useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { normalizeArtistSlug } from '@/lib/auth/reserved-slugs'
import type { TemplateChoice } from '@/lib/onboarding/artist-onboarding'

export type OnboardingFormProps = {
  userEmail: string
  initialTemplate?: TemplateChoice
}

type SlugStatus =
  | { state: 'idle' }
  | { state: 'checking' }
  | { state: 'available' }
  | { state: 'unavailable'; reason?: string }

const TEMPLATE_OPTIONS: Array<{
  id: TemplateChoice
  name: string
  description: string
  colors: {
    background: string
    text: string
    accent: string
  }
}> = [
  {
    id: 'minimal-gallery',
    name: 'Minimal Gallery',
    description: 'Lienzo blanco puro, tipografía limpia y foco absoluto en tus obras.',
    colors: {
      background: '#ffffff',
      text: '#1a1a1a',
      accent: '#b86b35',
    },
  },
  {
    id: 'editorial',
    name: 'Editorial',
    description: 'Papel cálido, serif clásico y ritmo de publicación de galería.',
    colors: {
      background: '#faf7f2',
      text: '#1c1917',
      accent: '#9a3412',
    },
  },
  {
    id: 'immersive',
    name: 'Immersive',
    description: 'Fondo oscuro de alto contraste para obra protagonista a gran escala.',
    colors: {
      background: '#111111',
      text: '#f5f3ef',
      accent: '#d4a373',
    },
  },
]

/** Onboarding wizard form for claiming an artist subdomain and creating the initial site. */
export function OnboardingForm({ userEmail, initialTemplate }: OnboardingFormProps) {
  const router = useRouter()
  const [displayName, setDisplayName] = useState('')
  const [slug, setSlug] = useState('')
  const [slugTouched, setSlugTouched] = useState(false)
  const [whatsappNumber, setWhatsappNumber] = useState('')
  const [template, setTemplate] = useState<TemplateChoice>(
    initialTemplate ?? 'minimal-gallery'
  )
  const [slugStatus, setSlugStatus] = useState<SlugStatus>({ state: 'idle' })
  const [error, setError] = useState<string | null>(null)
  const [errorField, setErrorField] = useState<'displayName' | 'slug' | 'form' | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  useEffect(() => {
    const candidate = slug.trim()
    if (!candidate) {
      setSlugStatus({ state: 'idle' })
      return
    }

    setSlugStatus({ state: 'checking' })
    const controller = new AbortController()

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/onboarding?slug=${encodeURIComponent(candidate)}`,
          { signal: controller.signal }
        )
        const data = (await res.json().catch(() => ({}))) as {
          available?: boolean
          reason?: string
        }
        if (controller.signal.aborted) return

        if (data.available) {
          setSlugStatus({ state: 'available' })
        } else {
          setSlugStatus({ state: 'unavailable', reason: data.reason })
        }
      } catch (err) {
        if ((err as Error).name === 'AbortError') return
        setSlugStatus({ state: 'idle' })
      }
    }, 300)

    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [slug])

  function handleDisplayNameChange(nextValue: string) {
    setDisplayName(nextValue)
    if (!slugTouched) {
      setSlug(normalizeArtistSlug(nextValue))
    }
  }

  function handleSlugChange(nextValue: string) {
    setSlugTouched(true)
    setSlug(nextValue.toLowerCase().replace(/[^a-z0-9-]/g, ''))
  }

  async function handleLogout() {
    setIsLoggingOut(true)
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
    } finally {
      router.push('/login')
      router.refresh()
      setIsLoggingOut(false)
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setErrorField(null)

    const cleanName = displayName.trim()
    const cleanSlug = slug.trim()
    if (!cleanName) {
      setError('Ingresa tu nombre artístico o el título de tu sitio.')
      setErrorField('displayName')
      return
    }
    if (!cleanSlug) {
      setError('Elige una dirección para tu web.')
      setErrorField('slug')
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          displayName: cleanName,
          slug: cleanSlug,
          template,
          ...(whatsappNumber.trim() ? { whatsappNumber: whatsappNumber.trim() } : {}),
        }),
      })

      const data = (await response.json().catch(() => ({}))) as {
        ok?: boolean
        error?: string
        redirectTo?: string
      }

      if (!response.ok || !data.ok) {
        setError(data.error ?? 'No pudimos crear tu sitio. Inténtalo nuevamente.')
        setErrorField('form')
        return
      }

      router.push(data.redirectTo || '/studio')
      router.refresh()
    } catch {
      setError('No pudimos conectarnos con el servidor. Inténtalo nuevamente.')
      setErrorField('form')
    } finally {
      setIsSubmitting(false)
    }
  }

  const displayNameInvalid = Boolean(error && (errorField === 'displayName' || errorField === 'form'))
  const slugHasFormError = Boolean(error && (errorField === 'slug' || errorField === 'form'))
  const slugInvalid = slugStatus.state === 'unavailable' || slugHasFormError
  const slugDescribedBy =
    [
      slugStatus.state !== 'idle' ? 'artist-slug-status' : null,
      slugHasFormError ? 'onboarding-form-error' : null,
    ]
      .filter(Boolean)
      .join(' ') || undefined

  return (
    <div className="mx-auto w-full max-w-2xl">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.22em] text-[#9A5220]">
            Quadro Sites
          </p>
          <p className="mt-1 text-xs text-[#161616]/60">
            Sesión iniciada como <span className="font-medium text-[#161616]">{userEmail}</span>
          </p>
        </div>

        <button
          type="button"
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="rounded-lg border border-[#161616]/15 px-3 py-1.5 text-xs font-medium text-[#161616]/70 transition hover:border-[#161616]/35 hover:text-[#161616] disabled:opacity-50"
        >
          {isLoggingOut ? 'Saliendo...' : 'Cerrar sesión'}
        </button>
      </header>

      <div className="rounded-2xl border border-[#161616]/12 bg-white/85 p-6 shadow-sm backdrop-blur-sm sm:p-9">
        <h1 className="font-serif text-3xl font-normal tracking-tight text-[#161616]">
          Configura tu sitio de artista
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-[#161616]/70">
          Elige tu dirección pública y una plantilla base. Podrás personalizar cada detalle luego en el estudio.
        </p>

        {error && (
          <div
            id="onboarding-form-error"
            role="alert"
            className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-7 space-y-6" noValidate>
          <div>
            <label
              htmlFor="display-name"
              className="mb-1.5 block text-xs font-medium uppercase tracking-[0.12em] text-[#161616]/75"
            >
              Nombre artístico / Título de tu sitio
            </label>
            <input
              id="display-name"
              name="displayName"
              type="text"
              required
              maxLength={80}
              value={displayName}
              onChange={(e) => handleDisplayNameChange(e.target.value)}
              aria-invalid={displayNameInvalid}
              aria-describedby={displayNameInvalid ? 'onboarding-form-error' : undefined}
              placeholder="Valeria Montes"
              className="w-full rounded-xl border border-[#161616]/20 bg-[#FAF8F5] px-3.5 py-2.5 text-sm text-[#161616] placeholder:text-[#161616]/40 focus:border-[#9A5220] focus:outline-none focus:ring-2 focus:ring-[#9A5220]/25"
            />
          </div>

          <div>
            <label
              htmlFor="artist-slug"
              className="mb-1.5 block text-xs font-medium uppercase tracking-[0.12em] text-[#161616]/75"
            >
              Dirección de tu web
            </label>
            <div className="flex items-stretch overflow-hidden rounded-xl border border-[#161616]/20 bg-[#FAF8F5] focus-within:border-[#9A5220] focus-within:ring-2 focus-within:ring-[#9A5220]/25">
              <input
                id="artist-slug"
                name="slug"
                type="text"
                required
                maxLength={40}
                value={slug}
                onChange={(e) => handleSlugChange(e.target.value)}
                aria-invalid={slugInvalid}
                aria-describedby={slugDescribedBy}
                placeholder="valeria-montes"
                className="min-w-0 flex-1 bg-transparent px-3.5 py-2.5 text-sm text-[#161616] placeholder:text-[#161616]/40 focus:outline-none"
              />
              <span className="flex items-center border-l border-[#161616]/12 bg-[#161616]/[0.04] px-3 text-xs font-medium text-[#161616]/65 sm:text-sm">
                .quadro-nt.com
              </span>
            </div>

            <div id="artist-slug-status" className="mt-1.5 min-h-[1.25rem] text-xs" aria-live="polite">
              {slugStatus.state === 'checking' && (
                <span className="text-[#161616]/60">Verificando...</span>
              )}
              {slugStatus.state === 'available' && (
                <span className="font-medium text-emerald-700">Disponible ✓</span>
              )}
              {slugStatus.state === 'unavailable' && (
                <span className="font-medium text-red-700">
                  No disponible{slugStatus.reason ? ` — ${slugStatus.reason}` : ''}
                </span>
              )}
            </div>
          </div>

          <div>
            <label
              htmlFor="whatsapp-number"
              className="mb-1.5 block text-xs font-medium uppercase tracking-[0.12em] text-[#161616]/75"
            >
              WhatsApp para consultas (opcional)
            </label>
            <input
              id="whatsapp-number"
              name="whatsappNumber"
              type="tel"
              inputMode="numeric"
              value={whatsappNumber}
              onChange={(e) => setWhatsappNumber(e.target.value.replace(/\D/g, ''))}
              aria-invalid={false}
              aria-describedby="whatsapp-number-help"
              placeholder="51999000000"
              className="w-full rounded-xl border border-[#161616]/20 bg-[#FAF8F5] px-3.5 py-2.5 text-sm text-[#161616] placeholder:text-[#161616]/40 focus:border-[#9A5220] focus:outline-none focus:ring-2 focus:ring-[#9A5220]/25"
            />
            <p id="whatsapp-number-help" className="mt-1 text-xs text-[#161616]/55">
              Solo números con código de país (sin signos ni espacios).
            </p>
          </div>

          <div>
            <span className="mb-2.5 block text-xs font-medium uppercase tracking-[0.12em] text-[#161616]/75">
              Plantilla inicial
            </span>
            <div className="grid gap-3 sm:grid-cols-3">
              {TEMPLATE_OPTIONS.map((option) => {
                const selected = template === option.id
                return (
                  <button
                    key={option.id}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => setTemplate(option.id)}
                    className={`flex flex-col rounded-xl border p-3.5 text-left transition ${
                      selected
                        ? 'border-[#9A5220] bg-[#9A5220]/[0.06] ring-2 ring-[#9A5220]/30'
                        : 'border-[#161616]/15 bg-[#FAF8F5] hover:border-[#161616]/35'
                    }`}
                  >
                    <div
                      className="mb-3 flex h-12 w-full items-center justify-between rounded-lg border border-black/10 px-3"
                      style={{
                        backgroundColor: option.colors.background,
                        color: option.colors.text,
                      }}
                    >
                      <span className="font-serif text-xs font-medium">Aa</span>
                      <span
                        className="h-3.5 w-3.5 rounded-full border border-black/10"
                        style={{ backgroundColor: option.colors.accent }}
                      />
                    </div>
                    <span className="text-sm font-medium text-[#161616]">
                      {option.name}
                    </span>
                    <span className="mt-1 text-xs leading-relaxed text-[#161616]/65">
                      {option.description}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-xl bg-[#161616] px-4 py-3 text-sm font-medium text-[#FAF8F5] transition hover:bg-[#9A5220] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? 'Creando tu sitio...' : 'Crear mi sitio'}
          </button>
        </form>
      </div>
    </div>
  )
}
