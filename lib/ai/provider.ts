import type { SiteConfig } from '@/lib/schemas/site-config.schema'

export interface AIResponse {
  newConfig: unknown
  explanation: string
  unsatisfied: string[]
}

export interface AIProvider {
  suggestConfig(params: {
    currentConfig: SiteConfig
    prompt: string
    schema: string
  }): Promise<AIResponse>
}
