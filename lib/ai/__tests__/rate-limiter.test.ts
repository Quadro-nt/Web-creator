import { describe, it, expect, beforeEach, afterEach } from '@jest/globals'
import { promises as fs } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { checkLimit, incrementCount } from '@/lib/ai/rate-limiter'

const SLUG = 'luna-vega'

async function makeTmpDir(): Promise<string> {
  return fs.mkdtemp(path.join(os.tmpdir(), 'ai-rate-limiter-'))
}

async function writeCountFile(
  baseDir: string,
  slug: string,
  payload: { date: string; count: number }
): Promise<void> {
  const dir = path.join(baseDir, slug)
  await fs.mkdir(dir, { recursive: true })
  await fs.writeFile(
    path.join(dir, 'ai-daily-count.json'),
    JSON.stringify(payload),
    'utf8'
  )
}

describe('rate-limiter', () => {
  let tmpDir: string
  const originalLimit = process.env.AI_DAILY_LIMIT_PER_ARTIST

  beforeEach(async () => {
    tmpDir = await makeTmpDir()
    process.env.AI_DAILY_LIMIT_PER_ARTIST = '3'
  })

  afterEach(async () => {
    await fs.rm(tmpDir, { recursive: true, force: true })
    if (originalLimit === undefined) {
      delete process.env.AI_DAILY_LIMIT_PER_ARTIST
    } else {
      process.env.AI_DAILY_LIMIT_PER_ARTIST = originalLimit
    }
  })

  it('checkLimit con count=0 retorna allowed: true y remaining=limit', async () => {
    const result = await checkLimit(SLUG, tmpDir)
    expect(result.allowed).toBe(true)
    expect(result.remaining).toBe(3)
    expect(result.resetAt).toBeInstanceOf(Date)
  })

  it('despues de AI_DAILY_LIMIT_PER_ARTIST incrementos, checkLimit retorna allowed: false', async () => {
    await incrementCount(SLUG, tmpDir)
    await incrementCount(SLUG, tmpDir)
    await incrementCount(SLUG, tmpDir)

    const result = await checkLimit(SLUG, tmpDir)
    expect(result.allowed).toBe(false)
    expect(result.remaining).toBe(0)
  })

  it('si la fecha del archivo es ayer, resetea y retorna allowed: true', async () => {
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 10)
    await writeCountFile(tmpDir, SLUG, { date: yesterday, count: 99 })

    const result = await checkLimit(SLUG, tmpDir)
    expect(result.allowed).toBe(true)
    expect(result.remaining).toBe(3)
  })

  it('incrementCount en archivo con fecha de ayer arranca de cero con la fecha de hoy', async () => {
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 10)
    await writeCountFile(tmpDir, SLUG, { date: yesterday, count: 99 })

    await incrementCount(SLUG, tmpDir)

    const raw = await fs.readFile(
      path.join(tmpDir, SLUG, 'ai-daily-count.json'),
      'utf8'
    )
    const parsed = JSON.parse(raw) as { date: string; count: number }
    expect(parsed.count).toBe(1)
    expect(parsed.date).toBe(new Date().toISOString().slice(0, 10))
  })
})
