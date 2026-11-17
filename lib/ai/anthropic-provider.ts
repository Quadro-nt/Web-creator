import type { SiteConfig } from '@/lib/schemas/site-config.schema'
import type { AIProvider, AIResponse } from './provider'

export class AnthropicProvider implements AIProvider {
  private readonly apiKey: string
  private readonly model: string

  constructor() {
    const apiKey = process.env.AI_API_KEY
    if (!apiKey) {
      throw new Error('AI_API_KEY no configurada')
    }
    this.apiKey = apiKey
    this.model = process.env.AI_MODEL ?? 'claude-3-haiku-20240307'
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

    // TODO: cablear la llamada real a la API de Anthropic cuando se habilite en producción.
    // Esbozo de la petición esperada:
    //
    // const res = await fetch('https://api.anthropic.com/v1/messages', {
    //   method: 'POST',
    //   headers: {
    //     'content-type': 'application/json',
    //     'x-api-key': this.apiKey,
    //     'anthropic-version': '2023-06-01',
    //   },
    //   body: JSON.stringify({
    //     model: this.model,
    //     max_tokens: 2048,
    //     system,
    //     messages: [{ role: 'user', content: userMessage }],
    //   }),
    // })
    // if (!res.ok) throw new Error(`Anthropic API error ${res.status}`)
    // const data = (await res.json()) as { content: Array<{ type: string; text: string }> }
    // const text = data.content.find((c) => c.type === 'text')?.text ?? ''
    // const parsed = JSON.parse(text) as AIResponse
    // return parsed

    void system
    void userMessage

    throw new Error('AnthropicProvider no está implementado en este entorno')
  }
}
