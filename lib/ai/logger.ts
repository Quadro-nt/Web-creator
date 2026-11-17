import { promises as fs } from 'node:fs'
import path from 'node:path'

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
  const dir = path.join(resolveBaseDir(baseDir), entry.artistSlug)
  const file = path.join(dir, 'ai-log.jsonl')
  await fs.mkdir(dir, { recursive: true })
  await fs.appendFile(file, JSON.stringify(entry) + '\n', 'utf8')
}
