import type { SupabaseClient } from '@supabase/supabase-js'
import { isSafeArtistSlug } from '@/lib/auth/verify-api-request'
import { getSupabaseAdminClient, getSupabaseStorageBucket } from '@/lib/cloud/supabase-client'
import {
  hasValidImageMagicBytes,
  IMAGE_EXT_RE,
  MAX_MEDIA_SIZE_BYTES,
  sanitizeMediaFilename,
  type MediaAdapter,
  type MediaItem,
} from './media-adapter'

export type SupabaseMediaAdapterOptions = {
  client?: SupabaseClient
  bucket?: string
}

function assertSafeArtistSlug(artistSlug: string): void {
  if (!isSafeArtistSlug(artistSlug)) {
    throw new Error('Slug de artista inválido')
  }
}

const ensuredBuckets = new Set<string>()

function isBucketNotFoundMessage(message: string | undefined): boolean {
  if (!message) return false
  const normalized = message.toLowerCase()
  return normalized.includes('bucket not found') || normalized.includes('not found')
}

/** Ensures the Supabase Storage bucket exists (as public), creating it on first miss. */
export async function ensureStorageBucketExists(
  client: SupabaseClient,
  bucket: string
): Promise<void> {
  if (ensuredBuckets.has(bucket)) return

  const { data, error } = await client.storage.getBucket(bucket)
  if (data && !error) {
    ensuredBuckets.add(bucket)
    return
  }
  if (error && !isBucketNotFoundMessage(error.message)) {
    throw new Error(
      `No se pudo verificar el bucket "${bucket}" en Supabase Storage: ${error.message}`
    )
  }

  const { error: createError } = await client.storage.createBucket(bucket, {
    public: true,
  })
  if (createError) {
    const alreadyExists = createError.message.toLowerCase().includes('already exists')
    if (!alreadyExists) {
      throw new Error(
        `No se pudo crear el bucket "${bucket}" en Supabase Storage: ${createError.message}. ` +
          'Verificá que el service role key tenga permisos sobre Storage o creá el bucket manualmente.'
      )
    }
  }
  ensuredBuckets.add(bucket)
}

export function resetEnsuredBucketsForTests(): void {
  ensuredBuckets.clear()
}

/** Creates a MediaAdapter backed by Supabase Storage. */
export function createSupabaseMediaAdapter(
  options?: SupabaseMediaAdapterOptions
): MediaAdapter {
  const getClient = (): SupabaseClient => options?.client ?? getSupabaseAdminClient()
  const getBucket = (): string => options?.bucket ?? getSupabaseStorageBucket()

  return {
    async list(artistSlug: string): Promise<MediaItem[]> {
      assertSafeArtistSlug(artistSlug)

      const client = getClient()
      const bucket = getBucket()
      await ensureStorageBucketExists(client, bucket)
      const storage = client.storage.from(bucket)

      const { data, error } = await storage.list(artistSlug, {
        sortBy: { column: 'created_at', order: 'desc' },
      })

      if (error) {
        throw new Error(error.message)
      }

      const items: MediaItem[] = []
      for (const entry of data ?? []) {
        if (!entry.name || !IMAGE_EXT_RE.test(entry.name)) {
          continue
        }
        const {
          data: { publicUrl },
        } = storage.getPublicUrl(`${artistSlug}/${entry.name}`)

        const rawSize = (entry.metadata as Record<string, unknown> | null | undefined)?.size
        if (typeof rawSize === 'number') {
          items.push({ url: publicUrl, filename: entry.name, size: rawSize })
        } else {
          items.push({ url: publicUrl, filename: entry.name })
        }
      }

      return items
    },

    async save(
      artistSlug: string,
      originalName: string,
      mimeType: string,
      buffer: Buffer
    ): Promise<MediaItem> {
      assertSafeArtistSlug(artistSlug)

      if (buffer.byteLength === 0) {
        throw new Error('El archivo está vacío')
      }
      if (buffer.byteLength > MAX_MEDIA_SIZE_BYTES) {
        throw new Error('La imagen supera el máximo de 5 MB')
      }

      const filename = sanitizeMediaFilename(originalName, mimeType)
      if (!hasValidImageMagicBytes(mimeType, buffer)) {
        throw new Error(
          'El contenido del archivo no corresponde a una imagen válida del tipo declarado.'
        )
      }

      const client = getClient()
      const bucket = getBucket()
      await ensureStorageBucketExists(client, bucket)
      const storage = client.storage.from(bucket)
      const objectPath = `${artistSlug}/${filename}`

      const { error } = await storage.upload(objectPath, buffer, {
        contentType: mimeType,
        upsert: false,
      })

      if (error) {
        throw new Error(error.message)
      }

      const {
        data: { publicUrl },
      } = storage.getPublicUrl(objectPath)

      return {
        url: publicUrl,
        filename,
        size: buffer.byteLength,
      }
    },
  }
}
