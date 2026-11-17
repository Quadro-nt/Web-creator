import type { SiteConfig } from '@/lib/schemas/site-config.schema'
import type { AIProvider, AIResponse } from './provider'

export class MockProvider implements AIProvider {
  async suggestConfig(params: {
    currentConfig: SiteConfig
    prompt: string
    schema: string
  }): Promise<AIResponse> {
    const prompt = params.prompt.toLowerCase()

    if (prompt.includes('error') || prompt.includes('invalido') || prompt.includes('inválido')) {
      const invalid = {
        ...params.currentConfig,
        template: 'inexistente',
      }
      return {
        newConfig: invalid,
        explanation: 'Intento de cambio de template',
        unsatisfied: [],
      }
    }

    if (prompt.includes('imposible')) {
      return {
        newConfig: params.currentConfig,
        explanation: 'No se realizó ningún cambio',
        unsatisfied: ['Esta solicitud no puede cumplirse dentro del esquema de diseno'],
      }
    }

    const updated: SiteConfig = {
      ...params.currentConfig,
      styleTokens: {
        ...params.currentConfig.styleTokens,
        background: '#f5f5f5',
      },
    }
    return {
      newConfig: updated,
      explanation: 'Se cambio el fondo a gris claro',
      unsatisfied: [],
    }
  }
}
