import fs from 'fs'
import path from 'path'
import { describe, it, expect } from '@jest/globals'
import { SiteConfigSchema, normalizeSiteConfig } from '@/lib/schemas/site-config.schema'

describe('backwards compat', () => {
  it('legacy luna-vega config (pre design-system-museo) validates with current schema after normalization', () => {
    const legacy = JSON.parse(
      fs.readFileSync(path.resolve(__dirname, 'fixtures/legacy-luna-vega.json'), 'utf8'),
    )
    // Old-shape configs (sections[] at root) must be normalized before parsing
    const normalized = normalizeSiteConfig(legacy)
    const result = SiteConfigSchema.safeParse(normalized)
    expect(result.success).toBe(true)
  })
})
