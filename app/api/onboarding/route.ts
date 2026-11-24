import { revalidatePath } from 'next/cache'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getSessionUserFromRequest } from '@/lib/auth/session'
import { createArtistSiteForUser, isSlugAvailable } from '@/lib/onboarding/artist-onboarding'

const OnboardingBodySchema = z.object({
  displayName: z
    .string()
    .trim()
    .min(2, 'El nombre artístico debe tener al menos 2 caracteres.')
    .max(80, 'El nombre artístico no puede superar los 80 caracteres.'),
  slug: z
    .string()
    .trim()
    .min(3, 'El subdominio debe tener al menos 3 caracteres.')
    .max(40, 'El subdominio no puede superar los 40 caracteres.'),
  template: z.enum(['minimal-gallery', 'editorial', 'immersive']),
  whatsappNumber: z.string().trim().max(25, 'El número de WhatsApp es demasiado largo.').optional(),
})

export async function GET(request: Request) {
  const url = new URL(request.url)
  const slug = url.searchParams.get('slug') ?? ''
  const result = await isSlugAvailable(slug)
  return NextResponse.json(result)
}

export async function POST(request: Request) {
  const user = await getSessionUserFromRequest(request)
  if (!user) {
    return NextResponse.json(
      { error: 'Debes iniciar sesión para crear tu sitio' },
      { status: 401 }
    )
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Cuerpo JSON inválido.' }, { status: 400 })
  }

  const parsed = OnboardingBodySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Datos de onboarding inválidos.' },
      { status: 400 }
    )
  }

  const result = await createArtistSiteForUser({
    userId: user.id,
    email: user.email,
    displayName: parsed.data.displayName,
    slug: parsed.data.slug,
    template: parsed.data.template,
    whatsappNumber: parsed.data.whatsappNumber,
  })

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status })
  }

  revalidatePath(`/sites/${result.slug}`, 'layout')
  return NextResponse.json({
    ok: true,
    slug: result.slug,
    redirectTo: '/studio',
  })
}
