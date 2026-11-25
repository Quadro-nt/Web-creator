# Multi-página + links internos — Diseño

**Fecha:** 2026-11-25
**Scope:** habilitar que un sitio tenga N páginas (no sólo la landing) con nav automática, links internos y migración on-read desde el shape viejo.
**Estado:** aprobado para ejecución tras brainstorming con Lionel.

## Contexto

Quadro Sites hoy renderiza un único "sitio = landing única" por artista. `SiteConfig.sections[]` es un array plano que vive al root del config. `/sites/[artist]/page.tsx` sirve esa única página. Referencia que queremos replicar: `alessandrarisicastoldi.com` tiene URLs independientes `/exhibitions`, `/works`, `/bio`, `/contact`, con nav propia y layouts diferenciados por página.

Este spec es el primero de 4 descompuestos del bundle original "#1 dashboard multi-sitio + #3 editor de secciones/multi-página/carrusel". Los otros 3: multi-sitio (A), editor de estilo granular (C), sección carrusel (D) — van por specs separados.

## Objetivos

1. Un artista crea N páginas con slugs arbitrarios (`[a-z0-9-]+`) y las edita en un único editor.
2. La nav se auto-arma desde las páginas visibles del sitio en el orden definido por el artista.
3. Links en secciones (CTA, header, etc.) pueden apuntar a páginas internas, URLs externas, anchors, email, WhatsApp.
4. Sitios existentes (seeds y usuarios ya creados) siguen funcionando sin intervención manual — migración on-read.
5. El editor permite CRUD completo de páginas (crear, renombrar, duplicar, borrar, reordenar, marcar como home, toggle `showInNav`).

## Decisiones transversales

- **Herencia**: chrome compartido entre páginas. Template, styleTokens, header, footer, button, sizes, animations, identity son del sitio. Sólo `sections[]` es propio de cada página.
- **Home designation**: flag explícito `isHome: true` en una única página por sitio (invariante del schema).
- **Backwards compatible**: configs viejos con `sections[]` al root se normalizan on-read; no hay migración de DB.
- **Sin feature flags**: mergea a main y la feature queda disponible en `/sites/<slug>` y `/studio`.
- **Testing baseline**: `npm test`, `npm run lint`, `npx tsc --noEmit`, `npm run build` verdes.

## 1 · Modelo de datos

Cambio en `lib/schemas/site-config.schema.ts`:

```ts
const PageConfigSchema = z.object({
  slug: z.string().min(1).max(60).regex(/^[a-z0-9-]+$/),
  title: z.string().min(1).max(80),
  isHome: z.boolean(),
  showInNav: z.boolean(),
  navLabel: z.string().max(40).optional(),
  sections: z.array(SectionConfigSchema),
  seo: z.object({
    title: z.string().max(80).optional(),
    description: z.string().max(200).optional(),
    ogImageUrl: mediaUrlSchema.optional(),
  }).optional(),
})

export const SiteConfigSchema = z.object({
  template: z.enum([...]),
  styleTokens: {...},
  button: {...},
  sizes: {...},
  animations: {...},
  navigation: {...},
  announcementBar: AnnouncementBarSchema.optional(),
  header: HeaderConfigSchema.optional(),
  footer: FooterConfigSchema.optional(),
  identity: {...},
  pages: z.array(PageConfigSchema).min(1),
})
  .refine(c => c.pages.filter(p => p.isHome).length === 1,
    'Debe existir exactamente una página marcada como home')
  .refine(c => new Set(c.pages.map(p => p.slug)).size === c.pages.length,
    'Los slugs de página deben ser únicos')
  .refine(c => c.pages.every(p => !RESERVED_PAGE_SLUGS.has(p.slug)),
    'El slug está reservado')
```

**Invariantes del schema:**
- Mínimo 1 página.
- Exactamente 1 con `isHome: true`.
- Slugs únicos dentro del sitio.
- Slug no es reservado (`obras`, y cualquier otro segmento top-level futuro).
- Slug formato `[a-z0-9-]+` (igual que artist slug).

**Removido del root**: `sections: SectionConfigSchema[]` (se mueve a `pages[].sections`).

**Mantenido en root** (chrome compartido): `template`, `styleTokens`, `button`, `sizes`, `animations`, `navigation`, `announcementBar`, `header`, `footer`, `identity`.

**`header.customLinks`**: deprecado. Se mantiene como opcional en el schema por compat retroactiva; el editor no lo expone en UI nueva. En render se ignora si hay `pages[].showInNav` (la nav auto es la única fuente de verdad).

Nuevo archivo `lib/schemas/reserved-page-slugs.ts`:

```ts
export const RESERVED_PAGE_SLUGS = new Set<string>([
  'obras',
])
```

## 2 · Routing + rendering

Rutas en `app/sites/[artist]/`:

```
app/sites/[artist]/
├── page.tsx                 ← home: pages.find(p => p.isHome)
├── [page]/page.tsx          ← NUEVO: pages.find(p => p.slug === params.page && !p.isHome)
├── obras/[slug]/page.tsx    ← UNTOUCHED (artwork detail)
├── error.tsx                ← ya agregado en fix bugs
└── not-found.tsx            ← ya existe
```

Precedencia de Next.js: segmentos estáticos (`obras/`) ganan sobre dinámicos (`[page]/`). No hay colisión.

**Render en `[page]/page.tsx`:**

```ts
export default async function ArtistSubPage({ params }: Props) {
  const config = await safeGetPublished(params.artist)
  if (!config) notFound()

  const page = config.pages.find(p => p.slug === params.page && !p.isHome)
  if (!page) notFound()

  const works = await safeGetWorks(params.artist)
  return renderTemplate({ config, page, works, artistSlug: params.artist })
}
```

**Render en `page.tsx` (home):**

```ts
export default async function ArtistSitePage({ params }: Props) {
  const config = await safeGetPublished(params.artist)
  if (!config) notFound()

  const home = config.pages.find(p => p.isHome)
  if (!home) notFound()  // invariante del schema, defensive

  const works = await safeGetWorks(params.artist)
  return renderTemplate({ config, page: home, works, artistSlug: params.artist })
}
```

**`renderTemplate({ config, page, works, artistSlug })`** — helper nuevo en `components/templates/index.ts` que despacha al template elegido (`minimal-gallery` | `editorial` | `immersive`). Los templates se refactorizan para recibir `{ config, page, works, artistSlug }` y renderizar `page.sections` (hoy renderizan `config.sections`).

**`generateMetadata` cascada:**
- Home: `page.seo?.title ?? config.identity.siteTitle`.
- Sub-página: `page.seo?.title ?? page.title ?? config.identity.siteTitle`.
- Description/og idem con fallback a config.

**Auto-nav en `SiteHeader`** (`components/templates/shared/SiteHeader.tsx`):

```ts
const navItems = config.pages
  .filter(p => p.showInNav)
  .map(p => ({
    href: p.isHome ? `/sites/${artistSlug}` : `/sites/${artistSlug}/${p.slug}`,
    label: p.navLabel ?? p.title,
  }))
```

## 3 · UX del editor

Refactor del panel izquierdo del editor (`app/editor/[token]/EditorClient.tsx`):

El tab "Capas" se convierte en **"Páginas"** — árbol con pages → sections:

```
┌──────────────────────┐
│ PÁGINAS         + │ │
├──────────────────────┤
│ ▾ ● Home         ⋯  │
│   · Cover            │
│   · Artworks         │
│   · Bio              │
├──────────────────────┤
│ ▸   Exhibitions  ⋯  │
├──────────────────────┤
│ ▸   Serie 2024   ⋯  │
└──────────────────────┘
```

**CRUD de página:**
- **Crear**: botón `+` → modal pequeño con `title` (required), `slug` (auto desde title, editable con validación en vivo), `showInNav` (default true), preset ("vacía" o "copiar de otra página" con dropdown para elegir cuál).
- **Renombrar / editar slug**: `⋯` → "Editar página" → mismo modal.
- **Set as home**: `⋯` → "Marcar como home" (destrona a la actual atomicamente).
- **Duplicar**: `⋯` → copia con slug sufijo `-copy` único.
- **Borrar**: `⋯` → confirm; bloqueado si `isHome: true` (tooltip: "Marcá otra como home primero").
- **Reordenar páginas**: drag con dnd-kit (ya en el proyecto). Afecta orden de la nav auto.
- **Reordenar secciones dentro de página**: igual que hoy.

**Canvas y preview:**
- Pill arriba del canvas: `Editando: Home ▾` — dropdown rápido para cambiar página activa.
- URL del preview iframe se actualiza: `/sites/<slug>` para home, `/sites/<slug>/<pageSlug>` para otras.

**Estado del editor:**
- Nuevo state `activePageId: string` (default: la home).
- `SectionList`, `ModuleLibrary`, `AIRequestPanel` existentes operan sobre `page.sections` de la página activa.

**Fuera de scope en este spec (YAGNI):**
- Mover secciones de una página a otra (cut/paste entre páginas). Sumable después.
- Presets de página complejos ("plantilla exhibitions" con secciones pre-pobladas). Sólo "vacía" o "copia de otra página".
- Reordenamiento de nav independiente del orden de pages[]. El orden de pages[] = orden de nav.

## 4 · Links internos

**Formato `href` — regla:**
- `/` o `/<pageSlug>` → ruta interna.
- `http://` / `https://` / `mailto:` / `tel:` → URL externa.
- `#...` → anchor dentro de la página actual.

Schema:

```ts
// lib/schemas/href-schema.ts
const INTERNAL_RE = /^\/[a-z0-9-]*$/
const EXTERNAL_RE = /^(https?|mailto|tel):/
const ANCHOR_RE = /^#[a-zA-Z0-9-_]+$/

export function validateHref(value: string): boolean {
  if (DANGEROUS_SCHEME_RE.test(value)) return false  // bloquea javascript:, data:, vbscript:
  return INTERNAL_RE.test(value) || EXTERNAL_RE.test(value) || ANCHOR_RE.test(value)
}

export const hrefSchema = z.string().refine(validateHref, 'Link inválido')
```

La validación de "existe la página" NO se hace en schema (cambia con el estado del sitio; borrar una página no debe invalidar el save). Se hace en el editor con warning ⚠️ "Esta página ya no existe".

**Componente nuevo `<LinkField>`** (`components/editor/LinkField.tsx`):

Dropdown + input dinámico:
```
Tipo: [Página interna ▾]  Página: [Exhibitions ▾]
      [URL externa    ▾]  URL:    [https://...]
      [Anchor         ▾]  Sección: [#artworks]
      [Email          ▾]  Email:  [hola@...]
      [WhatsApp       ▾]  Núm:    [+549...]
```

Guarda como `href` string resuelto: interna → `/<pageSlug>` o `/`, externa → URL, email → `mailto:`, WhatsApp → `https://wa.me/`.

**Dónde se usa `<LinkField>`:**
- Sección `cta` — inspector del CTA.
- `header.customLinks` si lo re-exponemos (fuera de este spec).
- Futuras secciones con botón (feature-split, etc.).

**Resolución en runtime — `resolveSiteHref(href, artistSlug)`** (nuevo helper `lib/templates/resolve-href.ts`):
- Si `href` empieza con `/` y no es externa → prepende `/sites/<artistSlug>` → devuelve URL absoluta del sitio del artista.
- Si es externa/anchor/mailto/tel → devuelve tal cual.
- Usado por un componente `<SafeLink>` que agrega `target="_blank" rel="noopener noreferrer"` para externas.

**Warnings en editor:**
- Si una página referenciada por un `href` interno ya no existe, el inspector marca ese link con ⚠️ "Esta página ya no existe" pero no bloquea save.

## 5 · Migración y compat retroactiva

**Enfoque: normalización on-read, no migración de DB.**

Función nueva `normalizeSiteConfig(raw: unknown): unknown` en `lib/schemas/site-config.schema.ts`:

```ts
export function normalizeSiteConfig(raw: any): any {
  if (!raw || typeof raw !== 'object') return raw

  // Ya es shape nuevo → passthrough
  if (Array.isArray(raw.pages)) return raw

  // Shape viejo: envolver sections[] en pages:[home]
  const { sections = [], ...rest } = raw
  return {
    ...rest,
    pages: [
      {
        slug: 'home',
        title: raw?.identity?.siteTitle ?? 'Inicio',
        isHome: true,
        showInNav: true,
        sections,
      },
    ],
  }
}
```

Se ejecuta antes de `SiteConfigSchema.parse(...)` en:
- `lib/storage/file-adapter.ts` (en `readJsonFile`).
- `lib/storage/supabase-adapter.ts` (en `readConfigColumn`).

El primer `saveDraft`/`publish` de un sitio migrado persiste el nuevo shape; sites editados se actualizan solos. Sites no editados conservan shape viejo en DB para siempre — aceptable.

**`buildInitialSiteConfig`** (`lib/onboarding/artist-onboarding.ts`):
- Las 5 sections que hoy mete al root (`cover`, `artworks`, `bio`, `exhibitions`, `contact`) se mueven a `pages[0].sections`.
- `pages[0] = { slug: 'home', title: cleanName, isHome: true, showInNav: true, sections: <las 5 actuales> }`.
- Nuevos signups escriben directo el shape nuevo.

**`defaultSiteConfig`** — refactor para nacer en shape nuevo con 1 page `home`.

## 6 · Testing

**Unidad (Jest + RTL):**

Schema (`lib/schemas/__tests__/site-config.schema.test.ts`):
- `PageConfigSchema` acepta forma válida, rechaza slug con mayúsculas, slug vacío, title vacío.
- `SiteConfigSchema` rechaza: 0 pages, 2 pages con `isHome: true`, slugs duplicados, slug reservado (`obras`).
- `defaultSiteConfig` parsea sin errores (con 1 page default `home`).

Normalización (`lib/schemas/__tests__/normalize-site-config.test.ts` nuevo):
- Shape nuevo → passthrough.
- Shape viejo (sections al root) → envuelve en pages[0] con `isHome: true`.
- Shape viejo sin siteTitle → title default `'Inicio'`.
- Shape viejo con `header.customLinks` → mantiene customLinks pero crea `pages`.
- Config null/undefined/invalid → devuelve tal cual (el parser decide).

Storage adapters:
- File: `saveDraft` + `getDraft` round-trip con shape nuevo.
- File: `.draft.json` escrito con shape viejo → `getDraft` devuelve shape nuevo.
- Supabase: idem con mocks.

Onboarding (`lib/onboarding/__tests__/artist-onboarding.test.ts`):
- `buildInitialSiteConfig` devuelve `{ pages: [{ slug: 'home', isHome: true, sections: [...] }] }`.
- `createArtistSiteForUser` cloud insert con la forma nueva.

Links (`lib/schemas/__tests__/href-schema.test.ts` nuevo):
- Acepta `/`, `/exhibitions`, `https://x`, `mailto:a@b`, `tel:+54`, `#anchor`.
- Rechaza `javascript:`, `data:`, strings vacíos.

Editor (`components/editor/__tests__/useConfigHistory.test.tsx`):
- `addPage({ slug, title })` devuelve config con la nueva page.
- `deletePage(slug)` — rechaza si es home, elimina si no.
- `setHomePage(slug)` — mueve `isHome: true` a la nueva, false a la anterior.
- `movePage(fromIdx, toIdx)` reordena.
- `duplicatePage(slug)` crea copia con `-copy` sufijo y slug único.
- Historial undo/redo funciona sobre operaciones de página.

Rendering (`app/sites/[artist]/__tests__/`):
- `page.tsx` home: devuelve page con `isHome: true`.
- `[page]/page.tsx`: renderiza page encontrada por slug.
- `[page]/page.tsx`: `notFound()` si slug no existe.
- `[page]/page.tsx`: `notFound()` si el slug encontrado es `isHome: true`.
- `generateMetadata` cascada: sub-página usa `page.seo?.title ?? page.title ?? config.identity.siteTitle`.

**Integración (Jest + RTL con templates reales):**
- `MinimalGallery` recibe `{ page, config, works, artistSlug }` y renderiza `page.sections`.
- `SiteHeader` auto-nav: lista pages `showInNav: true`, resuelve href correcto (home vs sub-page).
- `SiteHeader` oculta pages `showInNav: false`.

**E2E (Playwright, en ticket aparte si CI lo requiere):**
- Artista seed existente (Luna Vega) sigue renderizando `/sites/luna-vega` igual (regresión).
- Signup nuevo → `/studio` → crear página "exhibitions" → aparece en sidebar → aparece en nav del preview → `/sites/<slug>/exhibitions` renderiza.
- Editor: borrar la home bloqueado.
- Editor: cambiar isHome destrona la anterior.
- Preview iframe: cambiar página activa en sidebar actualiza URL del iframe.

**Tests que se modifican (regresión):**
- `app/__tests__/home-page.test.tsx` — verificar que `/sites/luna-vega` sigue siendo link válido.
- Tests existentes de `useConfigHistory` que operan sobre `config.sections` ahora operan sobre `config.pages[0].sections`.
- Tests de templates que esperan `config.sections` → actualizar fixtures.

## Riesgos y mitigaciones

- **Riesgo**: templates existentes consumen `config.sections` en múltiples lugares. **Mitigación**: refactor de contrato `{ config, page, works, artistSlug }` es puntual; cubierto por tests de integración por template.
- **Riesgo**: sites en DB con config_published en shape viejo + bug en normalización = 500. **Mitigación**: ya tenemos `safeGetPublished` con try/catch (del fix bugs anterior). El worst case es 404, no 500. Tests unitarios cubren normalización de shape viejo.
- **Riesgo**: `header.customLinks` en configs viejos genera doble nav. **Mitigación**: en render, auto-nav es única fuente; `customLinks` se ignora si pages[] existe.
- **Riesgo**: slugs reservados colisionan con rutas futuras. **Mitigación**: lista centralizada en `reserved-page-slugs.ts`; agregar entradas antes de crear rutas nuevas en `app/sites/[artist]/`.

## Fuera de scope (otros specs)

- **A. Multi-sitio** — 1 usuario → N artistas. Spec propio: toca schema, auth, Studio shell.
- **C. Editor de estilo granular por sección** — colores custom, tipografía por sección, overrides. Spec propio.
- **D. Sección carrusel** — nuevo `type: 'carousel'`. Spec propio.
- **E. Re-exposición de "extra nav links"** (Instagram, newsletter externa) — si/cuando pida.
