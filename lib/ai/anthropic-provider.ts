import { z } from 'zod'
import { SiteConfigSchema, type SiteConfig } from '@/lib/schemas/site-config.schema'
import type { AIProvider, AIResponse } from './provider'

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages'
const ANTHROPIC_VERSION = '2023-06-01'
const DEFAULT_MODEL = 'claude-haiku-4-5'
const DEFAULT_TIMEOUT_MS = 25000
const MAX_TOKENS = 4096

export interface AnthropicProviderOptions {
  apiKey?: string
  model?: string
  timeoutMs?: number
}

interface AnthropicMessageResponse {
  content?: Array<{
    type?: string
    text?: string
  }>
}

const AIResponseEnvelopeSchema = z.object({
  newConfig: z.unknown().refine((val) => val !== undefined, {
    message: 'Campo "newConfig" requerido',
  }),
  explanation: z.string(),
  unsatisfied: z.array(z.string()),
})

function isTimeoutOrAbortError(err: unknown): boolean {
  if (!err || typeof err !== 'object') return false
  const name = 'name' in err ? String((err as { name: unknown }).name) : ''
  return name === 'TimeoutError' || name === 'AbortError'
}

function createHttpStatusError(status: number): Error {
  if (status === 401) {
    return new Error('Clave de API de Anthropic inválida o revocada (HTTP 401)')
  }
  if (status === 429) {
    return new Error('Límite de solicitudes alcanzado en Anthropic (HTTP 429)')
  }
  if (status >= 500) {
    return new Error(`Servicio de Anthropic temporalmente no disponible (HTTP ${status})`)
  }
  return new Error(`Error de la API de Anthropic (HTTP ${status})`)
}

function createTimeoutSignal(timeoutMs: number): {
  signal: AbortSignal
  cleanup: () => void
} {
  if (typeof AbortSignal !== 'undefined' && typeof AbortSignal.timeout === 'function') {
    return {
      signal: AbortSignal.timeout(timeoutMs),
      cleanup: () => {},
    }
  }

  const controller = new AbortController()
  const timer = setTimeout(() => {
    const timeoutError = new Error('The operation timed out')
    timeoutError.name = 'TimeoutError'
    controller.abort(timeoutError)
  }, timeoutMs)

  return {
    signal: controller.signal,
    cleanup: () => clearTimeout(timer),
  }
}

function tryParseJsonObjectFromProse(text: string): unknown | undefined {
  for (let start = 0; start < text.length; start++) {
    if (text[start] !== '{') continue

    let depth = 0
    let inString = false
    let escaped = false

    for (let i = start; i < text.length; i++) {
      const ch = text[i]
      if (inString) {
        if (escaped) {
          escaped = false
        } else if (ch === '\\') {
          escaped = true
        } else if (ch === '"') {
          inString = false
        }
        continue
      }

      if (ch === '"') {
        inString = true
      } else if (ch === '{') {
        depth++
      } else if (ch === '}') {
        depth--
        if (depth === 0) {
          const candidate = text.slice(start, i + 1)
          try {
            return JSON.parse(candidate)
          } catch {
            break
          }
        }
      }
    }
  }
  return undefined
}

export function extractJsonPayload(rawText: string): unknown {
  const trimmed = rawText.trim()
  if (!trimmed) {
    throw new Error('La respuesta de Anthropic está vacía')
  }

  if (trimmed.startsWith('{')) {
    try {
      return JSON.parse(trimmed)
    } catch {
      // Fallback to fenced code block or prose extraction
    }
  }

  const fenceRegex = /```(?:json)?\s*([\s\S]*?)\s*```/gi
  let match: RegExpExecArray | null
  while ((match = fenceRegex.exec(trimmed)) !== null) {
    const candidate = match[1].trim()
    if (!candidate) continue
    try {
      return JSON.parse(candidate)
    } catch {
      // Try next code block or balanced object extraction
    }
  }

  const fromProse = tryParseJsonObjectFromProse(trimmed)
  if (fromProse !== undefined) {
    return fromProse
  }

  throw new Error('No se pudo extraer un JSON válido de la respuesta de Anthropic')
}

export class AnthropicProvider implements AIProvider {
  private readonly apiKey: string
  private readonly model: string
  private readonly timeoutMs: number

  constructor(options: AnthropicProviderOptions = {}) {
    const apiKey = (options.apiKey ?? process.env.AI_API_KEY)?.trim()
    if (!apiKey) {
      throw new Error('AI_API_KEY no configurada')
    }

    const envModel = process.env.AI_MODEL?.trim()
    const optModel = options.model?.trim()
    const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS
    if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) {
      throw new Error('timeoutMs debe ser un número positivo')
    }

    this.apiKey = apiKey
    this.model = optModel || envModel || DEFAULT_MODEL
    this.timeoutMs = timeoutMs
  }

  private sanitizeErrorMessage(message: string): string {
    return this.apiKey ? message.split(this.apiKey).join('[REDACTED]') : message
  }

  async suggestConfig(params: {
    currentConfig: SiteConfig
    prompt: string
    schema: string
  }): Promise<AIResponse> {
    const system = [
      'Eres un asistente que ajusta la configuración visual de un sitio de artista.',
      'Recibes la configuración actual (JSON) y un pedido en lenguaje natural.',
      'Devuelves SIEMPRE un JSON con exactamente estas claves: "newConfig", "explanation", "unsatisfied".',
      '- "newConfig": la configuración completa resultante, respetando el JSON Schema entregado.',
      '- "explanation": texto corto en español describiendo los cambios realizados.',
      '- "unsatisfied": arreglo de strings con pedidos que no se pudieron cumplir dentro del esquema (vacío si todo se cumplió).',
      'No publiques. No ejecutes nada. Solo devuelve el JSON.',
    ].join('\n')

    const userMessage = [
      'JSON Schema de la configuración:',
      params.schema,
      '',
      'Configuración actual:',
      JSON.stringify(params.currentConfig, null, 2),
      '',
      'Pedido del artista:',
      params.prompt,
    ].join('\n')

    const { signal, cleanup } = createTimeoutSignal(this.timeoutMs)

    let res: Response
    try {
      res = await fetch(ANTHROPIC_API_URL, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-api-key': this.apiKey,
          'anthropic-version': ANTHROPIC_VERSION,
        },
        body: JSON.stringify({
          model: this.model,
          max_tokens: MAX_TOKENS,
          system,
          messages: [{ role: 'user', content: userMessage }],
        }),
        signal,
      })
    } catch (err) {
      if (isTimeoutOrAbortError(err)) {
        throw new Error('La solicitud a Anthropic excedió el tiempo de espera')
      }
      const rawMsg = err instanceof Error ? err.message : 'Error de red'
      throw new Error(`Error al conectar con Anthropic: ${this.sanitizeErrorMessage(rawMsg)}`)
    } finally {
      cleanup()
    }

    if (!res.ok) {
      throw createHttpStatusError(res.status)
    }

    let data: AnthropicMessageResponse
    try {
      data = (await res.json()) as AnthropicMessageResponse
    } catch (err) {
      if (isTimeoutOrAbortError(err)) {
        throw new Error('La solicitud a Anthropic excedió el tiempo de espera')
      }
      throw new Error('La respuesta de Anthropic no es un JSON válido')
    }

    const textBlock = Array.isArray(data?.content)
      ? data.content.find((c) => c.type === 'text' && typeof c.text === 'string')
      : undefined

    if (!textBlock?.text) {
      throw new Error('La respuesta de Anthropic no contiene un bloque de texto válido')
    }

    const payload = extractJsonPayload(textBlock.text)
    const envelopeResult = AIResponseEnvelopeSchema.safeParse(payload)
    if (!envelopeResult.success) {
      const issues = envelopeResult.error.issues
        .map((i) => `${i.path.join('.') || 'root'}: ${i.message}`)
        .join('; ')
      throw new Error(
        `La respuesta de Anthropic no tiene la estructura esperada ({ newConfig, explanation, unsatisfied }): ${issues}`
      )
    }

    const configResult = SiteConfigSchema.safeParse(envelopeResult.data.newConfig)
    if (!configResult.success) {
      const issues = configResult.error.issues
        .map((i) => `${i.path.join('.') || 'root'}: ${i.message}`)
        .join('; ')
      throw new Error(`La configuración devuelta por Anthropic no cumple SiteConfigSchema: ${issues}`)
    }

    return {
      newConfig: configResult.data,
      explanation: envelopeResult.data.explanation,
      unsatisfied: envelopeResult.data.unsatisfied,
    }
  }
}
