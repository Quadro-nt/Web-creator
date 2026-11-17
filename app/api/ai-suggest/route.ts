import { NextResponse } from 'next/server'
import { z } from 'zod'
import { SiteConfigSchema } from '@/lib/schemas/site-config.schema'
import { askAI } from '@/lib/ai/ask-ai'
import { MockProvider } from '@/lib/ai/mock-provider'
import { AnthropicProvider } from '@/lib/ai/anthropic-provider'
import type { AIProvider } from '@/lib/ai/provider'
import { checkLimit, incrementCount } from '@/lib/ai/rate-limiter'
import { logAIRequest } from '@/lib/ai/logger'

const BodySchema = z.object({
  artistSlug: z.string().min(1),
  prompt: z.string().min(1),
  currentConfig: z.unknown(),
})

function pickProvider(): AIProvider {
  if (process.env.NODE_ENV === 'test') {
    return new MockProvider()
  }

  const requested = (process.env.AI_PROVIDER ?? '').toLowerCase()
  const defaultProvider = process.env.NODE_ENV === 'production' ? 'anthropic' : 'mock'
  const kind = requested || defaultProvider

  if (kind === 'anthropic') {
    return new AnthropicProvider()
  }
  return new MockProvider()
}

export async function POST(request: Request) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
  }

  const parsedBody = BodySchema.safeParse(body)
  if (!parsedBody.success) {
    return NextResponse.json({ error: 'artistSlug y prompt requeridos' }, { status: 400 })
  }

  const configResult = SiteConfigSchema.safeParse(parsedBody.data.currentConfig)
  if (!configResult.success) {
    return NextResponse.json(
      { error: 'Configuración inválida', issues: configResult.error.issues },
      { status: 400 }
    )
  }

  const { artistSlug, prompt } = parsedBody.data

  const limit = await checkLimit(artistSlug)
  if (!limit.allowed) {
    return NextResponse.json(
      { error: 'Límite diario alcanzado', remaining: 0, resetAt: limit.resetAt.toISOString() },
      { status: 429 }
    )
  }

  let provider: AIProvider
  try {
    provider = pickProvider()
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Proveedor de IA no disponible'
    return NextResponse.json({ error: message }, { status: 500 })
  }

  try {
    const suggestion = await askAI({
      currentConfig: configResult.data,
      prompt,
      provider,
    })
    await incrementCount(artistSlug)
    logAIRequest({
      timestamp: new Date().toISOString(),
      artistSlug,
      prompt,
      applied: false,
      unsatisfied: suggestion.unsatisfied,
      validationError: suggestion.validationError,
    }).catch(() => {
      // el log no bloquea la respuesta
    })
    return NextResponse.json({ suggestion })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error llamando al proveedor de IA'
    return NextResponse.json({ error: message }, { status: 502 })
  }
}
