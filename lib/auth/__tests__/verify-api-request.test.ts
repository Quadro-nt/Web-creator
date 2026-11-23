/**
 * @jest-environment node
 */
import { describe, it, expect, jest, beforeEach } from '@jest/globals'
import { verifyEditorRequest } from '../verify-api-request'

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
