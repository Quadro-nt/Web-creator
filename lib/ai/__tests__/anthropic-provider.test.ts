import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals'
import { AnthropicProvider, extractJsonPayload } from '@/lib/ai/anthropic-provider'
import { defaultSiteConfig, SiteConfigSchema } from '@/lib/schemas/site-config.schema'
import fixtureResponse from './fixtures/anthropic-messages-response.json'

const TEST_API_KEY = 'sk-ant-test-placeholder-key-0000'

function mockJsonResponse(body: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  } as unknown as Response
}

describe('AnthropicProvider', () => {
  const originalEnv = process.env
  const originalFetch = global.fetch

  beforeEach(() => {
    process.env = { ...originalEnv, AI_API_KEY: TEST_API_KEY }
    delete process.env.AI_MODEL
  })

  afterEach(() => {
    process.env = originalEnv
    global.fetch = originalFetch
    jest.restoreAllMocks()
  })

  it('lanza error en el constructor si falta AI_API_KEY', () => {
    delete process.env.AI_API_KEY
    expect(() => new AnthropicProvider()).toThrow(/AI_API_KEY/i)
  })

  it('procesa exitosamente el fixture oficial verificando headers, modelo default y schema', async () => {
    const fetchMock = jest.fn<typeof fetch>().mockResolvedValue(mockJsonResponse(fixtureResponse))
    global.fetch = fetchMock

    const provider = new AnthropicProvider()
    const result = await provider.suggestConfig({
      currentConfig: defaultSiteConfig,
      prompt: 'Haz el sitio más editorial y cálido',
      schema: '{"type":"object"}',
    })

    expect(fetchMock).toHaveBeenCalledTimes(1)
    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe('https://api.anthropic.com/v1/messages')
    expect(init?.method).toBe('POST')
    expect(init?.headers).toEqual({
      'content-type': 'application/json',
      'x-api-key': TEST_API_KEY,
      'anthropic-version': '2023-06-01',
    })
    expect(init?.signal).toBeDefined()

    const parsedBody = JSON.parse(String(init?.body))
    expect(parsedBody.model).toBe('claude-haiku-4-5')
    expect(parsedBody.max_tokens).toBe(4096)
    expect(parsedBody.messages).toHaveLength(1)
    expect(parsedBody.messages[0].role).toBe('user')
    expect(typeof parsedBody.system).toBe('string')

    expect(result.explanation).toContain('editorial')
    expect(result.unsatisfied).toEqual([])
    expect(SiteConfigSchema.safeParse(result.newConfig).success).toBe(true)
  })

  it('permite sobrescribir el modelo via AI_MODEL y opciones del constructor', async () => {
    process.env.AI_MODEL = 'claude-sonnet-4-5'
    const fetchMock = jest.fn<typeof fetch>().mockResolvedValue(mockJsonResponse(fixtureResponse))
    global.fetch = fetchMock

    const providerFromEnv = new AnthropicProvider()
    await providerFromEnv.suggestConfig({
      currentConfig: defaultSiteConfig,
      prompt: 'Ajustar tipografía',
      schema: '{}',
    })

    const envBody = JSON.parse(String(fetchMock.mock.calls[0][1]?.body))
    expect(envBody.model).toBe('claude-sonnet-4-5')

    const providerFromOptions = new AnthropicProvider({
      apiKey: 'sk-ant-option-key-1111',
      model: 'claude-opus-4-1',
      timeoutMs: 12000,
    })
    await providerFromOptions.suggestConfig({
      currentConfig: defaultSiteConfig,
      prompt: 'Ajustar tipografía',
      schema: '{}',
    })

    const optInit = fetchMock.mock.calls[1][1]
    const optBody = JSON.parse(String(optInit?.body))
    expect(optBody.model).toBe('claude-opus-4-1')
    expect((optInit?.headers as Record<string, string>)['x-api-key']).toBe('sk-ant-option-key-1111')
  })

  it('extrae JSON envuelto en bloque markdown ```json ... ``` y con texto alrededor', async () => {
    const rawPayload = fixtureResponse.content[0].text
    const wrappedResponse = {
      ...fixtureResponse,
      content: [
        {
          type: 'text',
          text: `Aquí está la propuesta solicitada:\n\`\`\`json\n${rawPayload}\n\`\`\`\nAvísame si necesitas otro cambio.`,
        },
      ],
    }

    global.fetch = jest.fn<typeof fetch>().mockResolvedValue(mockJsonResponse(wrappedResponse))

    const provider = new AnthropicProvider()
    const result = await provider.suggestConfig({
      currentConfig: defaultSiteConfig,
      prompt: 'Modo editorial',
      schema: '{}',
    })

    expect(SiteConfigSchema.safeParse(result.newConfig).success).toBe(true)
    expect(result.explanation).toContain('editorial')
  })

  it('extractJsonPayload soporta bloques ``` sin etiqueta y texto con prefijo/sufijo', () => {
    const plain = extractJsonPayload('Prefijo {nota} antes: {"ok": true, "nested": {"a": 1}} y texto después.')
    expect(plain).toEqual({ ok: true, nested: { a: 1 } })

    const genericFence = extractJsonPayload('```\n{"hello": "world"}\n```')
    expect(genericFence).toEqual({ hello: 'world' })
  })

  it.each([
    { status: 401, expectedPattern: /inválida o revocada/i },
    { status: 429, expectedPattern: /límite de solicitudes/i },
    { status: 500, expectedPattern: /no disponible/i },
    { status: 503, expectedPattern: /no disponible/i },
    { status: 400, expectedPattern: /HTTP 400/i },
  ])('maneja error HTTP $status sin filtrar la API key', async ({ status, expectedPattern }) => {
    global.fetch = jest
      .fn<typeof fetch>()
      .mockResolvedValue(mockJsonResponse({ error: { message: `Secret ${TEST_API_KEY}` } }, status))

    const provider = new AnthropicProvider()

    let capturedError: Error | undefined
    try {
      await provider.suggestConfig({
        currentConfig: defaultSiteConfig,
        prompt: 'Cambio',
        schema: '{}',
      })
    } catch (err) {
      capturedError = err as Error
    }

    expect(capturedError).toBeInstanceOf(Error)
    expect(capturedError?.message).toMatch(expectedPattern)
    expect(capturedError?.message).not.toContain(TEST_API_KEY)
  })

  it('maneja errores de timeout (TimeoutError y AbortError)', async () => {
    const timeoutErr = new Error('The operation timed out')
    timeoutErr.name = 'TimeoutError'

    global.fetch = jest.fn<typeof fetch>().mockRejectedValueOnce(timeoutErr)
    const provider = new AnthropicProvider()

    await expect(
      provider.suggestConfig({
        currentConfig: defaultSiteConfig,
        prompt: 'Cambio',
        schema: '{}',
      })
    ).rejects.toThrow(/tiempo de espera/i)

    const abortErr = new Error('The operation was aborted')
    abortErr.name = 'AbortError'
    global.fetch = jest.fn<typeof fetch>().mockRejectedValueOnce(abortErr)

    await expect(
      provider.suggestConfig({
        currentConfig: defaultSiteConfig,
        prompt: 'Cambio',
        schema: '{}',
      })
    ).rejects.toThrow(/tiempo de espera/i)
  })

  it('lanza error descriptivo cuando el JSON devuelto no cumple SiteConfigSchema', async () => {
    const invalidConfigPayload = JSON.stringify({
      newConfig: {
        ...defaultSiteConfig,
        template: 'plantilla-inexistente',
        styleTokens: {
          ...defaultSiteConfig.styleTokens,
          background: 'javascript:alert(1)',
        },
      },
      explanation: 'Intento inválido',
      unsatisfied: [],
    })

    const invalidResponse = {
      ...fixtureResponse,
      content: [{ type: 'text', text: invalidConfigPayload }],
    }

    global.fetch = jest.fn<typeof fetch>().mockResolvedValue(mockJsonResponse(invalidResponse))

    const provider = new AnthropicProvider()
    await expect(
      provider.suggestConfig({
        currentConfig: defaultSiteConfig,
        prompt: 'Inyectar color inválido',
        schema: '{}',
      })
    ).rejects.toThrow(/SiteConfigSchema/i)
  })

  it('lanza error descriptivo cuando falta la estructura { newConfig, explanation, unsatisfied }', async () => {
    const incompleteResponse = {
      ...fixtureResponse,
      content: [{ type: 'text', text: JSON.stringify({ onlyConfig: defaultSiteConfig }) }],
    }

    global.fetch = jest.fn<typeof fetch>().mockResolvedValue(mockJsonResponse(incompleteResponse))

    const provider = new AnthropicProvider()
    await expect(
      provider.suggestConfig({
        currentConfig: defaultSiteConfig,
        prompt: 'Cambio',
        schema: '{}',
      })
    ).rejects.toThrow(/estructura esperada/i)
  })
})
