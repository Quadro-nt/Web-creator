/**
 * @jest-environment node
 */
import { describe, it, expect, afterAll } from '@jest/globals'
import { mkdir, rm, writeFile } from 'fs/promises'
import path from 'path'
import {
  addSubscriber,
  listSubscribers,
  MAX_SUBSCRIBERS_PER_ARTIST,
} from '../newsletter-store'

const TEMP_ROOT = path.join(process.cwd(), '.tmp-test-newsletter')

afterAll(async () => {
  await rm(TEMP_ROOT, { recursive: true, force: true })
})

describe('newsletter-store', () => {
  it('agrega y lista suscriptores por artista sin duplicar correos', async () => {
    const first = await addSubscriber('luna-vega', 'Coleccionista@Ejemplo.com', TEMP_ROOT)
    expect(first).toEqual({ alreadySubscribed: false, total: 1 })

    const dup = await addSubscriber('luna-vega', 'coleccionista@ejemplo.com', TEMP_ROOT)
    expect(dup).toEqual({ alreadySubscribed: true, total: 1 })

    const second = await addSubscriber('luna-vega', 'galeria@ejemplo.com', TEMP_ROOT)
    expect(second).toEqual({ alreadySubscribed: false, total: 2 })

    const list = await listSubscribers('luna-vega', TEMP_ROOT)
    expect(list).toHaveLength(2)
    expect(list[0].email).toBe('coleccionista@ejemplo.com')
  })

  it('rechaza correos inválidos o slugs inseguros', async () => {
    await expect(addSubscriber('luna-vega', 'no-es-correo', TEMP_ROOT)).rejects.toThrow()
    await expect(addSubscriber('../secret', 'ok@ejemplo.com', TEMP_ROOT)).rejects.toThrow()
  })

  it('impide agregar nuevos correos al alcanzar MAX_SUBSCRIBERS_PER_ARTIST', async () => {
    expect(MAX_SUBSCRIBERS_PER_ARTIST).toBe(5000)
    const slug = 'artista-lleno'
    const artistDir = path.join(TEMP_ROOT, slug)
    await mkdir(artistDir, { recursive: true })
    const fullList = Array.from({ length: MAX_SUBSCRIBERS_PER_ARTIST }, (_, i) => ({
      email: `user${i}@ejemplo.com`,
      createdAt: '2026-01-01T00:00:00.000Z',
    }))
    await writeFile(path.join(artistDir, 'subscribers.json'), JSON.stringify(fullList), 'utf-8')

    await expect(addSubscriber(slug, 'nuevo@ejemplo.com', TEMP_ROOT)).rejects.toThrow(
      /límite máximo/i
    )
    const existing = await addSubscriber(slug, 'user0@ejemplo.com', TEMP_ROOT)
    expect(existing).toEqual({ alreadySubscribed: true, total: MAX_SUBSCRIBERS_PER_ARTIST })
  })
})
