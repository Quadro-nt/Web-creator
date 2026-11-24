import { NextResponse } from 'next/server'
import { z } from 'zod'
import {
  addSubscriber,
  consumeNewsletterRateLimit,
  listSubscribers,
} from '@/lib/newsletter/newsletter-store'
import { isSafeArtistSlug, verifyEditorRequest } from '@/lib/auth/verify-api-request'
import { getStorageAdapter } from '@/lib/storage'

const PostBodySchema = z.object({
  artistSlug: z.string().min(1),
  email: z.string().trim().email().max(180),
})

function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) {
    const first = forwarded.split(',')[0]?.trim()
    if (first) return first
  }
  const realIp = request.headers.get('x-real-ip')?.trim()
  if (realIp) return realIp
  return 'unknown'
}

export async function GET(request: Request) {
  const url = new URL(request.url)
  const expectedSlug = url.searchParams.get('artistSlug') ?? undefined

  const auth = await verifyEditorRequest(request, expectedSlug)
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const subscribers = await listSubscribers(auth.artistSlug)
  return NextResponse.json({ subscribers, count: subscribers.length })
}

export async function POST(request: Request) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
  }

  const parsed = PostBodySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Ingresa un correo electrónico válido' }, { status: 400 })
  }

  if (!isSafeArtistSlug(parsed.data.artistSlug)) {
    return NextResponse.json({ error: 'Artista inválido' }, { status: 400 })
  }

  const rateKey = `${getClientIp(request)}:${parsed.data.artistSlug}`
  if (!consumeNewsletterRateLimit(rateKey)) {
    return NextResponse.json(
      { error: 'Demasiadas solicitudes. Intenta de nuevo más tarde.' },
      { status: 429 }
    )
  }

  const published = await getStorageAdapter().getPublished(parsed.data.artistSlug)
  if (published === null) {
    return NextResponse.json({ error: 'Artista no encontrado' }, { status: 404 })
  }

  try {
    const result = await addSubscriber(parsed.data.artistSlug, parsed.data.email)
    return NextResponse.json({ ok: true, ...result })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'No se pudo guardar la suscripción'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
