import { describe, it, expect, beforeEach, afterEach } from '@jest/globals'
import { promises as fs } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { logAIRequest, type AILogEntry } from '@/lib/ai/logger'

const SLUG = 'luna-vega'

function makeEntry(overrides: Partial<AILogEntry> = {}): AILogEntry {
  return {
    timestamp: new Date().toISOString(),
    artistSlug: SLUG,
    prompt: 'Cambia el fondo',
    applied: false,
    unsatisfied: [],
    validationError: null,
    ...overrides,
  }
}

describe('logger', () => {
  let tmpDir: string

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'ai-logger-'))
  })

  afterEach(async () => {
    await fs.rm(tmpDir, { recursive: true, force: true })
  })

  it('logAIRequest escribe una linea valida en el archivo', async () => {
    const entry = makeEntry()
    await logAIRequest(entry, tmpDir)

    const file = path.join(tmpDir, SLUG, 'ai-log.jsonl')
    const raw = await fs.readFile(file, 'utf8')
    const lines = raw.split('\n').filter((l) => l.length > 0)

    expect(lines).toHaveLength(1)
    const parsed = JSON.parse(lines[0]) as AILogEntry
    expect(parsed).toEqual(entry)
  })

  it('dos llamadas consecutivas escriben dos lineas', async () => {
    const a = makeEntry({ prompt: 'uno' })
    const b = makeEntry({ prompt: 'dos', unsatisfied: ['x'] })

    await logAIRequest(a, tmpDir)
    await logAIRequest(b, tmpDir)

    const file = path.join(tmpDir, SLUG, 'ai-log.jsonl')
    const raw = await fs.readFile(file, 'utf8')
    const lines = raw.split('\n').filter((l) => l.length > 0)

    expect(lines).toHaveLength(2)
    expect(JSON.parse(lines[0])).toEqual(a)
    expect(JSON.parse(lines[1])).toEqual(b)
  })
})
