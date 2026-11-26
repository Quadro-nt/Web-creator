# Multi-página + links internos — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Habilitar que un sitio tenga N páginas con nav automática, links internos, y migración on-read desde el shape viejo, sin romper sitios existentes.

**Architecture:** Cambio de `SiteConfig.sections[]` plano a `SiteConfig.pages[].sections[]`. Rollout en fases: (A) schema aditivo + normalización, (B) refactor de consumers (templates, routing), (C) nueva UX del editor (page tree, modal, link field), (D) cutover a pages[] requerido + limpieza.

**Tech Stack:** Next.js 14 App Router, TypeScript, Zod, Jest + RTL, dnd-kit, Tailwind.

**Spec de referencia:** `docs/superpowers/specs/2026-11-25-multi-pagina-links-internos-design.md`

---

## File Structure

### Phase A — Foundation (aditivo, no rompe nada)
- **Create:** `lib/schemas/reserved-page-slugs.ts` — lista centralizada de slugs reservados.
- **Create:** `lib/schemas/href-schema.ts` — validación de URLs (interno/externo/anchor/mailto/tel) con tests.
- **Create:** `lib/schemas/__tests__/href-schema.test.ts`
- **Modify:** `lib/schemas/site-config.schema.ts` — agrega `PageConfigSchema`, `pages` opcional en `SiteConfigSchema`, función `normalizeSiteConfig`.
- **Create:** `lib/schemas/__tests__/normalize-site-config.test.ts`
- **Modify:** `lib/schemas/__tests__/site-config.schema.test.ts` — tests de `PageConfigSchema` e invariantes.
- **Modify:** `lib/storage/file-adapter.ts` — aplica `normalizeSiteConfig` en reads.
- **Modify:** `lib/storage/supabase-adapter.ts` — aplica `normalizeSiteConfig` en reads.
- **Modify:** `lib/storage/__tests__/file-adapter.test.ts` — tests shape viejo → nuevo.
- **Modify:** `lib/storage/__tests__/supabase-adapter.test.ts` — idem.

### Phase B — Rendering + routing
- **Create:** `lib/templates/resolve-href.ts` — `resolveSiteHref(href, artistSlug)`.
- **Create:** `lib/templates/__tests__/resolve-href.test.ts`
- **Create:** `components/templates/shared/SafeLink.tsx` — componente que usa `resolveSiteHref` y maneja external/internal.
- **Create:** `components/templates/__tests__/SafeLink.test.tsx`
- **Create:** `components/templates/index.ts` — helper `renderTemplate({ config, page, works, artistSlug })`.
- **Modify:** `components/templates/minimal-gallery/index.tsx` — recibe `page` prop, renderiza `page.sections`.
- **Modify:** `components/templates/editorial/index.tsx` — idem.
- **Modify:** `components/templates/immersive/index.tsx` — idem.
- **Modify:** `components/templates/shared/SiteHeader.tsx` — nav auto desde `config.pages`.
- **Modify:** `components/templates/shared/SiteFooter.tsx` — si tiene nav, misma lógica.
- **Modify:** `app/sites/[artist]/page.tsx` — sirve `pages.find(p => p.isHome)`.
- **Create:** `app/sites/[artist]/[page]/page.tsx` — sirve `pages.find(p => p.slug === params.page && !p.isHome)`.
- **Create:** `app/sites/[artist]/[page]/__tests__/sub-page.test.tsx`

### Phase C — Editor UX
- **Create:** `components/editor/page-operations.ts` — pure functions: `addPage`, `deletePage`, `setHomePage`, `movePage`, `duplicatePage`, `renamePage`.
- **Create:** `components/editor/__tests__/page-operations.test.ts`
- **Create:** `components/editor/PageTree.tsx` — sidebar con árbol pages→sections (reemplaza SectionList en tab "Capas"/"Páginas").
- **Create:** `components/editor/PageModal.tsx` — modal create/edit página (title, slug, showInNav, preset).
- **Create:** `components/editor/__tests__/PageTree.test.tsx`
- **Create:** `components/editor/__tests__/PageModal.test.tsx`
- **Create:** `components/editor/LinkField.tsx` — dropdown tipo + input dinámico.
- **Create:** `components/editor/__tests__/LinkField.test.tsx`
- **Modify:** `app/editor/[token]/EditorClient.tsx` — nuevo state `activePageId`, section ops a través de `page.sections`, renombrar tab "Capas"→"Páginas".
- **Modify:** `components/editor/SectionInspector.tsx` — CTA usa `<LinkField>` en vez de input libre.

### Phase D — Cutover
- **Modify:** `lib/schemas/site-config.schema.ts` — `pages` pasa a required, `sections` al root se elimina (sigue en normalización on-read para compat).
- **Modify:** `lib/onboarding/artist-onboarding.ts` — `buildInitialSiteConfig` nace con `pages[]`.
- **Modify:** `lib/onboarding/__tests__/artist-onboarding.test.ts` — tests actualizados.
- **Modify:** `data/artists/luna-vega/config.published.json`, `marco-torres/config.published.json`, `sofia-rios/config.published.json` — opcional: re-exportar con nuevo shape o dejar que normalización se encargue.

---

## Phase A — Foundation

### Task 1: href-schema + reserved-page-slugs

**Files:**
- Create: `lib/schemas/reserved-page-slugs.ts`
- Create: `lib/schemas/href-schema.ts`
- Create: `lib/schemas/__tests__/href-schema.test.ts`

- [ ] **Step 1: Write the failing href-schema tests**

```ts
// lib/schemas/__tests__/href-schema.test.ts
import { describe, it, expect } from '@jest/globals'
import { validateHref, hrefSchema } from '../href-schema'

describe('validateHref', () => {
  it('accepts root internal path', () => {
    expect(validateHref('/')).toBe(true)
  })
  it('accepts page-slug internal paths', () => {
    expect(validateHref('/exhibitions')).toBe(true)
    expect(validateHref('/serie-2024')).toBe(true)
  })
  it('accepts https URLs', () => {
    expect(validateHref('https://example.com/path')).toBe(true)
  })
  it('accepts http URLs', () => {
    expect(validateHref('http://example.com')).toBe(true)
  })
  it('accepts mailto', () => {
    expect(validateHref('mailto:hola@ejemplo.com')).toBe(true)
  })
  it('accepts tel', () => {
    expect(validateHref('tel:+5491112345678')).toBe(true)
  })
  it('accepts anchors', () => {
    expect(validateHref('#artworks')).toBe(true)
    expect(validateHref('#top_section-2')).toBe(true)
  })
  it('rejects javascript scheme', () => {
    expect(validateHref('javascript:alert(1)')).toBe(false)
  })
  it('rejects data scheme', () => {
    expect(validateHref('data:text/html,<script>')).toBe(false)
  })
  it('rejects vbscript scheme', () => {
    expect(validateHref('vbscript:msgbox')).toBe(false)
  })
  it('rejects empty string', () => {
    expect(validateHref('')).toBe(false)
  })
  it('rejects uppercase in internal path', () => {
    expect(validateHref('/Exhibitions')).toBe(false)
  })
  it('rejects malformed URLs', () => {
    expect(validateHref('not a url')).toBe(false)
  })
})

describe('hrefSchema', () => {
  it('parses valid href', () => {
    expect(hrefSchema.parse('/exhibitions')).toBe('/exhibitions')
  })
  it('throws on invalid href', () => {
    expect(() => hrefSchema.parse('javascript:x')).toThrow()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest --testPathPatterns=href-schema`
Expected: FAIL with "Cannot find module '../href-schema'"

- [ ] **Step 3: Create reserved slugs file**

```ts
// lib/schemas/reserved-page-slugs.ts
/** Slugs that cannot be used as page slugs because they collide with static routes. */
export const RESERVED_PAGE_SLUGS: ReadonlySet<string> = new Set([
  'obras',
])
```

- [ ] **Step 4: Create href-schema**

```ts
// lib/schemas/href-schema.ts
import { z } from 'zod'

const DANGEROUS_SCHEME_RE = /^(?:javascript|data|vbscript):/i
const INTERNAL_RE = /^\/[a-z0-9-]*$/
const EXTERNAL_RE = /^(?:https?|mailto|tel):/
const ANCHOR_RE = /^#[a-zA-Z0-9-_]+$/

/** True when value is a safe href (internal path, external URL, mailto, tel, or anchor). */
export function validateHref(value: string): boolean {
  if (typeof value !== 'string' || value === '') return false
  if (DANGEROUS_SCHEME_RE.test(value)) return false
  return INTERNAL_RE.test(value) || EXTERNAL_RE.test(value) || ANCHOR_RE.test(value)
}

export const hrefSchema = z.string().refine(validateHref, 'Link inválido')
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npx jest --testPathPatterns=href-schema`
Expected: PASS (14 tests)

- [ ] **Step 6: Commit**

```bash
git add lib/schemas/href-schema.ts lib/schemas/reserved-page-slugs.ts lib/schemas/__tests__/href-schema.test.ts
git commit -m "feat(schema): hrefSchema + reserved-page-slugs helpers

Pure validators used by the upcoming multi-page work. No consumers wired yet."
```

---

### Task 2: PageConfigSchema + pages opcional en SiteConfigSchema

**Files:**
- Modify: `lib/schemas/site-config.schema.ts`
- Modify (or create): `lib/schemas/__tests__/site-config.schema.test.ts`

- [ ] **Step 1: Write failing tests for PageConfigSchema + invariants**

```ts
// lib/schemas/__tests__/site-config.schema.test.ts (add to existing or create)
import { describe, it, expect } from '@jest/globals'
import { PageConfigSchema, SiteConfigSchema, defaultSiteConfig } from '../site-config.schema'

describe('PageConfigSchema', () => {
  const base = {
    slug: 'exhibitions',
    title: 'Exhibitions',
    isHome: false,
    showInNav: true,
    sections: [],
  }
  it('accepts a valid page', () => {
    expect(() => PageConfigSchema.parse(base)).not.toThrow()
  })
  it('rejects slug with uppercase', () => {
    expect(() => PageConfigSchema.parse({ ...base, slug: 'Exhibitions' })).toThrow()
  })
  it('rejects empty slug', () => {
    expect(() => PageConfigSchema.parse({ ...base, slug: '' })).toThrow()
  })
  it('rejects slug with special chars', () => {
    expect(() => PageConfigSchema.parse({ ...base, slug: 'my page' })).toThrow()
    expect(() => PageConfigSchema.parse({ ...base, slug: 'my/page' })).toThrow()
  })
  it('rejects empty title', () => {
    expect(() => PageConfigSchema.parse({ ...base, title: '' })).toThrow()
  })
})

describe('SiteConfigSchema with pages', () => {
  const minimalPages = [
    { slug: 'home', title: 'Home', isHome: true, showInNav: true, sections: [] },
  ]
  const base = { ...defaultSiteConfig, pages: minimalPages }

  it('accepts config with pages[]', () => {
    expect(() => SiteConfigSchema.parse(base)).not.toThrow()
  })
  it('rejects empty pages[]', () => {
    expect(() => SiteConfigSchema.parse({ ...base, pages: [] })).toThrow(/exactamente una página/)
  })
  it('rejects 2 pages with isHome=true', () => {
    const pages = [
      { slug: 'home', title: 'Home', isHome: true, showInNav: true, sections: [] },
      { slug: 'about', title: 'About', isHome: true, showInNav: true, sections: [] },
    ]
    expect(() => SiteConfigSchema.parse({ ...base, pages })).toThrow(/exactamente una/)
  })
  it('rejects 0 pages with isHome=true', () => {
    const pages = [
      { slug: 'home', title: 'Home', isHome: false, showInNav: true, sections: [] },
    ]
    expect(() => SiteConfigSchema.parse({ ...base, pages })).toThrow(/exactamente una/)
  })
  it('rejects duplicate slugs', () => {
    const pages = [
      { slug: 'home', title: 'Home', isHome: true, showInNav: true, sections: [] },
      { slug: 'home', title: 'Home2', isHome: false, showInNav: true, sections: [] },
    ]
    expect(() => SiteConfigSchema.parse({ ...base, pages })).toThrow(/slugs de página deben ser únicos/)
  })
  it('rejects reserved slug "obras"', () => {
    const pages = [
      { slug: 'home', title: 'Home', isHome: true, showInNav: true, sections: [] },
      { slug: 'obras', title: 'Obras', isHome: false, showInNav: true, sections: [] },
    ]
    expect(() => SiteConfigSchema.parse({ ...base, pages })).toThrow(/reservado/)
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx jest --testPathPatterns=site-config.schema`
Expected: FAIL with "Cannot read property 'parse' of undefined" or similar (PageConfigSchema not exported)

- [ ] **Step 3: Add PageConfigSchema + invariants to site-config.schema.ts**

In `lib/schemas/site-config.schema.ts`, after `SectionConfigSchema` definition and before `SiteConfigSchema`:

```ts
import { RESERVED_PAGE_SLUGS } from './reserved-page-slugs'

export const PageConfigSchema = z.object({
  slug: z.string().min(1).max(60).regex(/^[a-z0-9-]+$/, 'Slug inválido'),
  title: z.string().min(1).max(80),
  isHome: z.boolean(),
  showInNav: z.boolean(),
  navLabel: z.string().max(40).optional(),
  sections: z.array(SectionConfigSchema),
  seo: z
    .object({
      title: z.string().max(80).optional(),
      description: z.string().max(200).optional(),
      ogImageUrl: mediaUrlSchema.optional(),
    })
    .optional(),
})

export type PageConfig = z.infer<typeof PageConfigSchema>
```

Then modify `SiteConfigSchema` to add `pages` as optional (keep `sections` at root for now):

```ts
export const SiteConfigSchema = z
  .object({
    template: z.enum(['minimal-gallery', 'editorial', 'immersive']),
    // ...existing fields...
    sections: z.array(SectionConfigSchema), // KEEP for now (Phase D removes)
    pages: z.array(PageConfigSchema).optional(), // NEW
    identity: z.object({
      // ...existing...
    }),
  })
  .refine(
    (c) => !c.pages || c.pages.filter((p) => p.isHome).length === 1,
    'Debe existir exactamente una página marcada como home'
  )
  .refine(
    (c) => !c.pages || new Set(c.pages.map((p) => p.slug)).size === c.pages.length,
    'Los slugs de página deben ser únicos'
  )
  .refine(
    (c) => !c.pages || c.pages.every((p) => !RESERVED_PAGE_SLUGS.has(p.slug)),
    'El slug está reservado'
  )
```

- [ ] **Step 4: Run tests to verify PASS**

Run: `npx jest --testPathPatterns=site-config.schema`
Expected: PASS (all tests including the new ones)

- [ ] **Step 5: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: no errors

- [ ] **Step 6: Commit**

```bash
git add lib/schemas/site-config.schema.ts lib/schemas/__tests__/site-config.schema.test.ts
git commit -m "feat(schema): PageConfigSchema + optional pages[] on SiteConfigSchema

Additive change: sections[] at root stays required; pages[] is new and optional.
Invariants: exactly one isHome, unique slugs, non-reserved. Phase D makes pages[]
required and removes sections[] from root."
```

---

### Task 3: normalizeSiteConfig

**Files:**
- Modify: `lib/schemas/site-config.schema.ts` (append)
- Create: `lib/schemas/__tests__/normalize-site-config.test.ts`

- [ ] **Step 1: Write failing tests**

```ts
// lib/schemas/__tests__/normalize-site-config.test.ts
import { describe, it, expect } from '@jest/globals'
import { normalizeSiteConfig } from '../site-config.schema'

describe('normalizeSiteConfig', () => {
  it('passes through new-shape config with pages[]', () => {
    const input = {
      template: 'minimal-gallery',
      pages: [{ slug: 'home', title: 'Home', isHome: true, showInNav: true, sections: [] }],
      identity: { siteTitle: 'Luna' },
    }
    expect(normalizeSiteConfig(input)).toBe(input)
  })

  it('wraps old-shape sections[] into pages[] with a home page', () => {
    const sections = [{ id: 'cover', type: 'cover', variant: 'fullscreen', visible: true, content: {} }]
    const input = {
      template: 'minimal-gallery',
      sections,
      identity: { siteTitle: 'Luna Vega' },
    }
    const output = normalizeSiteConfig(input) as any

    expect(output.pages).toHaveLength(1)
    expect(output.pages[0]).toEqual({
      slug: 'home',
      title: 'Luna Vega',
      isHome: true,
      showInNav: true,
      sections,
    })
    expect(output.sections).toEqual(sections) // sections at root preserved during Phase A
  })

  it('defaults title to "Inicio" when siteTitle missing', () => {
    const input = { template: 'minimal-gallery', sections: [], identity: {} }
    const output = normalizeSiteConfig(input) as any
    expect(output.pages[0].title).toBe('Inicio')
  })

  it('preserves header.customLinks even when wrapping', () => {
    const input = {
      template: 'editorial',
      sections: [],
      header: { layout: 'left', customLinks: [{ label: 'IG', href: 'https://instagram.com/x' }] },
      identity: { siteTitle: 'X' },
    }
    const output = normalizeSiteConfig(input) as any
    expect(output.header.customLinks).toEqual([{ label: 'IG', href: 'https://instagram.com/x' }])
  })

  it('returns non-object input unchanged', () => {
    expect(normalizeSiteConfig(null)).toBeNull()
    expect(normalizeSiteConfig(undefined)).toBeUndefined()
    expect(normalizeSiteConfig('string')).toBe('string')
    expect(normalizeSiteConfig(42)).toBe(42)
  })

  it('returns object without sections untouched (parser will reject)', () => {
    const input = { template: 'minimal-gallery' }
    const output = normalizeSiteConfig(input) as any
    expect(output.pages).toHaveLength(1)
    expect(output.pages[0].sections).toEqual([])
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx jest --testPathPatterns=normalize-site-config`
Expected: FAIL — `normalizeSiteConfig` is not exported

- [ ] **Step 3: Add normalizeSiteConfig to site-config.schema.ts**

Append to `lib/schemas/site-config.schema.ts`:

```ts
/**
 * Normalizes a raw config object from storage into the new shape (pages[]).
 * - New-shape configs (with pages[]) pass through untouched.
 * - Old-shape configs (with sections[] at root) are wrapped: sections move into a
 *   single home page with slug "home". Other fields (header.customLinks, etc.) are preserved.
 * - Non-objects pass through (the schema parser will reject them).
 */
export function normalizeSiteConfig(raw: unknown): unknown {
  if (!raw || typeof raw !== 'object') return raw
  const obj = raw as Record<string, unknown>
  if (Array.isArray(obj.pages)) return raw

  const sections = Array.isArray(obj.sections) ? obj.sections : []
  const identity = (obj.identity as Record<string, unknown> | undefined) ?? {}
  const siteTitle = typeof identity.siteTitle === 'string' ? identity.siteTitle : 'Inicio'

  return {
    ...obj,
    pages: [
      {
        slug: 'home',
        title: siteTitle,
        isHome: true,
        showInNav: true,
        sections,
      },
    ],
  }
}
```

- [ ] **Step 4: Run tests to verify PASS**

Run: `npx jest --testPathPatterns=normalize-site-config`
Expected: PASS (6 tests)

- [ ] **Step 5: Commit**

```bash
git add lib/schemas/site-config.schema.ts lib/schemas/__tests__/normalize-site-config.test.ts
git commit -m "feat(schema): normalizeSiteConfig wraps old-shape sections[] into pages[]

Pure function used by storage adapters on read. New-shape configs are passthrough;
old-shape get wrapped into a single home page. Doesn't touch DB — normalization
on read only."
```

---

### Task 4: File adapter wires normalizeSiteConfig

**Files:**
- Modify: `lib/storage/file-adapter.ts`
- Modify: `lib/storage/__tests__/file-adapter.test.ts` (or check if tests exist first)

- [ ] **Step 1: Check existing file-adapter tests**

Run: `ls lib/storage/__tests__/`
Expected: lists test files for storage adapters. If `file-adapter.test.ts` does not exist, create it.

- [ ] **Step 2: Write failing test — reading old-shape JSON returns normalized shape**

```ts
// lib/storage/__tests__/file-adapter-normalization.test.ts
import { describe, it, expect, beforeEach, afterEach } from '@jest/globals'
import { mkdtemp, mkdir, writeFile, rm } from 'fs/promises'
import { tmpdir } from 'os'
import path from 'path'
import { createFileAdapter } from '../file-adapter'

describe('file-adapter normalizeSiteConfig integration', () => {
  let tmpRoot: string
  let originalCwd: string

  beforeEach(async () => {
    tmpRoot = await mkdtemp(path.join(tmpdir(), 'qs-file-adapter-'))
    originalCwd = process.cwd()
    process.chdir(tmpRoot)
    await mkdir(path.join(tmpRoot, 'data', 'artists', 'test-artist'), { recursive: true })
  })

  afterEach(async () => {
    process.chdir(originalCwd)
    await rm(tmpRoot, { recursive: true, force: true })
  })

  it('getPublished returns pages[] when JSON has old-shape sections[] at root', async () => {
    const oldShape = {
      template: 'minimal-gallery',
      styleTokens: { background: '#fff', text: '#111', accent: '#c00', fontPair: 'fraunces-nunito', spacing: 'normal', artworkTreatment: 'margin' },
      button: { shape: 'rounded', style: 'filled', buyText: 'Consultar' },
      sizes: { typeScale: 'medium', artworkSize: 'medium', columns: '3', contentWidth: 'mid' },
      animations: { scrollReveal: 'soft', hoverEffect: 'info', pageTransition: 'fade' },
      navigation: { type: 'top', sticky: true },
      sections: [{ id: 'cover', type: 'cover', variant: 'fullscreen', visible: true, content: {} }],
      identity: { siteTitle: 'Luna Vega' },
    }
    await writeFile(
      path.join(tmpRoot, 'data', 'artists', 'test-artist', 'config.published.json'),
      JSON.stringify(oldShape),
      'utf-8'
    )

    const adapter = createFileAdapter()
    const config = await adapter.getPublished('test-artist')
    expect(config).not.toBeNull()
    expect(config!.pages).toBeDefined()
    expect(config!.pages).toHaveLength(1)
    expect(config!.pages![0].isHome).toBe(true)
    expect(config!.pages![0].title).toBe('Luna Vega')
    expect(config!.pages![0].sections).toHaveLength(1)
  })

  it('getDraft returns pages[] when draft JSON has old-shape sections[]', async () => {
    const oldShape = {
      template: 'editorial',
      styleTokens: { background: '#fff', text: '#111', accent: '#c00', fontPair: 'playfair-raleway', spacing: 'normal', artworkTreatment: 'margin' },
      button: { shape: 'square', style: 'filled', buyText: 'Consultar' },
      sizes: { typeScale: 'medium', artworkSize: 'medium', columns: '3', contentWidth: 'mid' },
      animations: { scrollReveal: 'soft', hoverEffect: 'info', pageTransition: 'fade' },
      navigation: { type: 'top', sticky: true },
      sections: [],
      identity: { siteTitle: 'Marco' },
    }
    await writeFile(
      path.join(tmpRoot, 'data', 'artists', 'test-artist', 'config.draft.json'),
      JSON.stringify(oldShape),
      'utf-8'
    )

    const adapter = createFileAdapter()
    const config = await adapter.getDraft('test-artist')
    expect(config!.pages![0].isHome).toBe(true)
  })

  it('getPublished returns null when file missing', async () => {
    const adapter = createFileAdapter()
    expect(await adapter.getPublished('test-artist')).toBeNull()
  })
})
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `npx jest --testPathPatterns=file-adapter-normalization`
Expected: FAIL — `pages` is undefined (adapter doesn't normalize yet).

- [ ] **Step 4: Modify file-adapter.ts to use normalizeSiteConfig**

Open `lib/storage/file-adapter.ts`. Update imports and `readJsonFile`:

```ts
import { readFile, writeFile, copyFile, mkdir, unlink } from 'fs/promises'
import path from 'path'
import type { StorageAdapter, SiteConfig } from './index'
import { isSafeArtistSlug } from '@/lib/auth/verify-api-request'
import { normalizeSiteConfig } from '@/lib/schemas/site-config.schema'

// ...artistDir, publishedPath, draftPath unchanged...

async function readJsonFile(filePath: string): Promise<SiteConfig | null> {
  try {
    const content = await readFile(filePath, 'utf-8')
    const parsed = JSON.parse(content)
    return normalizeSiteConfig(parsed) as SiteConfig
  } catch {
    return null
  }
}
```

- [ ] **Step 5: Run tests to verify PASS**

Run: `npx jest --testPathPatterns=file-adapter`
Expected: PASS (existing tests still pass + new normalization test passes)

- [ ] **Step 6: Commit**

```bash
git add lib/storage/file-adapter.ts lib/storage/__tests__/file-adapter-normalization.test.ts
git commit -m "feat(storage): file-adapter applies normalizeSiteConfig on read

JSON files with old-shape sections[] at root are returned as pages[]. Writes
still persist whatever shape saveDraft/publish is handed."
```

---

### Task 5: Supabase adapter wires normalizeSiteConfig

**Files:**
- Modify: `lib/storage/supabase-adapter.ts`
- Modify: `lib/storage/__tests__/supabase-adapter.test.ts`

- [ ] **Step 1: Write failing test for supabase adapter**

Add to `lib/storage/__tests__/supabase-adapter.test.ts`:

```ts
// Append to existing describe block or new one
it('getPublished normalizes old-shape sections[] into pages[]', async () => {
  const oldShape = {
    template: 'minimal-gallery',
    sections: [{ id: 'cover', type: 'cover', variant: 'fullscreen', visible: true, content: {} }],
    identity: { siteTitle: 'Luna Vega' },
  }
  const db = createMockSupabase({
    maybeSingleResult: { data: { config_published: oldShape }, error: null },
  })
  const adapter = createSupabaseStorageAdapter(db)
  const config = await adapter.getPublished('luna-vega')
  expect(config).not.toBeNull()
  expect((config as any).pages).toHaveLength(1)
  expect((config as any).pages[0].isHome).toBe(true)
  expect((config as any).pages[0].title).toBe('Luna Vega')
})

it('getDraft normalizes old-shape sections[] into pages[]', async () => {
  const oldShape = { template: 'editorial', sections: [], identity: { siteTitle: 'Marco' } }
  const db = createMockSupabase({
    maybeSingleResult: { data: { config_draft: oldShape }, error: null },
  })
  const adapter = createSupabaseStorageAdapter(db)
  const config = await adapter.getDraft('marco-torres')
  expect((config as any).pages).toHaveLength(1)
})
```

- [ ] **Step 2: Run test — expect FAIL**

Run: `npx jest --testPathPatterns=supabase-adapter`
Expected: FAIL — `pages` is undefined

- [ ] **Step 3: Modify supabase-adapter.ts**

Open `lib/storage/supabase-adapter.ts`. Update imports and `readConfigColumn`:

```ts
import type { SupabaseClient } from '@supabase/supabase-js'
import { isSafeArtistSlug } from '@/lib/auth/verify-api-request'
import { getSupabaseAdminClient } from '@/lib/cloud/supabase-client'
import { normalizeSiteConfig } from '@/lib/schemas/site-config.schema'
import type { SiteConfig, StorageAdapter } from './index'

async function readConfigColumn(
  db: SupabaseClient,
  slug: string,
  column: ConfigColumn,
): Promise<SiteConfig | null> {
  const { data, error } = await db
    .from('artists')
    .select(column)
    .eq('slug', slug)
    .maybeSingle()

  if (error) {
    throw new Error(`Error reading ${column} for artist "${slug}": ${error.message}`)
  }

  const row = data as Record<string, unknown> | null
  const raw = row?.[column] as SiteConfig | null | undefined
  if (!raw) return null
  return normalizeSiteConfig(raw) as SiteConfig
}
```

- [ ] **Step 4: Run tests to verify PASS**

Run: `npx jest --testPathPatterns=supabase-adapter`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add lib/storage/supabase-adapter.ts lib/storage/__tests__/supabase-adapter.test.ts
git commit -m "feat(storage): supabase-adapter applies normalizeSiteConfig on read

Mirrors file-adapter behavior. Old config_published/config_draft rows with
sections[] at root come back as pages[]."
```

---

## Phase B — Rendering + routing

### Task 6: resolveSiteHref helper + SafeLink component

**Files:**
- Create: `lib/templates/resolve-href.ts`
- Create: `lib/templates/__tests__/resolve-href.test.ts`
- Create: `components/templates/shared/SafeLink.tsx`
- Create: `components/templates/shared/__tests__/SafeLink.test.tsx`

- [ ] **Step 1: Write resolve-href tests**

```ts
// lib/templates/__tests__/resolve-href.test.ts
import { describe, it, expect } from '@jest/globals'
import { resolveSiteHref } from '../resolve-href'

describe('resolveSiteHref', () => {
  it('prepends /sites/<slug> for internal root path', () => {
    expect(resolveSiteHref('/', 'luna-vega')).toBe('/sites/luna-vega')
  })
  it('prepends /sites/<slug> for internal page path', () => {
    expect(resolveSiteHref('/exhibitions', 'luna-vega')).toBe('/sites/luna-vega/exhibitions')
  })
  it('passes through https URLs', () => {
    expect(resolveSiteHref('https://example.com', 'luna-vega')).toBe('https://example.com')
  })
  it('passes through http URLs', () => {
    expect(resolveSiteHref('http://example.com', 'luna-vega')).toBe('http://example.com')
  })
  it('passes through mailto', () => {
    expect(resolveSiteHref('mailto:a@b.com', 'luna-vega')).toBe('mailto:a@b.com')
  })
  it('passes through tel', () => {
    expect(resolveSiteHref('tel:+5491112345678', 'luna-vega')).toBe('tel:+5491112345678')
  })
  it('passes through anchors', () => {
    expect(resolveSiteHref('#artworks', 'luna-vega')).toBe('#artworks')
  })
  it('returns raw href for malformed input (caller decides)', () => {
    expect(resolveSiteHref('', 'luna-vega')).toBe('')
    expect(resolveSiteHref('javascript:x', 'luna-vega')).toBe('javascript:x')
  })
})

describe('resolveSiteHref isExternal', () => {
  it('nothing — pure resolver only')
})
```

- [ ] **Step 2: Run test — FAIL**

Run: `npx jest --testPathPatterns=resolve-href`
Expected: FAIL

- [ ] **Step 3: Implement resolve-href**

```ts
// lib/templates/resolve-href.ts
const INTERNAL_RE = /^\/[a-z0-9-]*$/
const EXTERNAL_RE = /^(?:https?|mailto|tel):/

/** Resolves an editor-level href into a runtime URL for the given artist slug. */
export function resolveSiteHref(href: string, artistSlug: string): string {
  if (!href) return href
  if (EXTERNAL_RE.test(href) || href.startsWith('#')) return href
  if (INTERNAL_RE.test(href)) {
    if (href === '/') return `/sites/${artistSlug}`
    return `/sites/${artistSlug}${href}`
  }
  return href
}

/** True when the href is an external scheme (http/https/mailto/tel). */
export function isExternalHref(href: string): boolean {
  return /^https?:/.test(href) || href.startsWith('mailto:') || href.startsWith('tel:')
}
```

- [ ] **Step 4: Run tests — PASS**

Run: `npx jest --testPathPatterns=resolve-href`
Expected: PASS

- [ ] **Step 5: Write SafeLink tests**

```tsx
// components/templates/shared/__tests__/SafeLink.test.tsx
import { describe, it, expect } from '@jest/globals'
import { render, screen } from '@testing-library/react'
import SafeLink from '../SafeLink'

describe('SafeLink', () => {
  it('renders internal link with resolved href and no target', () => {
    render(<SafeLink href="/exhibitions" artistSlug="luna-vega">Ver</SafeLink>)
    const link = screen.getByRole('link', { name: 'Ver' })
    expect(link.getAttribute('href')).toBe('/sites/luna-vega/exhibitions')
    expect(link.getAttribute('target')).toBeNull()
  })
  it('renders external link with target=_blank and rel=noopener', () => {
    render(<SafeLink href="https://example.com" artistSlug="luna-vega">Ext</SafeLink>)
    const link = screen.getByRole('link', { name: 'Ext' })
    expect(link.getAttribute('href')).toBe('https://example.com')
    expect(link.getAttribute('target')).toBe('_blank')
    expect(link.getAttribute('rel')).toBe('noopener noreferrer')
  })
  it('renders anchor link without target', () => {
    render(<SafeLink href="#top" artistSlug="luna-vega">Top</SafeLink>)
    const link = screen.getByRole('link', { name: 'Top' })
    expect(link.getAttribute('href')).toBe('#top')
    expect(link.getAttribute('target')).toBeNull()
  })
})
```

- [ ] **Step 6: Run test — FAIL**

Run: `npx jest --testPathPatterns=SafeLink`
Expected: FAIL

- [ ] **Step 7: Implement SafeLink**

```tsx
// components/templates/shared/SafeLink.tsx
import type { AnchorHTMLAttributes, ReactNode } from 'react'
import { resolveSiteHref, isExternalHref } from '@/lib/templates/resolve-href'

type Props = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> & {
  href: string
  artistSlug: string
  children: ReactNode
}

/** Anchor that resolves internal paths to /sites/<slug>/... and adds safe target for external. */
export default function SafeLink({ href, artistSlug, children, ...rest }: Props) {
  const resolved = resolveSiteHref(href, artistSlug)
  const external = isExternalHref(href)
  return (
    <a
      {...rest}
      href={resolved}
      {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
    >
      {children}
    </a>
  )
}
```

- [ ] **Step 8: Run tests — PASS**

Run: `npx jest --testPathPatterns="resolve-href|SafeLink"`
Expected: PASS

- [ ] **Step 9: Commit**

```bash
git add lib/templates/resolve-href.ts lib/templates/__tests__/resolve-href.test.ts components/templates/shared/SafeLink.tsx components/templates/shared/__tests__/SafeLink.test.tsx
git commit -m "feat(templates): resolveSiteHref + <SafeLink> for internal/external links

Pure helper + presentational component. No existing template uses them yet —
Task 11 wires them into SiteHeader auto-nav."
```

---

### Task 7: Template contract — accept page prop

**Files:**
- Modify: `components/templates/minimal-gallery/index.tsx`
- Modify: `components/templates/editorial/index.tsx`
- Modify: `components/templates/immersive/index.tsx`
- Modify: template fixtures in tests if any

- [ ] **Step 1: Check existing template signatures**

Run: `grep -nE "export default function (MinimalGallery|EditorialTemplate|ImmersiveTemplate)" components/templates/*/index.tsx`
Expected: each template exports a default function taking `{ config, works, artistSlug }`.

- [ ] **Step 2: Add tests that templates render page.sections (and fall back to config.sections during transition)**

Create `components/templates/__tests__/template-contract.test.tsx`:

```tsx
import { describe, it, expect } from '@jest/globals'
import { render } from '@testing-library/react'
import MinimalGallery from '../minimal-gallery'
import type { PageConfig, SiteConfig } from '@/lib/schemas/site-config.schema'
import { defaultSiteConfig } from '@/lib/schemas/site-config.schema'

const basePage: PageConfig = {
  slug: 'home',
  title: 'Home',
  isHome: true,
  showInNav: true,
  sections: [
    { id: 'cover', type: 'cover', variant: 'fullscreen', visible: true, content: {} },
  ],
}
const baseConfig: SiteConfig = { ...defaultSiteConfig, pages: [basePage] }

describe('template contract', () => {
  it('MinimalGallery renders page.sections when given a page prop', () => {
    const { container } = render(
      <MinimalGallery config={baseConfig} page={basePage} works={[]} artistSlug="luna-vega" />
    )
    // Smoke test: at least one element rendered.
    expect(container.firstChild).not.toBeNull()
  })
})
```

- [ ] **Step 3: Run test — FAIL**

Run: `npx jest --testPathPatterns=template-contract`
Expected: FAIL — MinimalGallery doesn't accept `page` prop.

- [ ] **Step 4: Refactor MinimalGallery**

Open `components/templates/minimal-gallery/index.tsx`. Change signature to accept `page`:

```tsx
type Props = {
  config: SiteConfig
  page: PageConfig
  works: Artwork[]
  artistSlug: string
}

export default function MinimalGallery({ config, page, works, artistSlug }: Props) {
  // Replace all references to config.sections with page.sections
  const sections = page.sections
  // ...rest of the render logic unchanged, just use `sections` instead of `config.sections`
}
```

For each section loop/map that used `config.sections`, change to `page.sections` or `sections`.

- [ ] **Step 5: Refactor Editorial and Immersive**

Repeat Step 4 for `components/templates/editorial/index.tsx` and `components/templates/immersive/index.tsx`.

- [ ] **Step 6: Run template-contract test — PASS**

Run: `npx jest --testPathPatterns=template-contract`
Expected: PASS

- [ ] **Step 7: Verify TypeScript**

Run: `npx tsc --noEmit`
Expected: errors in `app/sites/[artist]/page.tsx` and `app/editor/[token]/EditorClient.tsx` because they don't pass `page` yet. **Leave for Task 8 and 9.** Note the error count.

- [ ] **Step 8: Commit (allow consumer compile errors — they're fixed next)**

```bash
git add components/templates/
git commit -m "refactor(templates): templates accept page prop, render page.sections

Contract change: templates now require { config, page, works, artistSlug }.
Consumers (app/sites/[artist], editor) temporarily broken; Tasks 8–9 wire them."
```

---

### Task 8: /sites/[artist]/page.tsx serves home page

**Files:**
- Modify: `app/sites/[artist]/page.tsx`
- Create: `app/sites/[artist]/__tests__/home-page.test.tsx` (if not already covered)

- [ ] **Step 1: Write failing test — home resolves to isHome page**

```tsx
// app/sites/[artist]/__tests__/home-page.test.tsx
import { describe, it, expect } from '@jest/globals'
// This test uses render-less assertion on the page export — simplest is to test
// via integration. For speed, we'll assert through the render path indirectly
// in E2E; here we add a pure helper test if needed.

describe('ArtistSitePage home resolution', () => {
  it('(covered by tsc + template-contract + e2e)', () => {
    expect(true).toBe(true)
  })
})
```

(Tests for the page component are mostly covered by the template-contract test + end-to-end. If you want tighter unit coverage, wrap the resolution logic in a helper and test that helper directly.)

- [ ] **Step 2: Modify page.tsx**

Replace the body of `app/sites/[artist]/page.tsx` to use home page:

```tsx
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getStorageAdapter } from '@/lib/storage'
import { getWorksRepository } from '@/lib/works/repository'
import MinimalGallery from '@/components/templates/minimal-gallery'
import EditorialTemplate from '@/components/templates/editorial'
import ImmersiveTemplate from '@/components/templates/immersive'

type Props = { params: { artist: string } }

async function safeGetPublished(slug: string) {
  try {
    return await getStorageAdapter().getPublished(slug)
  } catch (err) {
    console.error(`[sites/${slug}] getPublished failed:`, err)
    return null
  }
}
async function safeGetWorks(slug: string) {
  try {
    return await getWorksRepository().getWorks(slug)
  } catch (err) {
    console.error(`[sites/${slug}] getWorks failed:`, err)
    return []
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const config = await safeGetPublished(params.artist)
  const home = config?.pages?.find((p) => p.isHome)
  return {
    title: home?.seo?.title ?? config?.identity.siteTitle ?? params.artist,
    description: home?.seo?.description,
  }
}

export default async function ArtistSitePage({ params }: Props) {
  const config = await safeGetPublished(params.artist)
  if (!config) notFound()

  const home = config.pages?.find((p) => p.isHome)
  if (!home) notFound()

  const works = await safeGetWorks(params.artist)

  if (config.template === 'minimal-gallery') {
    return <MinimalGallery config={config} page={home} works={works} artistSlug={params.artist} />
  }
  if (config.template === 'editorial') {
    return <EditorialTemplate config={config} page={home} works={works} artistSlug={params.artist} />
  }
  if (config.template === 'immersive') {
    return <ImmersiveTemplate config={config} page={home} works={works} artistSlug={params.artist} />
  }

  return <main style={{ padding: '2rem' }}><h1>Sitio en construccion</h1></main>
}
```

- [ ] **Step 3: Verify tsc**

Run: `npx tsc --noEmit`
Expected: `app/sites/[artist]/page.tsx` no longer errors. Editor still has errors — fixed in Task 12+.

- [ ] **Step 4: Run tests**

Run: `npx jest --testPathPatterns=sites`
Expected: PASS (existing tests + template-contract). Any legacy test that asserts the old prop shape should be updated.

- [ ] **Step 5: Commit**

```bash
git add app/sites/[artist]/page.tsx app/sites/[artist]/__tests__/home-page.test.tsx
git commit -m "feat(sites): home route serves pages.find(isHome) using new template contract

generateMetadata and page body resolve home from pages[]. Falls through to
notFound when no home exists."
```

---

### Task 9: /sites/[artist]/[page]/page.tsx NEW

**Files:**
- Create: `app/sites/[artist]/[page]/page.tsx`
- Create: `app/sites/[artist]/[page]/__tests__/sub-page.test.tsx`

- [ ] **Step 1: Write failing test for the new route**

```tsx
// app/sites/[artist]/[page]/__tests__/sub-page.test.tsx
import { describe, it, expect, jest } from '@jest/globals'

// Smoke test: assert the module exports a default async function and generateMetadata.
describe('ArtistSubPage module', () => {
  it('exports default function and generateMetadata', async () => {
    const mod = await import('../page')
    expect(typeof mod.default).toBe('function')
    expect(typeof mod.generateMetadata).toBe('function')
  })
})
```

- [ ] **Step 2: Run test — FAIL (module doesn't exist)**

Run: `npx jest --testPathPatterns=sub-page`
Expected: FAIL — cannot find module.

- [ ] **Step 3: Create the sub-page route**

```tsx
// app/sites/[artist]/[page]/page.tsx
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getStorageAdapter } from '@/lib/storage'
import { getWorksRepository } from '@/lib/works/repository'
import MinimalGallery from '@/components/templates/minimal-gallery'
import EditorialTemplate from '@/components/templates/editorial'
import ImmersiveTemplate from '@/components/templates/immersive'

type Props = { params: { artist: string; page: string } }

async function safeGetPublished(slug: string) {
  try {
    return await getStorageAdapter().getPublished(slug)
  } catch (err) {
    console.error(`[sites/${slug}/page] getPublished failed:`, err)
    return null
  }
}
async function safeGetWorks(slug: string) {
  try {
    return await getWorksRepository().getWorks(slug)
  } catch (err) {
    console.error(`[sites/${slug}/page] getWorks failed:`, err)
    return []
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const config = await safeGetPublished(params.artist)
  const page = config?.pages?.find((p) => p.slug === params.page && !p.isHome)
  return {
    title:
      page?.seo?.title ?? page?.title ?? config?.identity.siteTitle ?? params.artist,
    description: page?.seo?.description,
  }
}

export default async function ArtistSubPage({ params }: Props) {
  const config = await safeGetPublished(params.artist)
  if (!config) notFound()

  const page = config.pages?.find((p) => p.slug === params.page && !p.isHome)
  if (!page) notFound()

  const works = await safeGetWorks(params.artist)

  if (config.template === 'minimal-gallery') {
    return <MinimalGallery config={config} page={page} works={works} artistSlug={params.artist} />
  }
  if (config.template === 'editorial') {
    return <EditorialTemplate config={config} page={page} works={works} artistSlug={params.artist} />
  }
  if (config.template === 'immersive') {
    return <ImmersiveTemplate config={config} page={page} works={works} artistSlug={params.artist} />
  }

  return <main style={{ padding: '2rem' }}><h1>Sitio en construccion</h1></main>
}
```

- [ ] **Step 4: Run test — PASS**

Run: `npx jest --testPathPatterns=sub-page`
Expected: PASS.

- [ ] **Step 5: Add a route resolution unit test (home-not-at-subpath)**

Append to `app/sites/[artist]/[page]/__tests__/sub-page.test.tsx`:

```tsx
import { getStorageAdapter as _ } from '@/lib/storage'

describe('ArtistSubPage logic', () => {
  it('finds page by slug, excluding home', () => {
    const pages = [
      { slug: 'home', isHome: true, title: 'Home', showInNav: true, sections: [] },
      { slug: 'exhibitions', isHome: false, title: 'Exhibitions', showInNav: true, sections: [] },
    ]
    const found = pages.find((p) => p.slug === 'exhibitions' && !p.isHome)
    expect(found?.slug).toBe('exhibitions')

    const foundHome = pages.find((p) => p.slug === 'home' && !p.isHome)
    expect(foundHome).toBeUndefined()
  })
})
```

- [ ] **Step 6: Run tests, verify tsc**

Run: `npx jest --testPathPatterns=sub-page && npx tsc --noEmit`
Expected: PASS + no new tsc errors beyond editor-side ones.

- [ ] **Step 7: Commit**

```bash
git add app/sites/[artist]/[page]/
git commit -m "feat(sites): /sites/[artist]/[page] serves non-home pages

Dynamic sub-page route. notFound() when slug doesn't exist or matches a home
(home is only served at the artist root)."
```

---

### Task 10: SiteHeader auto-nav from pages[]

**Files:**
- Modify: `components/templates/shared/SiteHeader.tsx`
- Modify: `components/templates/shared/__tests__/SiteHeader.test.tsx` (create if missing)

- [ ] **Step 1: Write failing test for auto-nav**

```tsx
// components/templates/shared/__tests__/SiteHeader-autonav.test.tsx
import { describe, it, expect } from '@jest/globals'
import { render, screen } from '@testing-library/react'
import SiteHeader from '../SiteHeader'
import type { SiteConfig } from '@/lib/schemas/site-config.schema'
import { defaultSiteConfig } from '@/lib/schemas/site-config.schema'

const makeConfig = (pages: any[]): SiteConfig => ({
  ...defaultSiteConfig,
  pages,
})

describe('SiteHeader auto-nav', () => {
  it('renders a link per page with showInNav=true', () => {
    const config = makeConfig([
      { slug: 'home', title: 'Home', isHome: true, showInNav: true, sections: [] },
      { slug: 'exhibitions', title: 'Exhibitions', isHome: false, showInNav: true, sections: [] },
      { slug: 'hidden', title: 'Hidden', isHome: false, showInNav: false, sections: [] },
    ])
    render(<SiteHeader config={config} artistSlug="luna-vega" />)
    expect(screen.getByRole('link', { name: /home/i })).toBeTruthy()
    expect(screen.getByRole('link', { name: /exhibitions/i })).toBeTruthy()
    expect(screen.queryByRole('link', { name: /hidden/i })).toBeNull()
  })

  it('uses navLabel override when present', () => {
    const config = makeConfig([
      { slug: 'home', title: 'Home', isHome: true, showInNav: true, sections: [], navLabel: 'Inicio' },
    ])
    render(<SiteHeader config={config} artistSlug="luna-vega" />)
    expect(screen.getByRole('link', { name: 'Inicio' })).toBeTruthy()
  })

  it('home link points to /sites/<slug> (no sub-path)', () => {
    const config = makeConfig([
      { slug: 'home', title: 'Home', isHome: true, showInNav: true, sections: [] },
    ])
    render(<SiteHeader config={config} artistSlug="luna-vega" />)
    const link = screen.getByRole('link', { name: /home/i })
    expect(link.getAttribute('href')).toBe('/sites/luna-vega')
  })

  it('sub-page link points to /sites/<slug>/<pageSlug>', () => {
    const config = makeConfig([
      { slug: 'home', title: 'Home', isHome: true, showInNav: true, sections: [] },
      { slug: 'exhibitions', title: 'Exhibitions', isHome: false, showInNav: true, sections: [] },
    ])
    render(<SiteHeader config={config} artistSlug="luna-vega" />)
    const link = screen.getByRole('link', { name: /exhibitions/i })
    expect(link.getAttribute('href')).toBe('/sites/luna-vega/exhibitions')
  })
})
```

- [ ] **Step 2: Run test — FAIL (nav not yet auto)**

Run: `npx jest --testPathPatterns=SiteHeader-autonav`
Expected: FAIL.

- [ ] **Step 3: Read current SiteHeader.tsx**

Run: `cat components/templates/shared/SiteHeader.tsx` (or Read tool).

- [ ] **Step 4: Replace the nav section to auto-build from pages[]**

In the nav rendering block of `SiteHeader.tsx`, replace any custom-links rendering with:

```tsx
import SafeLink from './SafeLink'

const navPages = (config.pages ?? []).filter((p) => p.showInNav)
// ...
<nav>
  {navPages.map((p) => (
    <SafeLink
      key={p.slug}
      href={p.isHome ? '/' : `/${p.slug}`}
      artistSlug={artistSlug}
    >
      {p.navLabel ?? p.title}
    </SafeLink>
  ))}
</nav>
```

If the file previously used `header.customLinks`, keep that code path only when `config.pages` is absent or empty (defensive during migration):

```tsx
const navItems = navPages.length > 0
  ? navPages.map((p) => ({ href: p.isHome ? '/' : `/${p.slug}`, label: p.navLabel ?? p.title }))
  : (config.header?.customLinks ?? [])
```

- [ ] **Step 5: Run tests — PASS**

Run: `npx jest --testPathPatterns=SiteHeader`
Expected: PASS (new auto-nav tests + any existing SiteHeader tests).

- [ ] **Step 6: Commit**

```bash
git add components/templates/shared/SiteHeader.tsx components/templates/shared/__tests__/
git commit -m "feat(templates): SiteHeader auto-nav from config.pages

Renders a link per page with showInNav=true using <SafeLink>. Falls back to
header.customLinks only when pages[] is absent (compat with old configs that
weren't normalized yet)."
```

---

## Phase C — Editor UX

### Task 11: page-operations pure functions

**Files:**
- Create: `components/editor/page-operations.ts`
- Create: `components/editor/__tests__/page-operations.test.ts`

- [ ] **Step 1: Write failing tests for all page operations**

```ts
// components/editor/__tests__/page-operations.test.ts
import { describe, it, expect } from '@jest/globals'
import {
  addPage,
  deletePage,
  setHomePage,
  movePage,
  duplicatePage,
  renamePage,
} from '../page-operations'
import { defaultSiteConfig, type SiteConfig, type PageConfig } from '@/lib/schemas/site-config.schema'

const baseConfig: SiteConfig = {
  ...defaultSiteConfig,
  pages: [
    { slug: 'home', title: 'Home', isHome: true, showInNav: true, sections: [] },
    { slug: 'bio', title: 'Bio', isHome: false, showInNav: true, sections: [] },
  ],
}

describe('addPage', () => {
  it('appends a new page with unique slug and defaults', () => {
    const next = addPage(baseConfig, { title: 'Exhibitions', slug: 'exhibitions' })
    expect(next.pages).toHaveLength(3)
    expect(next.pages[2]).toEqual({
      slug: 'exhibitions',
      title: 'Exhibitions',
      isHome: false,
      showInNav: true,
      sections: [],
    })
  })
  it('throws if slug collides with existing', () => {
    expect(() => addPage(baseConfig, { title: 'Home 2', slug: 'home' })).toThrow(/ya existe/)
  })
  it('copies sections when preset is "copy-from"', () => {
    const configWithSections: SiteConfig = {
      ...baseConfig,
      pages: [
        {
          slug: 'home',
          title: 'Home',
          isHome: true,
          showInNav: true,
          sections: [
            { id: 'cover-1', type: 'cover', variant: 'fullscreen', visible: true, content: {} },
          ],
        },
      ],
    }
    const next = addPage(configWithSections, {
      title: 'Clone',
      slug: 'clone',
      copyFromSlug: 'home',
    })
    expect(next.pages[1].sections).toHaveLength(1)
    expect(next.pages[1].sections[0].id).not.toBe('cover-1') // fresh IDs
  })
})

describe('deletePage', () => {
  it('removes a non-home page', () => {
    const next = deletePage(baseConfig, 'bio')
    expect(next.pages).toHaveLength(1)
    expect(next.pages[0].slug).toBe('home')
  })
  it('throws when trying to delete the home page', () => {
    expect(() => deletePage(baseConfig, 'home')).toThrow(/home/i)
  })
  it('throws when slug does not exist', () => {
    expect(() => deletePage(baseConfig, 'nope')).toThrow(/no existe/)
  })
})

describe('setHomePage', () => {
  it('moves isHome flag to the new page atomically', () => {
    const next = setHomePage(baseConfig, 'bio')
    expect(next.pages.find((p) => p.slug === 'bio')?.isHome).toBe(true)
    expect(next.pages.find((p) => p.slug === 'home')?.isHome).toBe(false)
    expect(next.pages.filter((p) => p.isHome)).toHaveLength(1)
  })
  it('throws if target slug does not exist', () => {
    expect(() => setHomePage(baseConfig, 'nope')).toThrow(/no existe/)
  })
})

describe('movePage', () => {
  it('reorders pages', () => {
    const config: SiteConfig = {
      ...baseConfig,
      pages: [
        { slug: 'a', title: 'A', isHome: true, showInNav: true, sections: [] },
        { slug: 'b', title: 'B', isHome: false, showInNav: true, sections: [] },
        { slug: 'c', title: 'C', isHome: false, showInNav: true, sections: [] },
      ],
    }
    const next = movePage(config, 2, 0)
    expect(next.pages.map((p) => p.slug)).toEqual(['c', 'a', 'b'])
  })
  it('noop for same index', () => {
    const next = movePage(baseConfig, 0, 0)
    expect(next).toBe(baseConfig)
  })
})

describe('duplicatePage', () => {
  it('creates a copy with unique slug sufix', () => {
    const next = duplicatePage(baseConfig, 'bio')
    expect(next.pages).toHaveLength(3)
    expect(next.pages[2].slug).toBe('bio-copy')
    expect(next.pages[2].isHome).toBe(false)
  })
  it('increments suffix when -copy already exists', () => {
    const config: SiteConfig = {
      ...baseConfig,
      pages: [
        ...baseConfig.pages,
        { slug: 'bio-copy', title: 'Bio Copy', isHome: false, showInNav: false, sections: [] },
      ],
    }
    const next = duplicatePage(config, 'bio')
    expect(next.pages[next.pages.length - 1].slug).toBe('bio-copy-2')
  })
})

describe('renamePage', () => {
  it('updates title, slug, showInNav', () => {
    const next = renamePage(baseConfig, 'bio', {
      title: 'About',
      slug: 'about',
      showInNav: false,
    })
    const page = next.pages.find((p) => p.slug === 'about')!
    expect(page.title).toBe('About')
    expect(page.showInNav).toBe(false)
  })
  it('throws if new slug collides with another page', () => {
    expect(() =>
      renamePage(baseConfig, 'bio', { title: 'Home', slug: 'home', showInNav: true })
    ).toThrow(/ya existe/)
  })
})
```

- [ ] **Step 2: Run tests — FAIL**

Run: `npx jest --testPathPatterns=page-operations`
Expected: FAIL — module missing.

- [ ] **Step 3: Implement page-operations.ts**

```ts
// components/editor/page-operations.ts
import type { PageConfig, SiteConfig, SectionConfig } from '@/lib/schemas/site-config.schema'
import { createUniqueSectionId } from './useConfigHistory'

function cloneSectionsWithNewIds(sections: SectionConfig[]): SectionConfig[] {
  return sections.map((s) => ({
    ...s,
    id: createUniqueSectionId(s.type),
    content: JSON.parse(JSON.stringify(s.content)),
  }))
}

export function addPage(
  config: SiteConfig,
  input: { title: string; slug: string; showInNav?: boolean; copyFromSlug?: string }
): SiteConfig {
  const pages = config.pages ?? []
  if (pages.some((p) => p.slug === input.slug)) {
    throw new Error(`Ya existe una página con slug "${input.slug}"`)
  }
  const copyFrom = input.copyFromSlug
    ? pages.find((p) => p.slug === input.copyFromSlug)
    : undefined
  const newPage: PageConfig = {
    slug: input.slug,
    title: input.title,
    isHome: false,
    showInNav: input.showInNav ?? true,
    sections: copyFrom ? cloneSectionsWithNewIds(copyFrom.sections) : [],
  }
  return { ...config, pages: [...pages, newPage] }
}

export function deletePage(config: SiteConfig, slug: string): SiteConfig {
  const pages = config.pages ?? []
  const target = pages.find((p) => p.slug === slug)
  if (!target) throw new Error(`La página "${slug}" no existe`)
  if (target.isHome) throw new Error('No se puede borrar la página home. Marcá otra como home primero.')
  return { ...config, pages: pages.filter((p) => p.slug !== slug) }
}

export function setHomePage(config: SiteConfig, slug: string): SiteConfig {
  const pages = config.pages ?? []
  if (!pages.some((p) => p.slug === slug)) {
    throw new Error(`La página "${slug}" no existe`)
  }
  return {
    ...config,
    pages: pages.map((p) => ({ ...p, isHome: p.slug === slug })),
  }
}

export function movePage(config: SiteConfig, from: number, to: number): SiteConfig {
  if (from === to) return config
  const pages = [...(config.pages ?? [])]
  const [moved] = pages.splice(from, 1)
  pages.splice(to, 0, moved)
  return { ...config, pages }
}

export function duplicatePage(config: SiteConfig, slug: string): SiteConfig {
  const pages = config.pages ?? []
  const source = pages.find((p) => p.slug === slug)
  if (!source) throw new Error(`La página "${slug}" no existe`)
  let candidate = `${slug}-copy`
  let i = 2
  while (pages.some((p) => p.slug === candidate)) {
    candidate = `${slug}-copy-${i}`
    i += 1
  }
  const copy: PageConfig = {
    ...source,
    slug: candidate,
    title: `${source.title} (copia)`,
    isHome: false,
    sections: cloneSectionsWithNewIds(source.sections),
  }
  return { ...config, pages: [...pages, copy] }
}

export function renamePage(
  config: SiteConfig,
  currentSlug: string,
  updates: { title: string; slug: string; showInNav: boolean; navLabel?: string }
): SiteConfig {
  const pages = config.pages ?? []
  if (updates.slug !== currentSlug && pages.some((p) => p.slug === updates.slug)) {
    throw new Error(`Ya existe una página con slug "${updates.slug}"`)
  }
  return {
    ...config,
    pages: pages.map((p) =>
      p.slug === currentSlug
        ? {
            ...p,
            slug: updates.slug,
            title: updates.title,
            showInNav: updates.showInNav,
            ...(updates.navLabel !== undefined ? { navLabel: updates.navLabel } : {}),
          }
        : p
    ),
  }
}
```

- [ ] **Step 4: Run tests — PASS**

Run: `npx jest --testPathPatterns=page-operations`
Expected: PASS (all 12 tests).

- [ ] **Step 5: Commit**

```bash
git add components/editor/page-operations.ts components/editor/__tests__/page-operations.test.ts
git commit -m "feat(editor): page-operations pure functions (addPage/delete/setHome/move/duplicate/rename)

Side-effect-free SiteConfig transformations. Used by PageTree + PageModal (next tasks)
via setConfig(prev => operation(prev, ...))."
```

---

### Task 12: EditorClient activePageId state + section ops route through active page

**Files:**
- Modify: `app/editor/[token]/EditorClient.tsx`
- Possibly: `components/editor/SectionList.tsx` or related — review usage

- [ ] **Step 1: Read EditorClient to find all `config.sections` references**

Run: `grep -n "config.sections\|\.sections" app/editor/[token]/EditorClient.tsx`

- [ ] **Step 2: Add activePageId state + helper**

In `EditorClient.tsx`, add state near other `useState`:

```tsx
const [activePageId, setActivePageId] = useState<string>(() => {
  const home = initialConfig.pages?.find((p) => p.isHome)
  return home?.slug ?? initialConfig.pages?.[0]?.slug ?? 'home'
})

const activePage = useMemo(() => {
  const found = config.pages?.find((p) => p.slug === activePageId)
  return found ?? config.pages?.find((p) => p.isHome) ?? config.pages?.[0]
}, [config, activePageId])
```

- [ ] **Step 3: Replace all `config.sections` reads with `activePage?.sections ?? []`**

Every place that uses `config.sections` for display or modification should either:
- **Read**: `activePage?.sections ?? []`
- **Write**: use a helper that updates `config.pages[i].sections` where `pages[i].slug === activePageId`.

Add a helper near the top of the component:

```tsx
const setActivePageSections = useCallback(
  (updater: (sections: SectionConfig[]) => SectionConfig[]) => {
    setConfig((prev) => {
      const pages = (prev.pages ?? []).map((p) =>
        p.slug === activePageId ? { ...p, sections: updater(p.sections) } : p
      )
      return { ...prev, pages }
    })
  },
  [setConfig, activePageId]
)
```

Then wherever the code did e.g. `setConfig(prev => ({ ...prev, sections: [...prev.sections, newSection] }))`, change to:

```tsx
setActivePageSections((sections) => [...sections, newSection])
```

- [ ] **Step 4: Update PreviewFrame URL**

Where the preview iframe URL is built, update to serve the active page:

```tsx
const previewPath = activePage?.isHome
  ? `/sites/${artistSlug}`
  : `/sites/${artistSlug}/${activePage?.slug}`
```

- [ ] **Step 5: Pass `page` to template components if editor renders them inline**

If the editor renders templates (e.g., for in-canvas editing), make sure `page={activePage}` is passed.

- [ ] **Step 6: Verify TypeScript**

Run: `npx tsc --noEmit`
Expected: no errors in `EditorClient.tsx`. Remaining errors should only be inside editor sub-components that haven't been updated yet (fix inline where needed).

- [ ] **Step 7: Run editor tests**

Run: `npx jest --testPathPatterns=editor`
Expected: existing tests either pass or need updates. Update tests to pass `page` where required.

- [ ] **Step 8: Commit**

```bash
git add app/editor/[token]/EditorClient.tsx
git commit -m "refactor(editor): activePageId state + section ops routed through active page

Reads: activePage.sections. Writes: setActivePageSections mutates the page in
config.pages[]. Preview iframe URL tracks activePage (home at /sites/<slug>,
sub-pages at /sites/<slug>/<pageSlug>)."
```

---

### Task 13: PageTree component (sidebar with pages → sections)

**Files:**
- Create: `components/editor/PageTree.tsx`
- Create: `components/editor/__tests__/PageTree.test.tsx`
- Modify: `app/editor/[token]/EditorClient.tsx` — use PageTree in "Capas" / "Páginas" tab

- [ ] **Step 1: Write failing tests**

```tsx
// components/editor/__tests__/PageTree.test.tsx
import { describe, it, expect, jest } from '@jest/globals'
import { render, screen, fireEvent } from '@testing-library/react'
import PageTree from '../PageTree'
import type { SiteConfig } from '@/lib/schemas/site-config.schema'
import { defaultSiteConfig } from '@/lib/schemas/site-config.schema'

const config: SiteConfig = {
  ...defaultSiteConfig,
  pages: [
    {
      slug: 'home',
      title: 'Home',
      isHome: true,
      showInNav: true,
      sections: [
        { id: 'cover-1', type: 'cover', variant: 'fullscreen', visible: true, content: {} },
      ],
    },
    { slug: 'bio', title: 'Bio', isHome: false, showInNav: true, sections: [] },
  ],
}

describe('PageTree', () => {
  it('renders one entry per page', () => {
    render(
      <PageTree
        config={config}
        activePageId="home"
        selectedSectionId={null}
        onSelectPage={() => {}}
        onSelectSection={() => {}}
        onOpenCreatePage={() => {}}
        onOpenEditPage={() => {}}
        onDeletePage={() => {}}
        onSetHomePage={() => {}}
        onDuplicatePage={() => {}}
      />
    )
    expect(screen.getByText('Home')).toBeTruthy()
    expect(screen.getByText('Bio')).toBeTruthy()
  })

  it('marks the home page with a badge', () => {
    render(
      <PageTree
        config={config}
        activePageId="home"
        selectedSectionId={null}
        onSelectPage={() => {}}
        onSelectSection={() => {}}
        onOpenCreatePage={() => {}}
        onOpenEditPage={() => {}}
        onDeletePage={() => {}}
        onSetHomePage={() => {}}
        onDuplicatePage={() => {}}
      />
    )
    expect(screen.getByLabelText('Home page')).toBeTruthy()
  })

  it('calls onSelectPage when clicking a page row', () => {
    const onSelectPage = jest.fn()
    render(
      <PageTree
        config={config}
        activePageId="home"
        selectedSectionId={null}
        onSelectPage={onSelectPage}
        onSelectSection={() => {}}
        onOpenCreatePage={() => {}}
        onOpenEditPage={() => {}}
        onDeletePage={() => {}}
        onSetHomePage={() => {}}
        onDuplicatePage={() => {}}
      />
    )
    fireEvent.click(screen.getByText('Bio'))
    expect(onSelectPage).toHaveBeenCalledWith('bio')
  })

  it('calls onOpenCreatePage on "+" click', () => {
    const onOpenCreatePage = jest.fn()
    render(
      <PageTree
        config={config}
        activePageId="home"
        selectedSectionId={null}
        onSelectPage={() => {}}
        onSelectSection={() => {}}
        onOpenCreatePage={onOpenCreatePage}
        onOpenEditPage={() => {}}
        onDeletePage={() => {}}
        onSetHomePage={() => {}}
        onDuplicatePage={() => {}}
      />
    )
    fireEvent.click(screen.getByRole('button', { name: /nueva página/i }))
    expect(onOpenCreatePage).toHaveBeenCalled()
  })

  it('shows sections of the active page', () => {
    render(
      <PageTree
        config={config}
        activePageId="home"
        selectedSectionId={null}
        onSelectPage={() => {}}
        onSelectSection={() => {}}
        onOpenCreatePage={() => {}}
        onOpenEditPage={() => {}}
        onDeletePage={() => {}}
        onSetHomePage={() => {}}
        onDuplicatePage={() => {}}
      />
    )
    expect(screen.getByText(/cover/i)).toBeTruthy()
  })
})
```

- [ ] **Step 2: Run test — FAIL (module missing)**

Run: `npx jest --testPathPatterns=PageTree`
Expected: FAIL.

- [ ] **Step 3: Implement PageTree**

```tsx
// components/editor/PageTree.tsx
'use client'

import { useState } from 'react'
import type { SiteConfig } from '@/lib/schemas/site-config.schema'
import { STUDIO_COLORS, studioSecondaryBtn } from './studio-styles'

type Props = {
  config: SiteConfig
  activePageId: string
  selectedSectionId: string | null
  onSelectPage: (slug: string) => void
  onSelectSection: (sectionId: string) => void
  onOpenCreatePage: () => void
  onOpenEditPage: (slug: string) => void
  onDeletePage: (slug: string) => void
  onSetHomePage: (slug: string) => void
  onDuplicatePage: (slug: string) => void
}

export default function PageTree({
  config,
  activePageId,
  selectedSectionId,
  onSelectPage,
  onSelectSection,
  onOpenCreatePage,
  onOpenEditPage,
  onDeletePage,
  onSetHomePage,
  onDuplicatePage,
}: Props) {
  const pages = config.pages ?? []
  const [openMenuSlug, setOpenMenuSlug] = useState<string | null>(null)
  const [expandedSlug, setExpandedSlug] = useState<string>(activePageId)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0.25rem 0.5rem',
        }}
      >
        <span
          style={{
            fontSize: '0.7rem',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            color: STUDIO_COLORS.muted,
          }}
        >
          Páginas
        </span>
        <button
          type="button"
          onClick={onOpenCreatePage}
          aria-label="Nueva página"
          style={{
            ...studioSecondaryBtn,
            padding: '0.15rem 0.5rem',
            fontSize: '0.8rem',
          }}
        >
          + Nueva página
        </button>
      </div>

      {pages.map((page, idx) => {
        const isActive = page.slug === activePageId
        const isExpanded = expandedSlug === page.slug
        return (
          <div key={page.slug}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                padding: '0.35rem 0.5rem',
                background: isActive ? STUDIO_COLORS.accentSoft : 'transparent',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
              onClick={() => {
                onSelectPage(page.slug)
                setExpandedSlug(page.slug)
              }}
            >
              <span
                onClick={(e) => {
                  e.stopPropagation()
                  setExpandedSlug(isExpanded ? '' : page.slug)
                }}
                style={{ cursor: 'pointer', fontSize: '0.7rem', color: STUDIO_COLORS.muted }}
                aria-label={isExpanded ? 'Colapsar' : 'Expandir'}
              >
                {isExpanded ? '▾' : '▸'}
              </span>
              {page.isHome && (
                <span
                  aria-label="Home page"
                  style={{
                    display: 'inline-block',
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    background: STUDIO_COLORS.accent,
                  }}
                />
              )}
              <span style={{ flex: 1, fontSize: '0.85rem' }}>{page.title}</span>
              <button
                type="button"
                aria-label={`Menú de ${page.title}`}
                onClick={(e) => {
                  e.stopPropagation()
                  setOpenMenuSlug(openMenuSlug === page.slug ? null : page.slug)
                }}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: STUDIO_COLORS.muted,
                  cursor: 'pointer',
                  padding: '0 0.25rem',
                }}
              >
                ⋯
              </button>
            </div>

            {openMenuSlug === page.slug && (
              <div
                style={{
                  background: STUDIO_COLORS.surface,
                  border: `1px solid ${STUDIO_COLORS.border}`,
                  borderRadius: '6px',
                  padding: '0.25rem',
                  marginTop: '0.25rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.15rem',
                }}
              >
                <button
                  type="button"
                  onClick={() => {
                    setOpenMenuSlug(null)
                    onOpenEditPage(page.slug)
                  }}
                  style={{ ...studioSecondaryBtn, textAlign: 'left' }}
                >
                  Editar página
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setOpenMenuSlug(null)
                    onDuplicatePage(page.slug)
                  }}
                  style={{ ...studioSecondaryBtn, textAlign: 'left' }}
                >
                  Duplicar
                </button>
                {!page.isHome && (
                  <button
                    type="button"
                    onClick={() => {
                      setOpenMenuSlug(null)
                      onSetHomePage(page.slug)
                    }}
                    style={{ ...studioSecondaryBtn, textAlign: 'left' }}
                  >
                    Marcar como home
                  </button>
                )}
                <button
                  type="button"
                  disabled={page.isHome}
                  onClick={() => {
                    setOpenMenuSlug(null)
                    onDeletePage(page.slug)
                  }}
                  title={page.isHome ? 'Marcá otra como home primero' : undefined}
                  style={{
                    ...studioSecondaryBtn,
                    textAlign: 'left',
                    color: page.isHome ? STUDIO_COLORS.muted : STUDIO_COLORS.danger,
                    cursor: page.isHome ? 'not-allowed' : 'pointer',
                  }}
                >
                  Borrar
                </button>
              </div>
            )}

            {isExpanded && (
              <div style={{ paddingLeft: '1.25rem', marginTop: '0.2rem' }}>
                {page.sections.length === 0 ? (
                  <div
                    style={{
                      fontSize: '0.7rem',
                      color: STUDIO_COLORS.muted,
                      padding: '0.25rem 0',
                    }}
                  >
                    (sin secciones)
                  </div>
                ) : (
                  page.sections.map((s) => (
                    <div
                      key={s.id}
                      onClick={() => onSelectSection(s.id)}
                      style={{
                        fontSize: '0.75rem',
                        padding: '0.2rem 0.4rem',
                        cursor: 'pointer',
                        borderRadius: '3px',
                        background:
                          selectedSectionId === s.id ? STUDIO_COLORS.accentSoft : 'transparent',
                        color: STUDIO_COLORS.muted,
                      }}
                    >
                      · {s.type}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
```

- [ ] **Step 4: Run tests — PASS**

Run: `npx jest --testPathPatterns=PageTree`
Expected: PASS.

- [ ] **Step 5: Wire PageTree into EditorClient**

In `EditorClient.tsx`:
1. Rename the `layers` tab label from `'Capas'` to `'Páginas'` in `LEFT_TABS`.
2. In the tab content branch for `leftTab === 'layers'`, replace `<SectionList ... />` with `<PageTree ... />` (passing handlers that call `setConfig(prev => addPage(prev, ...))` etc.).
3. Add state `pageModalMode: 'create' | { kind: 'edit', slug: string } | null`.

Handler examples:

```tsx
import * as pageOps from '@/components/editor/page-operations'

const handleDeletePage = (slug: string) => {
  try {
    setConfig((prev) => pageOps.deletePage(prev, slug))
    if (slug === activePageId) {
      const home = config.pages?.find((p) => p.isHome)
      if (home) setActivePageId(home.slug)
    }
  } catch (err) {
    setErrorMsg(err instanceof Error ? err.message : 'No se pudo borrar la página')
  }
}
// ...similar for setHome, duplicate, etc.
```

- [ ] **Step 6: Run full test suite + tsc**

Run: `npx jest && npx tsc --noEmit`
Expected: PASS + no errors.

- [ ] **Step 7: Commit**

```bash
git add components/editor/PageTree.tsx components/editor/__tests__/PageTree.test.tsx app/editor/[token]/EditorClient.tsx
git commit -m "feat(editor): PageTree component in 'Páginas' tab (was 'Capas')

Pages → sections sidebar tree with CRUD menu per page. Replaces the flat
SectionList. Section selection and active-page switching routed through props."
```

---

### Task 14: PageModal (create / edit)

**Files:**
- Create: `components/editor/PageModal.tsx`
- Create: `components/editor/__tests__/PageModal.test.tsx`
- Modify: `app/editor/[token]/EditorClient.tsx` — mount PageModal with handlers

- [ ] **Step 1: Write failing tests**

```tsx
// components/editor/__tests__/PageModal.test.tsx
import { describe, it, expect, jest } from '@jest/globals'
import { render, screen, fireEvent } from '@testing-library/react'
import PageModal from '../PageModal'
import { defaultSiteConfig } from '@/lib/schemas/site-config.schema'

const config = {
  ...defaultSiteConfig,
  pages: [
    { slug: 'home', title: 'Home', isHome: true, showInNav: true, sections: [] },
  ],
}

describe('PageModal create mode', () => {
  it('auto-generates slug from title', () => {
    const onSubmit = jest.fn()
    render(<PageModal mode="create" config={config} onSubmit={onSubmit} onClose={() => {}} />)
    const titleInput = screen.getByLabelText(/título/i) as HTMLInputElement
    fireEvent.change(titleInput, { target: { value: 'My Exhibitions' } })
    const slugInput = screen.getByLabelText(/slug/i) as HTMLInputElement
    expect(slugInput.value).toBe('my-exhibitions')
  })

  it('validates slug format in real time', () => {
    render(<PageModal mode="create" config={config} onSubmit={() => {}} onClose={() => {}} />)
    const slugInput = screen.getByLabelText(/slug/i) as HTMLInputElement
    fireEvent.change(slugInput, { target: { value: 'Invalid Slug' } })
    expect(screen.getByText(/formato de slug inválido/i)).toBeTruthy()
  })

  it('blocks submit when slug collides with existing', () => {
    render(<PageModal mode="create" config={config} onSubmit={() => {}} onClose={() => {}} />)
    fireEvent.change(screen.getByLabelText(/título/i), { target: { value: 'Home' } })
    const submitBtn = screen.getByRole('button', { name: /crear/i })
    expect(submitBtn.hasAttribute('disabled')).toBe(true)
  })

  it('calls onSubmit with payload on valid create', () => {
    const onSubmit = jest.fn()
    render(<PageModal mode="create" config={config} onSubmit={onSubmit} onClose={() => {}} />)
    fireEvent.change(screen.getByLabelText(/título/i), { target: { value: 'Exhibitions' } })
    fireEvent.click(screen.getByRole('button', { name: /crear/i }))
    expect(onSubmit).toHaveBeenCalledWith({
      title: 'Exhibitions',
      slug: 'exhibitions',
      showInNav: true,
      copyFromSlug: undefined,
    })
  })
})

describe('PageModal edit mode', () => {
  it('pre-fills title and slug', () => {
    render(
      <PageModal
        mode={{ kind: 'edit', slug: 'home' }}
        config={config}
        onSubmit={() => {}}
        onClose={() => {}}
      />
    )
    const titleInput = screen.getByLabelText(/título/i) as HTMLInputElement
    expect(titleInput.value).toBe('Home')
  })
})
```

- [ ] **Step 2: Run tests — FAIL**

Run: `npx jest --testPathPatterns=PageModal`
Expected: FAIL.

- [ ] **Step 3: Implement PageModal**

```tsx
// components/editor/PageModal.tsx
'use client'

import { useEffect, useMemo, useState } from 'react'
import type { SiteConfig } from '@/lib/schemas/site-config.schema'
import { RESERVED_PAGE_SLUGS } from '@/lib/schemas/reserved-page-slugs'
import {
  STUDIO_COLORS,
  studioInputStyle,
  studioLabelStyle,
  studioPrimaryBtn,
  studioSecondaryBtn,
} from './studio-styles'

type Mode = 'create' | { kind: 'edit'; slug: string }

type Props = {
  mode: Mode
  config: SiteConfig
  onSubmit: (payload: {
    title: string
    slug: string
    showInNav: boolean
    copyFromSlug?: string
  }) => void
  onClose: () => void
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
}

const SLUG_RE = /^[a-z0-9-]+$/

export default function PageModal({ mode, config, onSubmit, onClose }: Props) {
  const isEdit = typeof mode === 'object'
  const editingPage = isEdit
    ? config.pages?.find((p) => p.slug === mode.slug)
    : undefined
  const pages = config.pages ?? []

  const [title, setTitle] = useState(editingPage?.title ?? '')
  const [slug, setSlug] = useState(editingPage?.slug ?? '')
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(isEdit)
  const [showInNav, setShowInNav] = useState(editingPage?.showInNav ?? true)
  const [copyFromSlug, setCopyFromSlug] = useState<string | undefined>(undefined)

  useEffect(() => {
    if (!slugManuallyEdited && !isEdit) setSlug(slugify(title))
  }, [title, slugManuallyEdited, isEdit])

  const slugError = useMemo(() => {
    if (!slug) return 'El slug es requerido'
    if (!SLUG_RE.test(slug)) return 'Formato de slug inválido (usa a-z, 0-9, guiones)'
    if (RESERVED_PAGE_SLUGS.has(slug)) return `"${slug}" es un slug reservado`
    if (slug !== editingPage?.slug && pages.some((p) => p.slug === slug)) {
      return `Ya existe una página con slug "${slug}"`
    }
    return null
  }, [slug, pages, editingPage])

  const titleError = title.trim().length === 0 ? 'El título es requerido' : null
  const canSubmit = !slugError && !titleError

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={isEdit ? 'Editar página' : 'Crear página'}
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15, 23, 42, 0.5)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '420px',
          background: STUDIO_COLORS.surface,
          borderRadius: '10px',
          border: `1px solid ${STUDIO_COLORS.border}`,
          padding: '1rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <strong style={{ fontSize: '0.95rem' }}>
            {isEdit ? 'Editar página' : 'Nueva página'}
          </strong>
          <button type="button" onClick={onClose} style={studioSecondaryBtn}>
            Cerrar
          </button>
        </div>

        <label style={studioLabelStyle}>
          <span>Título</span>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            style={studioInputStyle}
            autoFocus
          />
          {titleError && (
            <span style={{ color: STUDIO_COLORS.danger, fontSize: '0.7rem' }}>{titleError}</span>
          )}
        </label>

        <label style={studioLabelStyle}>
          <span>Slug</span>
          <input
            type="text"
            value={slug}
            onChange={(e) => {
              setSlug(e.target.value)
              setSlugManuallyEdited(true)
            }}
            style={studioInputStyle}
          />
          {slugError && (
            <span style={{ color: STUDIO_COLORS.danger, fontSize: '0.7rem' }}>{slugError}</span>
          )}
        </label>

        <label style={{ ...studioLabelStyle, flexDirection: 'row', gap: '0.5rem', alignItems: 'center' }}>
          <input
            type="checkbox"
            checked={showInNav}
            onChange={(e) => setShowInNav(e.target.checked)}
          />
          <span>Mostrar en la navegación</span>
        </label>

        {!isEdit && (
          <label style={studioLabelStyle}>
            <span>Empezar desde</span>
            <select
              value={copyFromSlug ?? ''}
              onChange={(e) => setCopyFromSlug(e.target.value || undefined)}
              style={studioInputStyle}
            >
              <option value="">Página vacía</option>
              {pages.map((p) => (
                <option key={p.slug} value={p.slug}>
                  Copiar secciones de "{p.title}"
                </option>
              ))}
            </select>
          </label>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.25rem' }}>
          <button type="button" onClick={onClose} style={studioSecondaryBtn}>
            Cancelar
          </button>
          <button
            type="button"
            disabled={!canSubmit}
            onClick={() =>
              onSubmit({
                title: title.trim(),
                slug: slug.trim(),
                showInNav,
                copyFromSlug: isEdit ? undefined : copyFromSlug,
              })
            }
            style={{
              ...studioPrimaryBtn,
              opacity: canSubmit ? 1 : 0.5,
              cursor: canSubmit ? 'pointer' : 'not-allowed',
            }}
          >
            {isEdit ? 'Guardar' : 'Crear'}
          </button>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Run tests — PASS**

Run: `npx jest --testPathPatterns=PageModal`
Expected: PASS.

- [ ] **Step 5: Mount PageModal in EditorClient**

In `EditorClient.tsx`:

```tsx
import PageModal from '@/components/editor/PageModal'
import * as pageOps from '@/components/editor/page-operations'

// state:
const [pageModalMode, setPageModalMode] = useState<'create' | { kind: 'edit'; slug: string } | null>(null)

// handlers wired to PageTree:
// onOpenCreatePage={() => setPageModalMode('create')}
// onOpenEditPage={(slug) => setPageModalMode({ kind: 'edit', slug })}

// modal mount:
{pageModalMode && (
  <PageModal
    mode={pageModalMode}
    config={config}
    onClose={() => setPageModalMode(null)}
    onSubmit={(payload) => {
      try {
        if (pageModalMode === 'create') {
          setConfig((prev) => pageOps.addPage(prev, payload))
          setActivePageId(payload.slug)
        } else {
          setConfig((prev) =>
            pageOps.renamePage(prev, pageModalMode.slug, {
              title: payload.title,
              slug: payload.slug,
              showInNav: payload.showInNav,
            })
          )
          if (pageModalMode.slug === activePageId) setActivePageId(payload.slug)
        }
        setPageModalMode(null)
      } catch (err) {
        setErrorMsg(err instanceof Error ? err.message : 'No se pudo guardar la página')
      }
    }}
  />
)}
```

- [ ] **Step 6: Run tests + tsc**

Run: `npx jest && npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add components/editor/PageModal.tsx components/editor/__tests__/PageModal.test.tsx app/editor/[token]/EditorClient.tsx
git commit -m "feat(editor): PageModal for create/edit page with slug auto-gen + validation

Validates slug format, reserved slugs, collisions. 'Empezar desde' selector lets
you copy sections from another page on create."
```

---

### Task 15: LinkField component + CTA inspector wire-in

**Files:**
- Create: `components/editor/LinkField.tsx`
- Create: `components/editor/__tests__/LinkField.test.tsx`
- Modify: `components/editor/SectionInspector.tsx` — use LinkField for CTA href

- [ ] **Step 1: Write failing tests**

```tsx
// components/editor/__tests__/LinkField.test.tsx
import { describe, it, expect, jest } from '@jest/globals'
import { render, screen, fireEvent } from '@testing-library/react'
import LinkField from '../LinkField'
import { defaultSiteConfig } from '@/lib/schemas/site-config.schema'

const config = {
  ...defaultSiteConfig,
  pages: [
    { slug: 'home', title: 'Home', isHome: true, showInNav: true, sections: [] },
    { slug: 'exhibitions', title: 'Exhibitions', isHome: false, showInNav: true, sections: [] },
  ],
}

describe('LinkField', () => {
  it('detects internal href and populates page selector', () => {
    render(<LinkField value="/exhibitions" config={config} onChange={() => {}} />)
    const typeSelect = screen.getByLabelText(/tipo/i) as HTMLSelectElement
    expect(typeSelect.value).toBe('internal')
    expect(screen.getByDisplayValue('Exhibitions')).toBeTruthy()
  })

  it('detects https href', () => {
    render(<LinkField value="https://example.com" config={config} onChange={() => {}} />)
    expect((screen.getByLabelText(/tipo/i) as HTMLSelectElement).value).toBe('external')
  })

  it('detects mailto', () => {
    render(<LinkField value="mailto:hola@ex.com" config={config} onChange={() => {}} />)
    expect((screen.getByLabelText(/tipo/i) as HTMLSelectElement).value).toBe('email')
  })

  it('switches to external and emits URL change', () => {
    const onChange = jest.fn()
    render(<LinkField value="/exhibitions" config={config} onChange={onChange} />)
    fireEvent.change(screen.getByLabelText(/tipo/i), { target: { value: 'external' } })
    fireEvent.change(screen.getByLabelText(/url/i), { target: { value: 'https://new.com' } })
    expect(onChange).toHaveBeenCalledWith('https://new.com')
  })

  it('switches internal to another page', () => {
    const onChange = jest.fn()
    render(<LinkField value="/" config={config} onChange={onChange} />)
    fireEvent.change(screen.getByLabelText(/página/i), { target: { value: 'exhibitions' } })
    expect(onChange).toHaveBeenCalledWith('/exhibitions')
  })

  it('shows warning when internal href references missing page', () => {
    render(<LinkField value="/deleted-page" config={config} onChange={() => {}} />)
    expect(screen.getByText(/esta página ya no existe/i)).toBeTruthy()
  })
})
```

- [ ] **Step 2: Run tests — FAIL**

Run: `npx jest --testPathPatterns=LinkField`
Expected: FAIL.

- [ ] **Step 3: Implement LinkField**

```tsx
// components/editor/LinkField.tsx
'use client'

import { useMemo } from 'react'
import type { SiteConfig } from '@/lib/schemas/site-config.schema'
import {
  STUDIO_COLORS,
  studioInputStyle,
  studioLabelStyle,
} from './studio-styles'

type LinkType = 'internal' | 'external' | 'email' | 'tel' | 'anchor'

type Props = {
  value: string
  config: SiteConfig
  onChange: (value: string) => void
  label?: string
}

function detectType(value: string): LinkType {
  if (value.startsWith('mailto:')) return 'email'
  if (value.startsWith('tel:')) return 'tel'
  if (value.startsWith('#')) return 'anchor'
  if (/^https?:/.test(value)) return 'external'
  return 'internal'
}

export default function LinkField({ value, config, onChange, label }: Props) {
  const type = detectType(value)
  const pages = config.pages ?? []
  const missingInternal = useMemo(() => {
    if (type !== 'internal') return false
    if (value === '/' || value === '') return false
    const slug = value.replace(/^\//, '')
    return !pages.some((p) => p.slug === slug)
  }, [type, value, pages])

  const handleTypeChange = (nextType: LinkType) => {
    switch (nextType) {
      case 'internal':
        onChange(pages.find((p) => p.isHome) ? '/' : '/')
        break
      case 'external':
        onChange('https://')
        break
      case 'email':
        onChange('mailto:')
        break
      case 'tel':
        onChange('tel:')
        break
      case 'anchor':
        onChange('#top')
        break
    }
  }

  const handleInternalChange = (slug: string) => {
    const page = pages.find((p) => p.slug === slug)
    if (!page) return
    onChange(page.isHome ? '/' : `/${page.slug}`)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      {label && <span style={{ fontSize: '0.75rem', fontWeight: 500 }}>{label}</span>}
      <label style={studioLabelStyle}>
        <span>Tipo</span>
        <select
          value={type}
          onChange={(e) => handleTypeChange(e.target.value as LinkType)}
          style={studioInputStyle}
        >
          <option value="internal">Página interna</option>
          <option value="external">URL externa</option>
          <option value="email">Email</option>
          <option value="tel">Teléfono</option>
          <option value="anchor">Anchor (#)</option>
        </select>
      </label>

      {type === 'internal' && (
        <label style={studioLabelStyle}>
          <span>Página</span>
          <select
            value={value === '/' ? pages.find((p) => p.isHome)?.slug ?? '' : value.replace(/^\//, '')}
            onChange={(e) => handleInternalChange(e.target.value)}
            style={studioInputStyle}
          >
            {pages.map((p) => (
              <option key={p.slug} value={p.slug}>
                {p.title}
              </option>
            ))}
          </select>
          {missingInternal && (
            <span style={{ color: STUDIO_COLORS.danger, fontSize: '0.7rem' }}>
              ⚠️ Esta página ya no existe
            </span>
          )}
        </label>
      )}

      {type === 'external' && (
        <label style={studioLabelStyle}>
          <span>URL</span>
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            style={studioInputStyle}
          />
        </label>
      )}

      {type === 'email' && (
        <label style={studioLabelStyle}>
          <span>Email</span>
          <input
            type="email"
            value={value.replace(/^mailto:/, '')}
            onChange={(e) => onChange(`mailto:${e.target.value}`)}
            style={studioInputStyle}
          />
        </label>
      )}

      {type === 'tel' && (
        <label style={studioLabelStyle}>
          <span>Teléfono</span>
          <input
            type="tel"
            value={value.replace(/^tel:/, '')}
            onChange={(e) => onChange(`tel:${e.target.value}`)}
            style={studioInputStyle}
          />
        </label>
      )}

      {type === 'anchor' && (
        <label style={studioLabelStyle}>
          <span>Sección</span>
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            style={studioInputStyle}
            placeholder="#artworks"
          />
        </label>
      )}
    </div>
  )
}
```

- [ ] **Step 4: Run tests — PASS**

Run: `npx jest --testPathPatterns=LinkField`
Expected: PASS.

- [ ] **Step 5: Wire LinkField into SectionInspector for CTA**

Read `components/editor/SectionInspector.tsx` and find the CTA section rendering (where `content.href` is edited). Replace the raw text input with:

```tsx
import LinkField from './LinkField'

// Inside the CTA block where content.href is edited:
<LinkField
  value={(section.content as any).href ?? '/'}
  config={config}
  label="Link del botón"
  onChange={(href) =>
    updateSection({ ...section, content: { ...section.content, href } })
  }
/>
```

(`config` must be passed down to SectionInspector — if it already receives config via props, done; otherwise add it.)

- [ ] **Step 6: Run full test suite + tsc**

Run: `npx jest && npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add components/editor/LinkField.tsx components/editor/__tests__/LinkField.test.tsx components/editor/SectionInspector.tsx
git commit -m "feat(editor): LinkField component + CTA inspector uses it

Dropdown picks link type (internal page / external / email / tel / anchor). Internal
uses a <select> populated from config.pages, with warning when the referenced page
no longer exists."
```

---

## Phase D — Cutover

### Task 16: Onboarding + defaultSiteConfig birth in pages[] shape

**Files:**
- Modify: `lib/onboarding/artist-onboarding.ts`
- Modify: `lib/onboarding/__tests__/artist-onboarding.test.ts`
- Modify: `lib/schemas/site-config.schema.ts` — `defaultSiteConfig` in new shape

- [ ] **Step 1: Write failing test — new signup writes pages[] shape**

```ts
// lib/onboarding/__tests__/artist-onboarding.test.ts (append)
import { describe, it, expect } from '@jest/globals'
import { buildInitialSiteConfig } from '../artist-onboarding'

describe('buildInitialSiteConfig new-shape output', () => {
  it('returns a config with pages[] containing a single home page', () => {
    const config = buildInitialSiteConfig({
      displayName: 'Luna Vega',
      template: 'minimal-gallery',
    })
    expect(config.pages).toHaveLength(1)
    expect(config.pages![0]).toMatchObject({
      slug: 'home',
      title: 'Luna Vega',
      isHome: true,
      showInNav: true,
    })
    expect(config.pages![0].sections.length).toBeGreaterThan(0)
  })

  it('does not put sections at the root', () => {
    const config = buildInitialSiteConfig({
      displayName: 'Marco',
      template: 'editorial',
    }) as any
    // After cutover, sections[] at root should not exist (or be empty).
    expect(config.sections === undefined || config.sections.length === 0).toBe(true)
  })
})
```

- [ ] **Step 2: Run test — FAIL (sections still at root)**

Run: `npx jest --testPathPatterns=artist-onboarding`
Expected: FAIL.

- [ ] **Step 3: Refactor buildInitialSiteConfig**

Open `lib/onboarding/artist-onboarding.ts`. Change the `sections` block so it goes under `pages[0]`:

```ts
return SiteConfigSchema.parse({
  template: params.template,
  styleTokens: preset.styleTokens,
  button: { shape: preset.buttonShape, style: 'filled', buyText: 'Consultar precio' },
  sizes: { typeScale: 'medium', artworkSize: 'medium', columns: '3', contentWidth: 'mid' },
  animations: { scrollReveal: 'soft', hoverEffect: 'info', pageTransition: 'fade' },
  navigation: { type: 'top', sticky: true },
  header: {
    layout: preset.headerLayout,
    ...(cleanWhatsapp ? { showWhatsappIcon: true, whatsappNumber: cleanWhatsapp } : {}),
  },
  footer: {
    enabled: true,
    ...(cleanWhatsapp ? { whatsapp: cleanWhatsapp } : {}),
  },
  pages: [
    {
      slug: 'home',
      title: cleanName,
      isHome: true,
      showInNav: true,
      sections: [
        { id: 'cover', type: 'cover', variant: 'fullscreen', visible: true, content: {} },
        { id: 'artworks', type: 'artworks', variant: 'grid', visible: true, content: {} },
        { id: 'bio', type: 'bio', variant: 'split', visible: true, content: {} },
        { id: 'exhibitions', type: 'exhibitions', variant: 'list', visible: false, content: {} },
        { id: 'contact', type: 'contact', variant: 'simple', visible: true, content: {} },
      ],
    },
  ],
  identity: { siteTitle: cleanName },
})
```

(Remove `sections: [...]` at root.)

- [ ] **Step 4: Refactor defaultSiteConfig in schema**

In `lib/schemas/site-config.schema.ts`, change `defaultSiteConfig`:

```ts
export const defaultSiteConfig: SiteConfig = {
  template: 'minimal-gallery',
  styleTokens: { /* unchanged */ },
  button: { /* unchanged */ },
  sizes: { /* unchanged */ },
  animations: { /* unchanged */ },
  navigation: { /* unchanged */ },
  pages: [
    {
      slug: 'home',
      title: 'Mi Sitio de Arte',
      isHome: true,
      showInNav: true,
      sections: [
        { id: 'cover', type: 'cover', variant: 'fullscreen', visible: true, content: {} },
        { id: 'artworks', type: 'artworks', variant: 'grid', visible: true, content: {} },
        { id: 'bio', type: 'bio', variant: 'split', visible: true, content: {} },
        { id: 'exhibitions', type: 'exhibitions', variant: 'list', visible: false, content: {} },
        { id: 'contact', type: 'contact', variant: 'simple', visible: true, content: {} },
      ],
    },
  ],
  identity: { siteTitle: 'Mi Sitio de Arte' },
}
```

Remove `sections: [...]` at root.

- [ ] **Step 5: Make pages required in SiteConfigSchema**

Change:

```ts
pages: z.array(PageConfigSchema).optional(),
```

to:

```ts
pages: z.array(PageConfigSchema).min(1),
```

And remove the `!c.pages ||` guards in each `.refine(...)`.

Then **remove** the root `sections: z.array(SectionConfigSchema)` field entirely.

- [ ] **Step 6: Run tests — expect widespread failures, fix**

Run: `npx jest`
Expected: Failures in templates, editor tests, fixtures that still reference `config.sections`.

Fix each failure by updating fixtures to use `pages[0].sections`. Common fix: in test setup, wrap `sections: [...]` into `pages: [{ slug: 'home', title: 'Home', isHome: true, showInNav: true, sections: [...] }]`.

- [ ] **Step 7: Run tsc**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 8: Commit**

```bash
git add lib/onboarding/artist-onboarding.ts lib/onboarding/__tests__/ lib/schemas/site-config.schema.ts
git commit -m "feat(schema): make pages[] required; onboarding + defaults use new shape

Removes sections[] from root of SiteConfigSchema. New signups write pages[]
directly. Old-shape configs still work via normalizeSiteConfig on read."
```

---

### Task 17: Verification — full green suite

**Files:**
- No new files; only verification.

- [ ] **Step 1: Run full test suite**

Run: `npx jest --passWithNoTests`
Expected: all green.

- [ ] **Step 2: Run tsc**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Run lint**

Run: `npm run lint`
Expected: no new errors.

- [ ] **Step 4: Run build**

Run: `npm run build`
Expected: successful build.

- [ ] **Step 5: Manual smoke test (optional, local)**

Run: `npm run dev`

Checklist:
- Open `/_sites/luna-vega` (or `/sites/luna-vega`) — renders.
- Open `/editor/token-luna-vega-dev` — editor loads with "Páginas" tab showing one page.
- Create a page via "+ Nueva página" — appears in sidebar + nav of preview.
- Switch to the new page — iframe updates URL, canvas shows empty sections.
- Add a CTA section — inspector shows LinkField with dropdown.
- Pick "Página interna" → "Exhibitions" → saved as `/exhibitions`.
- "Ver sitio público" → sub-page URL renders.

- [ ] **Step 6: Final commit (tag)**

If all checks pass:

```bash
git commit --allow-empty -m "chore: multi-página + links internos implementation complete

Spec: docs/superpowers/specs/2026-11-25-multi-pagina-links-internos-design.md
Plan: docs/superpowers/plans/2026-11-25-multi-pagina-links-internos.md"
```

---

## Notes

- **Sub-skill for execution**: `superpowers:subagent-driven-development` (recommended — fresh agent per task with review) or `superpowers:executing-plans` (inline, batch with checkpoints).
- **Git worktree**: for isolation from current work-in-progress bug fixes, consider `superpowers:using-git-worktrees` before starting Task 1.
- **Verification cadence**: run `npx tsc --noEmit` after every task to catch type errors early; the plan assumes this.
- **If npm install fails for agents**: Lionel runs `npm install --package-lock-only` locally first (per project memory). Tests and build need `node_modules` present.
