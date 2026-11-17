import { describe, it, expect, jest } from '@jest/globals'
import { askAI } from '@/lib/ai/ask-ai'
import { MockProvider } from '@/lib/ai/mock-provider'
import { defaultSiteConfig } from '@/lib/schemas/site-config.schema'

describe('askAI', () => {
  it('con prompt normal (MockProvider): retorna newConfig valido y validationError null', async () => {
    const provider = new MockProvider()
    const result = await askAI({
      currentConfig: defaultSiteConfig,
      prompt: 'Cambia el fondo a algo mas suave',
      provider,
    })

    expect(result.validationError).toBeNull()
    expect(result.newConfig).not.toBeNull()
    expect(result.newConfig?.styleTokens.background).toBe('#f5f5f5')
    expect(result.explanation).toContain('fondo')
    expect(result.unsatisfied).toEqual([])
  })

  it('con prompt "invalido" (MockProvider): retorna newConfig null y validationError no null', async () => {
    const provider = new MockProvider()
    const result = await askAI({
      currentConfig: defaultSiteConfig,
      prompt: 'Esto deberia ser invalido',
      provider,
    })

    expect(result.newConfig).toBeNull()
    expect(result.validationError).not.toBeNull()
    expect(typeof result.validationError).toBe('string')
    expect(result.validationError!.length).toBeGreaterThan(0)
  })

  it('con prompt "imposible" (MockProvider): retorna newConfig igual al currentConfig y unsatisfied no vacio', async () => {
    const provider = new MockProvider()
    const result = await askAI({
      currentConfig: defaultSiteConfig,
      prompt: 'Haz algo imposible por favor',
      provider,
    })

    expect(result.validationError).toBeNull()
    expect(result.newConfig).toEqual(defaultSiteConfig)
    expect(result.unsatisfied.length).toBeGreaterThan(0)
  })

  it('nunca llama a publish (fetch no es invocado)', async () => {
    const fetchSpy = jest.fn()
    const originalFetch = global.fetch
    global.fetch = fetchSpy as unknown as typeof fetch

    try {
      const provider = new MockProvider()
      await askAI({
        currentConfig: defaultSiteConfig,
        prompt: 'Cambia el fondo',
        provider,
      })
      await askAI({
        currentConfig: defaultSiteConfig,
        prompt: 'Haz algo imposible',
        provider,
      })
      await askAI({
        currentConfig: defaultSiteConfig,
        prompt: 'Esto es invalido',
        provider,
      })

      expect(fetchSpy).not.toHaveBeenCalled()
    } finally {
      global.fetch = originalFetch
    }
  })
})
