import { randomBytes } from 'crypto'
import fs from 'fs'
import Module from 'module'
import path from 'path'
import type { SupabaseClient } from '@supabase/supabase-js'
import { hashTokenSha256 } from '../lib/auth/token-validator'
import { isSafeArtistSlug } from '../lib/auth/verify-api-request'
import { getSupabaseAdminClient } from '../lib/cloud/supabase-client'
import type { SiteConfig } from '../lib/schemas/site-config.schema'
import type { WorksFile } from '../lib/schemas/works.schema'

const REPO_ROOT = path.resolve(__dirname, '..')
const SHA256_HEX_RE = /^[0-9a-f]{64}$/i

function ensureAtAliasRegistered(): void {
  if (process.env.JEST_WORKER_ID) return
  const nodeModule = Module as unknown as {
    _resolveFilename?: (
      request: string,
      parent: unknown,
      isMain: boolean,
      options?: unknown,
    ) => string
    __quadroAliasRegistered?: boolean
  }
  if (nodeModule.__quadroAliasRegistered || typeof nodeModule._resolveFilename !== 'function') {
    return
  }
  const originalResolveFilename = nodeModule._resolveFilename
  nodeModule._resolveFilename = function (
    request: string,
    parent: unknown,
    isMain: boolean,
    options?: unknown,
  ): string {
    if (request.startsWith('@/')) {
      const mapped = path.join(REPO_ROOT, request.slice(2))
      return originalResolveFilename.call(this, mapped, parent, isMain, options)
    }
    return originalResolveFilename.call(this, request, parent, isMain, options)
  }
  nodeModule.__quadroAliasRegistered = true
}

function getSchemas(): {
  SiteConfigSchema: typeof import('../lib/schemas/site-config.schema').SiteConfigSchema
  WorksFileSchema: typeof import('../lib/schemas/works.schema').WorksFileSchema
} {
  ensureAtAliasRegistered()
  const siteConfigMod =
    require('../lib/schemas/site-config.schema') as typeof import('../lib/schemas/site-config.schema')
  const worksMod =
    require('../lib/schemas/works.schema') as typeof import('../lib/schemas/works.schema')
  return {
    SiteConfigSchema: siteConfigMod.SiteConfigSchema,
    WorksFileSchema: worksMod.WorksFileSchema,
  }
}

export const PILOT_ARTISTS = ['luna-vega', 'marco-torres', 'sofia-rios'] as const

export type TokenHashSource = 'env' | 'generated-ephemeral'

export interface ArtistSeedData {
  slug: string
  config: SiteConfig
  works: WorksFile
}

export interface SeedPlanEntry {
  slug: string
  config: SiteConfig
  works: WorksFile
  tokenHash: string
  hashSource: TokenHashSource
  ephemeralToken?: string
}

export interface SeedPlan {
  entries: SeedPlanEntry[]
}

export interface BuildSeedPlanOptions {
  artists?: readonly string[]
  baseDir?: string
  tokenHashes?: Record<string, string>
  tokenHashesJson?: string
}

export interface RunSeedCloudOptions extends BuildSeedPlanOptions {
  dryRun?: boolean
  client?: SupabaseClient
  log?: (line: string) => void
}

export interface SeedCloudSummaryEntry {
  slug: string
  worksCount: number
  hashSource: TokenHashSource
  tokenHash: string
}

export interface SeedCloudResult {
  dryRun: boolean
  entries: SeedCloudSummaryEntry[]
  generatedEditorUrls: Array<{ slug: string; editorPath: string }>
}

function defaultArtistsDir(): string {
  return path.join(process.cwd(), 'data', 'artists')
}

function readJsonFile(filePath: string): unknown {
  const raw = fs.readFileSync(filePath, 'utf-8')
  return JSON.parse(raw) as unknown
}

/**
 * Reads and validates `config.published.json` and `works.json` for an artist slug.
 * Never reads or opens `token.txt`.
 */
export function loadArtistSeedData(slug: string, baseDir?: string): ArtistSeedData {
  if (!isSafeArtistSlug(slug)) {
    throw new Error(`Invalid artist slug: "${slug}"`)
  }

  const rootDir = baseDir ?? defaultArtistsDir()
  const artistDir = path.join(rootDir, slug)
  const configPath = path.join(artistDir, 'config.published.json')
  const worksPath = path.join(artistDir, 'works.json')

  const { SiteConfigSchema, WorksFileSchema } = getSchemas()

  const config = SiteConfigSchema.parse(readJsonFile(configPath))
  const works = WorksFileSchema.parse(readJsonFile(worksPath))

  if (works.artistSlug !== slug) {
    throw new Error(
      `Works file artistSlug mismatch for "${slug}": found "${works.artistSlug}"`,
    )
  }

  return { slug, config, works }
}

function parseTokenHashesFromEnv(rawJson?: string): Record<string, string> {
  const source = rawJson ?? process.env.ARTIST_TOKEN_HASHES
  if (!source || source.trim().length === 0) {
    return {}
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(source)
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    throw new Error(`Invalid JSON in ARTIST_TOKEN_HASHES: ${message}`)
  }

  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('ARTIST_TOKEN_HASHES must be a JSON object mapping slug -> sha256 hex')
  }

  const normalized: Record<string, string> = {}
  for (const [slug, value] of Object.entries(parsed)) {
    if (!isSafeArtistSlug(slug)) {
      throw new Error(`Invalid artist slug in ARTIST_TOKEN_HASHES: "${slug}"`)
    }
    if (typeof value !== 'string' || !SHA256_HEX_RE.test(value)) {
      throw new Error(
        `Invalid SHA-256 hex hash in ARTIST_TOKEN_HASHES for "${slug}"`,
      )
    }
    normalized[slug] = value.toLowerCase()
  }

  return normalized
}

function resolveProvidedHashes(options: BuildSeedPlanOptions): Record<string, string> {
  if (options.tokenHashes) {
    const normalized: Record<string, string> = {}
    for (const [slug, value] of Object.entries(options.tokenHashes)) {
      if (!isSafeArtistSlug(slug)) {
        throw new Error(`Invalid artist slug in tokenHashes: "${slug}"`)
      }
      if (!SHA256_HEX_RE.test(value)) {
        throw new Error(`Invalid SHA-256 hex hash in tokenHashes for "${slug}"`)
      }
      normalized[slug] = value.toLowerCase()
    }
    return normalized
  }

  return parseTokenHashesFromEnv(options.tokenHashesJson)
}

/**
 * Builds an idempotent seed plan for the target artists using `ARTIST_TOKEN_HASHES`
 * when available or generating secure ephemeral tokens in memory otherwise.
 */
export function buildSeedPlan(options: BuildSeedPlanOptions = {}): SeedPlan {
  const artists = options.artists ?? PILOT_ARTISTS
  const providedHashes = resolveProvidedHashes(options)
  const entries: SeedPlanEntry[] = []

  for (const slug of artists) {
    const seedData = loadArtistSeedData(slug, options.baseDir)
    const precomputedHash = providedHashes[slug]

    if (precomputedHash) {
      entries.push({
        ...seedData,
        tokenHash: precomputedHash,
        hashSource: 'env',
      })
      continue
    }

    const plainToken = randomBytes(24).toString('hex')
    const tokenHash = hashTokenSha256(plainToken)
    entries.push({
      ...seedData,
      tokenHash,
      hashSource: 'generated-ephemeral',
      ephemeralToken: plainToken,
    })
  }

  return { entries }
}

function logDryRunSummary(entries: SeedPlanEntry[], log: (line: string) => void): void {
  log(`[seed-cloud] Dry-run mode enabled (no network calls, no database writes).`)
  log(`[seed-cloud] Artists to seed: ${entries.length}`)
  for (const entry of entries) {
    log(
      `  - ${entry.slug}: works=${entry.works.works.length}, hashSource=${entry.hashSource}, tokenHashPrefix=${entry.tokenHash.slice(0, 8)}...`,
    )
  }
}

/**
 * Runs the cloud seed against Supabase (or prints a dry-run plan without network/env access).
 */
export async function runSeedCloud(
  options: RunSeedCloudOptions = {},
): Promise<SeedCloudResult> {
  const dryRun = options.dryRun ?? false
  const log = options.log ?? console.log
  const plan = buildSeedPlan(options)

  const summaryEntries: SeedCloudSummaryEntry[] = plan.entries.map((entry) => ({
    slug: entry.slug,
    worksCount: entry.works.works.length,
    hashSource: entry.hashSource,
    tokenHash: entry.tokenHash,
  }))

  if (dryRun) {
    logDryRunSummary(plan.entries, log)
    return {
      dryRun: true,
      entries: summaryEntries,
      generatedEditorUrls: [],
    }
  }

  const db = options.client ?? getSupabaseAdminClient()
  const nowIso = new Date().toISOString()

  for (const entry of plan.entries) {
    const { error: artistError } = await db.from('artists').upsert(
      {
        slug: entry.slug,
        token_hash: entry.tokenHash,
        config_published: entry.config,
        updated_at: nowIso,
      },
      { onConflict: 'slug' },
    )

    if (artistError) {
      throw new Error(`Error upserting artist "${entry.slug}": ${artistError.message}`)
    }

    const { error: worksError } = await db.from('works').upsert(
      {
        artist_slug: entry.slug,
        items: entry.works.works,
        updated_at: nowIso,
      },
      { onConflict: 'artist_slug' },
    )

    if (worksError) {
      throw new Error(`Error upserting works for "${entry.slug}": ${worksError.message}`)
    }

    log(
      `[seed-cloud] Upserted ${entry.slug} (works=${entry.works.works.length}, hashSource=${entry.hashSource})`,
    )
  }

  const generatedEditorUrls = plan.entries
    .filter((entry): entry is SeedPlanEntry & { ephemeralToken: string } =>
      Boolean(entry.ephemeralToken),
    )
    .map((entry) => ({
      slug: entry.slug,
      editorPath: `/editor/${entry.ephemeralToken}`,
    }))

  if (generatedEditorUrls.length > 0) {
    log('')
    log(
      '[seed-cloud] AVISO DE SEGURIDAD: Se generaron tokens nuevos en memoria para el editor.',
    )
    log(
      '[seed-cloud] Guarda estas rutas en tu gestor de contraseñas ahora (no se muestran de nuevo) y NUNCA las commitees a git:',
    )
    for (const item of generatedEditorUrls) {
      log(`  - ${item.slug}: ${item.editorPath}`)
    }
  }

  return {
    dryRun: false,
    entries: summaryEntries,
    generatedEditorUrls,
  }
}

export function parseCliArgs(argv: string[]): { dryRun: boolean } {
  return {
    dryRun: argv.includes('--dry-run'),
  }
}

if (require.main === module) {
  const { dryRun } = parseCliArgs(process.argv.slice(2))
  runSeedCloud({ dryRun }).catch((err: unknown) => {
    const message = err instanceof Error ? err.message : String(err)
    console.error(`[seed-cloud] Error: ${message}`)
    process.exitCode = 1
  })
}
