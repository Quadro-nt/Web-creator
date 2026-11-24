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

  it('acepta magic bytes válidos de PNG, GIF y WebP', async () => {
    const pngBuffer = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00])
    const gif87Buffer = Buffer.from('GIF87a\x01\x00', 'binary')
    const gif89Buffer = Buffer.from('GIF89a\x01\x00', 'binary')
    const webpBuffer = Buffer.concat([
      Buffer.from('RIFF', 'ascii'),
      Buffer.from([0x00, 0x00, 0x00, 0x00]),
      Buffer.from('WEBP', 'ascii'),
    ])

    const png = await adapter.save('otros-formatos', 'a.png', 'image/png', pngBuffer)
    const gif87 = await adapter.save('otros-formatos', 'b.gif', 'image/gif', gif87Buffer)
    const gif89 = await adapter.save('otros-formatos', 'c.gif', 'image/gif', gif89Buffer)
    const webp = await adapter.save('otros-formatos', 'd.webp', 'image/webp', webpBuffer)

    expect(png.url).toMatch(/\.png$/)
    expect(gif87.url).toMatch(/\.gif$/)
    expect(gif89.url).toMatch(/\.gif$/)
    expect(webp.url).toMatch(/\.webp$/)
  })

  it('rechaza archivos con magic bytes inválidos o que no coinciden con el MIME', async () => {
    await expect(
      adapter.save('luna-vega', 'fake.jpg', 'image/jpeg', Buffer.from('not-a-jpeg', 'utf8'))
    ).rejects.toThrow(/contenido del archivo/i)

    const pngBytes = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
    await expect(
      adapter.save('luna-vega', 'spoof.jpg', 'image/jpeg', pngBytes)
    ).rejects.toThrow(/contenido del archivo/i)

    const fakeWebp = Buffer.concat([
      Buffer.from('RIFF', 'ascii'),
      Buffer.from([0x00, 0x00, 0x00, 0x00]),
      Buffer.from('WAVE', 'ascii'),
    ])
    await expect(
      adapter.save('luna-vega', 'fake.webp', 'image/webp', fakeWebp)
    ).rejects.toThrow(/contenido del archivo/i)

    await expect(
      adapter.save('luna-vega', 'short.png', 'image/png', Buffer.from([0x89, 0x50]))
    ).rejects.toThrow(/contenido del archivo/i)
  })
})
