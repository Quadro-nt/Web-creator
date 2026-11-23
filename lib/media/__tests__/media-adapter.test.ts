/**
 * @jest-environment node
 */
import { describe, it, expect, afterAll } from '@jest/globals'
import { rm } from 'fs/promises'
import path from 'path'
import {
  MAX_MEDIA_SIZE_BYTES,
  createLocalMediaAdapter,
  sanitizeMediaFilename,
} from '../media-adapter'

const TEMP_ROOT = path.join(process.cwd(), '.tmp-test-uploads')

afterAll(async () => {
  await rm(TEMP_ROOT, { recursive: true, force: true })
})

describe('createLocalMediaAdapter', () => {
  const adapter = createLocalMediaAdapter(TEMP_ROOT)

  it('sanitiza nombres con path traversal y asigna extensión del MIME válido', () => {
    const name = sanitizeMediaFilename('../../mi foto FINAL!.jpeg', 'image/png')
    expect(name).not.toContain('..')
    expect(name).not.toContain('/')
    expect(name).toMatch(/^\d+-[a-z0-9]+-mi-foto-final\.png$/)
  })

  it('rechaza tipos MIME no permitidos', () => {
    expect(() => sanitizeMediaFilename('script.svg', 'image/svg+xml')).toThrow()
  })

  it('rechaza archivos vacíos o que superan el máximo permitido', async () => {
    await expect(
      adapter.save('luna-vega', 'vacio.png', 'image/png', Buffer.alloc(0))
    ).rejects.toThrow()

    await expect(
      adapter.save('luna-vega', 'grande.png', 'image/png', Buffer.alloc(MAX_MEDIA_SIZE_BYTES + 1))
    ).rejects.toThrow()
  })

  it('guarda y lista imágenes válidas por artista', async () => {
    const saved = await adapter.save(
      'luna-vega',
      'Obra Taller.jpg',
      'image/jpeg',
      Buffer.from([0xff, 0xd8, 0xff, 0xe0])
    )

    expect(saved.url).toMatch(/^\/uploads\/luna-vega\/\d+-[a-z0-9]+-obra-taller\.jpg$/)
    const items = await adapter.list('luna-vega')
    expect(items).toHaveLength(1)
    expect(items[0].url).toBe(saved.url)
  })
})
