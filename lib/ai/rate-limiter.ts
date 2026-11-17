import { promises as fs } from 'node:fs'
import path from 'node:path'

const DEFAULT_LIMIT = 20

type DailyCount = { date: string; count: number }

export type RateLimitResult = {
  allowed: boolean
  remaining: number
  resetAt: Date
}

function getLimit(): number {
  const raw = process.env.AI_DAILY_LIMIT_PER_ARTIST
  if (!raw) return DEFAULT_LIMIT
  const parsed = Number(raw)
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : DEFAULT_LIMIT
}

function todayUTC(): string {
  return new Date().toISOString().slice(0, 10)
}

function nextDayUTC(): Date {
  const now = new Date()
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1)
  )
}

function resolveBaseDir(baseDir?: string): string {
  return baseDir ?? path.join(process.cwd(), 'data', 'artists')
}

function getCountFile(artistSlug: string, baseDir?: string): string {
  return path.join(resolveBaseDir(baseDir), artistSlug, 'ai-daily-count.json')
}

async function readCount(file: string): Promise<DailyCount | null> {
  try {
    const raw = await fs.readFile(file, 'utf8')
    const parsed = JSON.parse(raw) as unknown
    if (
      parsed &&
      typeof parsed === 'object' &&
      typeof (parsed as DailyCount).date === 'string' &&
      typeof (parsed as DailyCount).count === 'number'
    ) {
      return parsed as DailyCount
    }
  } catch {
    // archivo inexistente o corrupto: tratamos como "sin registro"
  }
  return null
}

export async function checkLimit(
  artistSlug: string,
  baseDir?: string
): Promise<RateLimitResult> {
  const limit = getLimit()
  const today = todayUTC()
  const file = getCountFile(artistSlug, baseDir)
  const stored = await readCount(file)
  const current = stored && stored.date === today ? stored.count : 0
  const remaining = Math.max(0, limit - current)
  return {
    allowed: current < limit,
    remaining,
    resetAt: nextDayUTC(),
  }
}

export async function incrementCount(
  artistSlug: string,
  baseDir?: string
): Promise<void> {
  const today = todayUTC()
  const file = getCountFile(artistSlug, baseDir)
  const stored = await readCount(file)
  const current = stored && stored.date === today ? stored.count : 0
  const updated: DailyCount = { date: today, count: current + 1 }
  await fs.mkdir(path.dirname(file), { recursive: true })
  await fs.writeFile(file, JSON.stringify(updated), 'utf8')
}
