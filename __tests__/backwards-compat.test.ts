import fs from 'fs'
import path from 'path'
import { describe, it, expect } from '@jest/globals'
import { SiteConfigSchema } from '@/lib/schemas/site-config.schema'

describe('backwards compat', () => {
  it('legacy luna-vega config (pre design-system-museo) validates with current schema', () => {
    const legacy = JSON.parse(
      fs.readFileSync(path.resolve(__dirname, 'fixtures/legacy-luna-vega.json'), 'utf8'),
    )
    const result = SiteConfigSchema.safeParse(legacy)
    expect(result.success).toBe(true)
  })
})
