import { mkdir, readFile, writeFile } from 'fs/promises'
import path from 'path'
import { z } from 'zod'
import { isSafeArtistSlug } from '@/lib/auth/verify-api-request'

export type NewsletterSubscriber = {
  email: string
  createdAt: string
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
  const filePath = subscribersPath(artistSlug, baseDir)
  const existing = await listSubscribers(artistSlug, baseDir)

  if (existing.some((s) => s.email.toLowerCase() === normalized)) {
    return { alreadySubscribed: true, total: existing.length }
  }

  const next = [...existing, { email: normalized, createdAt: new Date().toISOString() }]
  await mkdir(path.dirname(filePath), { recursive: true })
  await writeFile(filePath, JSON.stringify(next, null, 2), 'utf-8')
  return { alreadySubscribed: false, total: next.length }
}
