import { mkdir, readdir, stat, writeFile } from 'fs/promises'
import path from 'path'
import { isSafeArtistSlug } from '@/lib/auth/verify-api-request'

export type MediaItem = {
  url: string
  filename: string
  size?: number
}

export interface MediaAdapter {
  list(artistSlug: string): Promise<MediaItem[]>
  save(artistSlug: string, originalName: string, mimeType: string, buffer: Buffer): Promise<MediaItem>
}

export const MAX_MEDIA_SIZE_BYTES = 5 * 1024 * 1024

export const ALLOWED_MIME_EXTENSIONS: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
}

const IMAGE_EXT_RE = /\.(jpe?g|png|webp|gif)$/i

export function sanitizeMediaFilename(originalName: string, mimeType: string): string {
  const ext = ALLOWED_MIME_EXTENSIONS[mimeType.toLowerCase()]
  if (!ext) {
    throw new Error('Tipo de imagen no soportado. Usa JPG, PNG, WebP o GIF.')
  }

  const baseName = path.basename(originalName, path.extname(originalName))
  const safeBase = baseName
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40)

  const prefix = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
  return `${prefix}-${safeBase || 'imagen'}${ext}`
}

export function createLocalMediaAdapter(uploadsRoot?: string): MediaAdapter {
  const rootDir = uploadsRoot ?? path.join(process.cwd(), 'public', 'uploads')

  function artistUploadDir(artistSlug: string): string {
    if (!isSafeArtistSlug(artistSlug)) {
      throw new Error('Slug de artista inválido')
    }
    return path.join(rootDir, artistSlug)
  }

  return {
    async list(artistSlug: string): Promise<MediaItem[]> {
      const dir = artistUploadDir(artistSlug)
      let entries
      try {
        entries = await readdir(dir, { withFileTypes: true })
      } catch (err) {
        if (typeof err === 'object' && err !== null && 'code' in err && (err as NodeJS.ErrnoException).code === 'ENOENT') {
          return []
        }
        throw err
      }

      const files = entries.filter((e) => e.isFile() && IMAGE_EXT_RE.test(e.name))
      const items: Array<MediaItem & { mtimeMs: number }> = []
      for (const file of files) {
        const fileStat = await stat(path.join(dir, file.name))
        items.push({
          url: `/uploads/${artistSlug}/${file.name}`,
          filename: file.name,
          size: fileStat.size,
          mtimeMs: fileStat.mtimeMs,
        })
      }

      items.sort((a, b) => b.mtimeMs - a.mtimeMs)
      return items.map(({ url, filename, size }) => ({ url, filename, size }))
    },

    async save(artistSlug: string, originalName: string, mimeType: string, buffer: Buffer): Promise<MediaItem> {
      const dir = artistUploadDir(artistSlug)
      if (buffer.byteLength === 0) {
        throw new Error('El archivo está vacío')
      }
      if (buffer.byteLength > MAX_MEDIA_SIZE_BYTES) {
        throw new Error('La imagen supera el máximo de 5 MB')
      }

      const filename = sanitizeMediaFilename(originalName, mimeType)
      await mkdir(dir, { recursive: true })
      await writeFile(path.join(dir, filename), buffer)

      return {
        url: `/uploads/${artistSlug}/${filename}`,
        filename,
        size: buffer.byteLength,
      }
    },
  }
}
