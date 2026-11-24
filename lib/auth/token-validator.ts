import { createHash, timingSafeEqual } from 'crypto'
import { readFile, readdir } from 'fs/promises'
import path from 'path'
import { isSafeArtistSlug } from './verify-api-request'

function artistsRoot(): string {
  return path.join(process.cwd(), 'data', 'artists')
}

function sha256Digest(value: string): Buffer {
  return createHash('sha256').update(value, 'utf8').digest()
}

/** Compara dos tokens en tiempo constante usando digests SHA-256. */
export function constantTimeTokenEqual(a: string, b: string): boolean {
  return timingSafeEqual(sha256Digest(a), sha256Digest(b))
}

async function listArtistSlugs(root: string): Promise<string[]> {
  try {
    const entries = await readdir(root, { withFileTypes: true })
    return entries
      .filter((e) => e.isDirectory() && isSafeArtistSlug(e.name))
      .map((e) => e.name)
  } catch {
    return []
  }
}

async function readTokenFile(root: string, slug: string): Promise<string | null> {
  try {
    const content = await readFile(path.join(root, slug, 'token.txt'), 'utf-8')
    const trimmed = content.trim()
    return trimmed.length > 0 ? trimmed : null
  } catch {
    return null
  }
}

export async function validateEditorToken(
  token: string,
  baseDir?: string
): Promise<string | null> {
  if (!token || token.trim().length === 0) return null
  const incomingDigest = sha256Digest(token.trim())
  const root = baseDir ?? artistsRoot()
  const slugs = await listArtistSlugs(root)
  let matchedSlug: string | null = null
  for (const slug of slugs) {
    const stored = await readTokenFile(root, slug)
    if (stored !== null && timingSafeEqual(incomingDigest, sha256Digest(stored))) {
      if (matchedSlug === null) {
        matchedSlug = slug
      }
    }
  }
  return matchedSlug
}
