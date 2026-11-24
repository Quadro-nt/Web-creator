import { promises as fs } from 'node:fs'
import path from 'node:path'
import { getStorageBackend, getSupabaseAdminClient } from '@/lib/cloud/supabase-client'

export type AILogEntry = {
  timestamp: string
  artistSlug: string
  prompt: string
  applied: boolean
  unsatisfied: string[]
  validationError: string | null
}

function resolveBaseDir(baseDir?: string): string {
  return baseDir ?? path.join(process.cwd(), 'data', 'artists')
}

export async function logAIRequest(
  entry: AILogEntry,
  baseDir?: string
): Promise<void> {
  if (!baseDir && getStorageBackend() === 'cloud') {
    const supabase = getSupabaseAdminClient()
    const { error } = await supabase.from('ai_logs').insert({
      artist_slug: entry.artistSlug,
      prompt: entry.prompt,
      applied: entry.applied,
      unsatisfied: entry.unsatisfied,
      validation_error: entry.validationError,
      created_at: entry.timestamp,
    })

    if (error) {
      throw new Error(error.message)
    }
    return
  }

  const dir = path.join(resolveBaseDir(baseDir), entry.artistSlug)
  const file = path.join(dir, 'ai-log.jsonl')
  await fs.mkdir(dir, { recursive: true })
  await fs.appendFile(file, JSON.stringify(entry) + '\n', 'utf8')
}
