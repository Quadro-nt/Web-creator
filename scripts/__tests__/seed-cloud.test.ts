/** @jest-environment node */

import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals'
import type { SupabaseClient } from '@supabase/supabase-js'
import fs from 'fs'
import { hashTokenSha256 } from '@/lib/auth/token-validator'
import { SiteConfigSchema } from '@/lib/schemas/site-config.schema'
import { WorksFileSchema } from '@/lib/schemas/works.schema'
import {
  PILOT_ARTISTS,
  buildSeedPlan,
  loadArtistSeedData,
  parseCliArgs,
  runSeedCloud,
} from '../seed-cloud'

const SHA256_HEX_RE = /^[0-9a-f]{64}$/

type UpsertRecord = {
  table: string
  payload: Record<string, unknown>
  options: Record<string, unknown>
}

function createMockSupabaseClient(
  failingTable?: 'artists' | 'works',
): { client: SupabaseClient; calls: UpsertRecord[] } {
  const calls: UpsertRecord[] = []

  const client = {
    from(table: string) {
      return {
        upsert: jest.fn(
          async (
            payload: Record<string, unknown>,
            options: Record<string, unknown>,
          ) => {
            calls.push({ table, payload, options })
            if (failingTable && table === failingTable) {
              return { error: { message: `simulated ${table} error` } }
            }
            return { error: null }
          },
        ),
      }
    },
  } as unknown as SupabaseClient

  return { client, calls }
}

describe('scripts/seed-cloud', () => {
  const originalEnv = { ...process.env }

  beforeEach(() => {
    process.env = { ...originalEnv }
    delete process.env.ARTIST_TOKEN_HASHES
    delete process.env.SUPABASE_URL
    delete process.env.SUPABASE_SERVICE_ROLE_KEY
  })

  afterEach(() => {
    process.env = { ...originalEnv }
    jest.restoreAllMocks()
  })

  it('exports the 3 pilot artists in PILOT_ARTISTS', () => {
    expect(PILOT_ARTISTS).toEqual(['luna-vega', 'marco-torres', 'sofia-rios'])
  })

  it('loadArtistSeedData validates config.published.json and works.json without reading token.txt', () => {
    const readSpy = jest.spyOn(fs, 'readFileSync')

    for (const slug of PILOT_ARTISTS) {
      const data = loadArtistSeedData(slug)
      expect(data.slug).toBe(slug)
      expect(SiteConfigSchema.safeParse(data.config).success).toBe(true)
      expect(WorksFileSchema.safeParse(data.works).success).toBe(true)
      expect(data.works.artistSlug).toBe(slug)
      expect(data.works.works.length).toBeGreaterThan(0)
    }

    const readPaths = readSpy.mock.calls.map((call) => String(call[0]))
    expect(readPaths.some((p) => p.includes('token.txt'))).toBe(false)
    expect(readPaths.some((p) => p.includes('.env'))).toBe(false)
  })

  it('buildSeedPlan generates valid 64-char SHA-256 hashes when ARTIST_TOKEN_HASHES is absent', () => {
    const plan = buildSeedPlan()

    expect(plan.entries).toHaveLength(3)
    for (const entry of plan.entries) {
      expect(entry.hashSource).toBe('generated-ephemeral')
      expect(entry.tokenHash).toMatch(SHA256_HEX_RE)
      expect(entry.ephemeralToken).toBeDefined()
      expect(entry.ephemeralToken).toHaveLength(48)
      expect(hashTokenSha256(entry.ephemeralToken!)).toBe(entry.tokenHash)
    }
  })

  it('buildSeedPlan respects ARTIST_TOKEN_HASHES from env and falls back only for missing slugs', () => {
    const lunaHash = hashTokenSha256('fixture-luna-secret-for-unit-test')
    const marcoHash = hashTokenSha256('fixture-marco-secret-for-unit-test')
    process.env.ARTIST_TOKEN_HASHES = JSON.stringify({
      'luna-vega': lunaHash.toUpperCase(),
      'marco-torres': marcoHash,
    })

    const plan = buildSeedPlan()
    const bySlug = new Map(plan.entries.map((entry) => [entry.slug, entry]))

    expect(bySlug.get('luna-vega')?.hashSource).toBe('env')
    expect(bySlug.get('luna-vega')?.tokenHash).toBe(lunaHash)
    expect(bySlug.get('luna-vega')?.ephemeralToken).toBeUndefined()

    expect(bySlug.get('marco-torres')?.hashSource).toBe('env')
    expect(bySlug.get('marco-torres')?.tokenHash).toBe(marcoHash)
    expect(bySlug.get('marco-torres')?.ephemeralToken).toBeUndefined()

    expect(bySlug.get('sofia-rios')?.hashSource).toBe('generated-ephemeral')
    expect(bySlug.get('sofia-rios')?.tokenHash).toMatch(SHA256_HEX_RE)
    expect(bySlug.get('sofia-rios')?.ephemeralToken).toBeDefined()
  })

  it('runSeedCloud({ dryRun: true }) requires no Supabase env vars, makes zero network calls, and never prints plain tokens', async () => {
    const fetchSpy = jest.spyOn(globalThis, 'fetch')
    const readSpy = jest.spyOn(fs, 'readFileSync')
    const logs: string[] = []

    const result = await runSeedCloud({
      dryRun: true,
      log: (line) => logs.push(line),
    })

    expect(result.dryRun).toBe(true)
    expect(result.generatedEditorUrls).toEqual([])
    expect(result.entries).toHaveLength(3)
    for (const entry of result.entries) {
      expect(PILOT_ARTISTS).toContain(entry.slug)
      expect(entry.worksCount).toBeGreaterThan(0)
      expect(entry.hashSource).toBe('generated-ephemeral')
      expect(entry.tokenHash).toMatch(SHA256_HEX_RE)
    }

    const joinedLogs = logs.join('\n')
    expect(joinedLogs).toContain('luna-vega')
    expect(joinedLogs).toContain('marco-torres')
    expect(joinedLogs).toContain('sofia-rios')
    expect(joinedLogs).toContain('generated-ephemeral')
    expect(joinedLogs).not.toContain('/editor/')

    expect(fetchSpy).not.toHaveBeenCalled()
    const readPaths = readSpy.mock.calls.map((call) => String(call[0]))
    expect(readPaths.some((p) => p.includes('token.txt'))).toBe(false)
  })

  it('runSeedCloud({ dryRun: false, client }) performs idempotent upserts on artists and works', async () => {
    const { client, calls } = createMockSupabaseClient()
    const logs: string[] = []

    const firstRun = await runSeedCloud({
      dryRun: false,
      client,
      log: (line) => logs.push(line),
    })

    expect(firstRun.dryRun).toBe(false)
    expect(firstRun.entries).toHaveLength(3)
    expect(firstRun.generatedEditorUrls).toHaveLength(3)
    expect(calls).toHaveLength(6)

    for (const slug of PILOT_ARTISTS) {
      const artistCall = calls.find(
        (c) => c.table === 'artists' && c.payload.slug === slug,
      )
      const worksCall = calls.find(
        (c) => c.table === 'works' && c.payload.artist_slug === slug,
      )

      expect(artistCall).toBeDefined()
      expect(artistCall?.options).toEqual({ onConflict: 'slug' })
      expect(artistCall?.payload.token_hash).toMatch(SHA256_HEX_RE)
      expect(
        SiteConfigSchema.safeParse(artistCall?.payload.config_published).success,
      ).toBe(true)

      expect(worksCall).toBeDefined()
      expect(worksCall?.options).toEqual({ onConflict: 'artist_slug' })
      expect(Array.isArray(worksCall?.payload.items)).toBe(true)
    }

    const joinedLogs = logs.join('\n')
    expect(joinedLogs).toContain('gestor de contraseñas')
    expect(joinedLogs).toContain('/editor/')

    // Re-running with precomputed ARTIST_TOKEN_HASHES stays idempotent and skips ephemeral warning
    process.env.ARTIST_TOKEN_HASHES = JSON.stringify({
      'luna-vega': hashTokenSha256('t1'),
      'marco-torres': hashTokenSha256('t2'),
      'sofia-rios': hashTokenSha256('t3'),
    })
    const secondLogs: string[] = []
    const secondRun = await runSeedCloud({
      dryRun: false,
      client,
      log: (line) => secondLogs.push(line),
    })

    expect(secondRun.generatedEditorUrls).toEqual([])
    expect(secondRun.entries.every((e) => e.hashSource === 'env')).toBe(true)
    expect(calls).toHaveLength(12)
    expect(secondLogs.join('\n')).not.toContain('/editor/')
  })

  it('rejects malformed ARTIST_TOKEN_HASHES and propagates Supabase upsert errors', async () => {
    process.env.ARTIST_TOKEN_HASHES = '{invalid-json'
    await expect(runSeedCloud({ dryRun: true })).rejects.toThrow(
      /ARTIST_TOKEN_HASHES/i,
    )

    process.env.ARTIST_TOKEN_HASHES = JSON.stringify({
      'luna-vega': 'not-a-sha256-hex',
    })
    await expect(runSeedCloud({ dryRun: true })).rejects.toThrow(
      /SHA-256/i,
    )

    delete process.env.ARTIST_TOKEN_HASHES
    const { client } = createMockSupabaseClient('works')
    await expect(
      runSeedCloud({ dryRun: false, client, log: () => {} }),
    ).rejects.toThrow(/Error upserting works/i)
  })

  it('parseCliArgs detects --dry-run flag', () => {
    expect(parseCliArgs([])).toEqual({ dryRun: false })
    expect(parseCliArgs(['--dry-run'])).toEqual({ dryRun: true })
  })
})
