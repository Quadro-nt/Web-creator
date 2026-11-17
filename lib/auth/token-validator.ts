import { readFile, readdir } from 'fs/promises'
import path from 'path'

function artistsRoot(): string {
  return path.join(process.cwd(), 'data', 'artists')
}

async function listArtistSlugs(): Promise<string[]> {
  try {
    const entries = await readdir(artistsRoot(), { withFileTypes: true })
    return entries.filter((e) => e.isDirectory()).map((e) => e.name)
  } catch {
    return []
  }
}

async function readTokenFile(slug: string): Promise<string | null> {
  try {
    const content = await readFile(
      path.join(artistsRoot(), slug, 'token.txt'),
      'utf-8'
    )
    const trimmed = content.trim()
    return trimmed.length > 0 ? trimmed : null
  } catch {
    return null
  }
}

export async function validateEditorToken(token: string): Promise<string | null> {
  if (!token || token.trim().length === 0) return null
  const incoming = token.trim()
  const slugs = await listArtistSlugs()
  for (const slug of slugs) {
    const stored = await readTokenFile(slug)
    if (stored !== null && stored === incoming) {
      return slug
    }
  }
  return null
}
