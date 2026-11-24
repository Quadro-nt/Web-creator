import { createHash, timingSafeEqual } from 'crypto'
import { readFile, readdir } from 'fs/promises'
import path from 'path'
import { getStorageBackend, getSupabaseAdminClient } from '../cloud/supabase-client'
import { isSafeArtistSlug } from './verify-api-request'

const SHA256_HEX_RE = /^[0-9a-f]{64}$/i

function artistsRoot(): string {
  return path.join(process.cwd(), 'data', 'artists')
}

function sha256Digest(value: string): Buffer {
  return createHash('sha256').update(value, 'utf8').digest()
}

/** Computes the lowercase hex SHA-256 digest of a token string. */
export function hashTokenSha256(value: string): string {
  return createHash('sha256').update(value, 'utf8').digest('hex')
}

/** Compara dos tokens en tiempo constante usando digests SHA-256. */
export function constantTimeTokenEqual(a: string, b: string): boolean {
  return timingSafeEqual(sha256Digest(a), sha256Digest(b))
}

function matchDigestAgainstHex(incomingDigest: Buffer, hexHash: unknown): boolean {
  if (typeof hexHash !== 'string' || !SHA256_HEX_RE.test(hexHash)) {
    return false
  }
  const storedDigest = Buffer.from(hexHash, 'hex')
  if (storedDigest.length !== incomingDigest.length) {
    return false
  }
  return timingSafeEqual(incomingDigest, storedDigest)
}

function findMatchingSlugFromPairs(
  incomingDigest: Buffer,
  entries: Iterable<[string, unknown]>
): string | null {
  let matchedSlug: string | null = null
  for (const [slug, tokenHash] of entries) {
    if (!isSafeArtistSlug(slug)) continue
    if (matchDigestAgainstHex(incomingDigest, tokenHash) && matchedSlug === null) {
      matchedSlug = slug
    }
  }
  return matchedSlug
}

async function validateCloudTokenFromSupabase(incomingDigest: Buffer): Promise<string | null> {
  try {
    const supabase = getSupabaseAdminClient()
    const { data, error } = await supabase.from('artists').select('slug, token_hash')
    if (error || !Array.isArray(data)) {
      return null
    }
    const pairs: Array<[string, unknown]> = []
    for (const row of data) {
      if (row && typeof row === 'object' && typeof row.slug === 'string') {
        pairs.push([row.slug, (row as { token_hash?: unknown }).token_hash])
      }
    }
    return findMatchingSlugFromPairs(incomingDigest, pairs)
  } catch {
    return null
  }
}

function validateCloudTokenFromEnv(incomingDigest: Buffer): string | null {
  const raw = process.env.ARTIST_TOKEN_HASHES
  if (!raw || raw.trim().length === 0) {
    return null
  }
  try {
    const parsed: unknown = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return null
    }
    return findMatchingSlugFromPairs(incomingDigest, Object.entries(parsed))
  } catch {
    return null
  }
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

async function validateFileToken(incomingDigest: Buffer, root: string): Promise<string | null> {
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

export async function validateEditorToken(
  token: string,
  baseDir?: string
): Promise<string | null> {
  if (!token || token.trim().length === 0) return null
  const incomingDigest = sha256Digest(token.trim())

  if (!baseDir && getStorageBackend() === 'cloud') {
    const dbMatch = await validateCloudTokenFromSupabase(incomingDigest)
    if (dbMatch !== null) {
      return dbMatch
    }
    return validateCloudTokenFromEnv(incomingDigest)
  }

  return validateFileToken(incomingDigest, baseDir ?? artistsRoot())
}
