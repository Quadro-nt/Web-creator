import { promises as fs } from 'node:fs'
import path from 'node:path'
import { getStorageBackend, getSupabaseAdminClient } from '@/lib/cloud/supabase-client'

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

  if (!baseDir && getStorageBackend() === 'cloud') {
    const supabase = getSupabaseAdminClient()
    const { data, error } = await supabase
      .from('ai_daily_usage')
      .select('count')
      .eq('artist_slug', artistSlug)
      .eq('usage_date', today)
      .maybeSingle()

    if (error) {
      throw new Error(error.message)
    }

    const current = data && typeof data.count === 'number' ? data.count : 0
    const remaining = Math.max(0, limit - current)
    return {
      allowed: current < limit,
      remaining,
      resetAt: nextDayUTC(),
    }
  }

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

  if (!baseDir && getStorageBackend() === 'cloud') {
    const supabase = getSupabaseAdminClient()
    const { data, error: selectError } = await supabase
      .from('ai_daily_usage')
      .select('count')
      .eq('artist_slug', artistSlug)
      .eq('usage_date', today)
      .maybeSingle()

    if (selectError) {
      throw new Error(selectError.message)
    }

    const current = data && typeof data.count === 'number' ? data.count : 0
    const { error: upsertError } = await supabase
      .from('ai_daily_usage')
      .upsert(
        { artist_slug: artistSlug, usage_date: today, count: current + 1 },
        { onConflict: 'artist_slug,usage_date' }
      )

    if (upsertError) {
      throw new Error(upsertError.message)
    }
    return
  }

  const file = getCountFile(artistSlug, baseDir)
  const stored = await readCount(file)
  const current = stored && stored.date === today ? stored.count : 0
  const updated: DailyCount = { date: today, count: current + 1 }
  await fs.mkdir(path.dirname(file), { recursive: true })
  await fs.writeFile(file, JSON.stringify(updated), 'utf8')
}
