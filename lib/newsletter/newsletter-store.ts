import { mkdir, readFile, writeFile } from 'fs/promises'
import path from 'path'
import { z } from 'zod'
import { isSafeArtistSlug } from '@/lib/auth/verify-api-request'
import { getStorageBackend, getSupabaseAdminClient } from '@/lib/cloud/supabase-client'

export const MAX_SUBSCRIBERS_PER_ARTIST = 5000
export const NEWSLETTER_RATE_LIMIT_MAX = 10
export const NEWSLETTER_RATE_LIMIT_WINDOW_MS = 60_000

export type NewsletterSubscriber = {
  email: string
  createdAt: string
}

type RateLimitEntry = {
  count: number
  resetAt: number
}

const newsletterRateLimit = new Map<string, RateLimitEntry>()

/** Resetea el estado del rate limiter en memoria para pruebas deterministas. */
export function resetNewsletterRateLimitForTests(): void {
  newsletterRateLimit.clear()
}

/** Verifica y consume una solicitud del cupo por clave `ip:artistSlug`. */
export function consumeNewsletterRateLimit(key: string, now = Date.now()): boolean {
  if (newsletterRateLimit.size > 1000) {
    for (const [k, entry] of newsletterRateLimit.entries()) {
      if (now >= entry.resetAt) {
        newsletterRateLimit.delete(k)
      }
    }
  }

  const entry = newsletterRateLimit.get(key)
  if (!entry || now >= entry.resetAt) {
    newsletterRateLimit.set(key, { count: 1, resetAt: now + NEWSLETTER_RATE_LIMIT_WINDOW_MS })
    return true
  }

  if (entry.count >= NEWSLETTER_RATE_LIMIT_MAX) {
    return false
  }

  entry.count += 1
  return true
}

const EmailSchema = z.string().trim().email().max(180)

function subscribersPath(artistSlug: string, baseDir?: string): string {
  if (!isSafeArtistSlug(artistSlug)) {
    throw new Error('Slug de artista inválido')
  }
  const root = baseDir ?? path.join(process.cwd(), 'data', 'artists')
  return path.join(root, artistSlug, 'subscribers.json')
}

export async function listSubscribers(
  artistSlug: string,
  baseDir?: string
): Promise<NewsletterSubscriber[]> {
  if (!isSafeArtistSlug(artistSlug)) {
    throw new Error('Slug de artista inválido')
  }

  if (!baseDir && getStorageBackend() === 'cloud') {
    const supabase = getSupabaseAdminClient()
    const { data, error } = await supabase
      .from('newsletter_subscribers')
      .select('email, created_at')
      .eq('artist_slug', artistSlug)
      .order('created_at', { ascending: true })

    if (error) {
      throw new Error(error.message)
    }

    return (data ?? []).map((row) => ({
      email: String(row.email),
      createdAt: String(row.created_at),
    }))
  }

  const filePath = subscribersPath(artistSlug, baseDir)
  try {
    const raw = await readFile(filePath, 'utf-8')
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed.filter(
      (item): item is NewsletterSubscriber =>
        typeof item === 'object' &&
        item !== null &&
        typeof (item as NewsletterSubscriber).email === 'string' &&
        typeof (item as NewsletterSubscriber).createdAt === 'string'
    )
  } catch (err) {
    if (
      typeof err === 'object' &&
      err !== null &&
      'code' in err &&
      (err as NodeJS.ErrnoException).code === 'ENOENT'
    ) {
      return []
    }
    throw err
  }
}

export async function addSubscriber(
  artistSlug: string,
  rawEmail: string,
  baseDir?: string
): Promise<{ alreadySubscribed: boolean; total: number }> {
  const parsedEmail = EmailSchema.safeParse(rawEmail)
  if (!parsedEmail.success) {
    throw new Error('Correo electrónico inválido')
  }
  const normalized = parsedEmail.data.toLowerCase()

  if (!baseDir && getStorageBackend() === 'cloud') {
    const existing = await listSubscribers(artistSlug)

    if (existing.some((s) => s.email.toLowerCase() === normalized)) {
      return { alreadySubscribed: true, total: existing.length }
    }

    if (existing.length >= MAX_SUBSCRIBERS_PER_ARTIST) {
      throw new Error('Se alcanzó el límite máximo de suscriptores para este artista')
    }

    const supabase = getSupabaseAdminClient()
    const { error } = await supabase
      .from('newsletter_subscribers')
      .insert({ artist_slug: artistSlug, email: normalized })

    if (error) {
      if ('code' in error && error.code === '23505') {
        return { alreadySubscribed: true, total: existing.length }
      }
      throw new Error(error.message)
    }

    return { alreadySubscribed: false, total: existing.length + 1 }
  }

  const filePath = subscribersPath(artistSlug, baseDir)
  const existing = await listSubscribers(artistSlug, baseDir)

  if (existing.some((s) => s.email.toLowerCase() === normalized)) {
    return { alreadySubscribed: true, total: existing.length }
  }

  if (existing.length >= MAX_SUBSCRIBERS_PER_ARTIST) {
    throw new Error('Se alcanzó el límite máximo de suscriptores para este artista')
  }

  const next = [...existing, { email: normalized, createdAt: new Date().toISOString() }]
  await mkdir(path.dirname(filePath), { recursive: true })
  await writeFile(filePath, JSON.stringify(next, null, 2), 'utf-8')
  return { alreadySubscribed: false, total: next.length }
}
