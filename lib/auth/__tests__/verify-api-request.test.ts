/**
 * @jest-environment node
 */
import { describe, it, expect, jest, beforeEach, afterAll } from '@jest/globals'
import { mkdir, rm, writeFile } from 'fs/promises'
import path from 'path'
import { verifyEditorRequest } from '../verify-api-request'
import { constantTimeTokenEqual, validateEditorToken } from '../token-validator'

describe('verifyEditorRequest', () => {
  const validateMock = jest.fn<(token: string) => Promise<string | null>>()

  beforeEach(() => {
    validateMock.mockReset()
  })

  it('retorna 401 cuando falta el token', async () => {
    const req = new Request('http://localhost/api/draft', { method: 'POST' })
    const res = await verifyEditorRequest(req, 'luna-vega', validateMock)
    expect(res.ok).toBe(false)
    if (!res.ok) expect(res.status).toBe(401)
    expect(validateMock).not.toHaveBeenCalled()
  })

  it('retorna 401 cuando el token es inválido', async () => {
    validateMock.mockResolvedValue(null)
    const req = new Request('http://localhost/api/draft', {
      method: 'POST',
      headers: { 'x-editor-token': 'invalido' },
    })
    const res = await verifyEditorRequest(req, 'luna-vega', validateMock)
    expect(res.ok).toBe(false)
    if (!res.ok) expect(res.status).toBe(401)
  })

  it('retorna 403 cuando el token pertenece a otro artista', async () => {
    validateMock.mockResolvedValue('marco-torres')
    const req = new Request('http://localhost/api/draft', {
      method: 'POST',
      headers: { 'x-editor-token': 'token-marco' },
    })
    const res = await verifyEditorRequest(req, 'luna-vega', validateMock)
    expect(res.ok).toBe(false)
    if (!res.ok) expect(res.status).toBe(403)
  })

  it('retorna 403 si el expectedSlug tiene caracteres inseguros', async () => {
    validateMock.mockResolvedValue('luna-vega')
    const req = new Request('http://localhost/api/draft', {
      method: 'POST',
      headers: { 'x-editor-token': 'token-luna' },
    })
    const res = await verifyEditorRequest(req, '../luna-vega', validateMock)
    expect(res.ok).toBe(false)
    if (!res.ok) expect(res.status).toBe(403)
  })

  it('retorna ok y artistSlug cuando el token coincide', async () => {
    validateMock.mockResolvedValue('luna-vega')
    const req = new Request('http://localhost/api/draft', {
      method: 'POST',
      headers: { 'x-editor-token': 'token-luna' },
    })
    const res = await verifyEditorRequest(req, 'luna-vega', validateMock)
    expect(res).toEqual({ ok: true, artistSlug: 'luna-vega' })
  })

  it('acepta Authorization Bearer como respaldo', async () => {
    validateMock.mockResolvedValue('sofia-rios')
    const req = new Request('http://localhost/api/works', {
      method: 'GET',
      headers: { authorization: 'Bearer token-sofia' },
    })
    const res = await verifyEditorRequest(req, undefined, validateMock)
    expect(res).toEqual({ ok: true, artistSlug: 'sofia-rios' })
  })
})

describe('validateEditorToken y comparación en tiempo constante', () => {
  const TEMP_ARTISTS_ROOT = path.join(process.cwd(), '.tmp-test-tokens')

  afterAll(async () => {
    await rm(TEMP_ARTISTS_ROOT, { recursive: true, force: true })
  })

  it('compara tokens de distinta longitud sin error ni coincidencia falsa', () => {
    expect(constantTimeTokenEqual('abc-123', 'abc-123')).toBe(true)
    expect(constantTimeTokenEqual('abc-123', 'abc-124')).toBe(false)
    expect(constantTimeTokenEqual('corto', 'token-mucho-mas-largo')).toBe(false)
  })

  it('valida token sintético e ignora carpetas con slugs inseguros', async () => {
    await mkdir(path.join(TEMP_ARTISTS_ROOT, 'artista-valido'), { recursive: true })
    await writeFile(
      path.join(TEMP_ARTISTS_ROOT, 'artista-valido', 'token.txt'),
      '  synthetic-token-alpha  \n',
      'utf-8'
    )

    await mkdir(path.join(TEMP_ARTISTS_ROOT, 'Carpeta_Insegura'), { recursive: true })
    await writeFile(
      path.join(TEMP_ARTISTS_ROOT, 'Carpeta_Insegura', 'token.txt'),
      'synthetic-token-unsafe',
      'utf-8'
    )

    await expect(
      validateEditorToken('synthetic-token-alpha', TEMP_ARTISTS_ROOT)
    ).resolves.toBe('artista-valido')
    await expect(
      validateEditorToken('synthetic-token-unsafe', TEMP_ARTISTS_ROOT)
    ).resolves.toBeNull()
    await expect(
      validateEditorToken('token-inexistente', TEMP_ARTISTS_ROOT)
    ).resolves.toBeNull()
    await expect(validateEditorToken('   ', TEMP_ARTISTS_ROOT)).resolves.toBeNull()
  })
})
