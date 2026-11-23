/**
 * @jest-environment node
 */
import { describe, it, expect, afterAll } from '@jest/globals'
import { rm } from 'fs/promises'
import path from 'path'
import { addSubscriber, listSubscribers } from '../newsletter-store'

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
})
