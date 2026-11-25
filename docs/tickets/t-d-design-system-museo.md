# Ticket T-D · design-system-museo

**Clasificación:** M (feature visual acotado)
**Run ID:** _pendiente — se asigna al crear el run_
**Rama de integración:** `squad/design-system-museo/integracion`
**Fecha de inicio:** 2026-11-24
**ETA inicial:** 19:30 Lima (100 min desde 17:30)

## Objetivo

Reemplazar el idioma visual actual de Quadro Sites por un sistema "museo-contemporáneo" (crema, serif display + sans minimal, obra protagonista) coherente en los 3 dialectos de plantilla, con CSS custom properties globales derivadas del config y backwards-compat del schema.

## Referencias de look & feel

- **Tono:** MoMA / Phaidon — fondos crema o blanco roto, sans minimal con serif de display, obra como protagonista absoluta. Profundo por rigor curatorial, amigable por silencio y respeto por la obra.
- **Paleta base propuesta** (confirmar en gate):
  - `background`: `#faf7f2` (crema cálido)
  - `text`: `#1a1a1a` (tinta profunda)
  - `accent`: `#c47a3a` (terroso cálido — ya es default actual)
  - `secondaryBg`: `#efe9e0` (blanco roto)
  - `border`: `#d9d1c3`
- **Tipografía por defecto:** `fraunces-nunito` (Fraunces display serif + Nunito sans) o `cormorant-jost` como alternativa. Confirmar en gate.
- **Dialectos:**
  - **minimal-gallery**: `spacing: spacious`, `columns: 3`, `artworkTreatment: margin`, nav superior fina, cover minimal.
  - **editorial**: `spacing: normal`, headlines tipográficamente grandes, `columns: 2`, `artworkTreatment: frame`, exhibitions con jerarquía tipo revista.
  - **immersive**: `spacing: normal`, `columns: 2` o `1`, `artworkTreatment: bleed`, header flotante, cover a toda pantalla.

## Scope (lo que entra en el ticket)

### Dentro del scope
- Nuevas CSS custom properties globales en `app/globals.css` (o inyectadas en layout a partir del config).
- Nueva paleta/tipografía por defecto en `defaultSiteConfig` (`lib/schemas/site-config.schema.ts`).
- Refactor de los 15 componentes de sección (`components/templates/*/sections/*.tsx`) para consumir las CSS vars.
- Refinamiento de `components/templates/*/index.tsx` y `components/templates/*/nav.tsx` para expresar cada dialecto.
- Migración de los 3 configs demo (`data/artists/{luna-vega,marco-torres,sofia-rios}/config.{draft,published}.json`) a la nueva paleta/tipografía, cada uno asociado a su dialecto.
- Playwright visual regression en `tests/e2e/visual/` con screenshot por `template × dialect`.
- Backwards-compat: configs existentes sin los nuevos campos siguen validando el schema.

### Fuera del scope (va a otros tickets)
- Nuevas secciones (T-B).
- Upload de imágenes en secciones nuevas (T-C).
- Contenido demo enriquecido más allá de la migración de tokens (T-A).
- AI copilot (T-E).
- Cambio de templates per se (siguen siendo 3).

## Tareas

### T1 · tokens-and-css-vars
- **Objetivo:** definir la paleta museo + fontPair default + inyectar CSS custom properties globales.
- **Archivos que puede tocar (lista cerrada):**
  - `app/globals.css`
  - `app/layout.tsx` (solo agregar `<style>` o `data-theme` derivado del config si aplica globalmente, o nuevo componente auxiliar)
  - `lib/tokens/museum-palette.ts` (nuevo)
  - `lib/tokens/css-vars.ts` (nuevo, helper que convierte styleTokens → CSS var map)
  - `lib/schemas/site-config.schema.ts` (**solo** `defaultSiteConfig`, para actualizar paleta/fontPair default — no cambiar el shape del schema)
- **Contrato:** expone `cssVarMap(config: SiteConfig): Record<string, string>` desde `lib/tokens/css-vars.ts` para que T2 lo consuma vía inline style o wrapper. Las CSS vars documentadas: `--qs-bg, --qs-text, --qs-accent, --qs-secondary-bg, --qs-border, --qs-font-heading, --qs-font-body, --qs-space-{xs,sm,md,lg,xl}, --qs-radius-{sm,md,lg}`.
- **Criterios de éxito (ejecutables):**
  - `npx tsc --noEmit` → 0 errores.
  - `npm run lint` → 0 warnings nuevos.
  - `npm run build` → OK.
  - En `localhost:3000/sites/luna-vega` el DOM tiene `--qs-bg: #faf7f2` en el elemento raíz del sitio (verificable con `document.querySelector('[data-qs-site]').style.getPropertyValue('--qs-bg')` o inspector).
- **Rama:** `squad/design-system-museo/t1-tokens`
- **Modelo:** Claude Code (perfil activo, sin --model porque los slugs `5-5-medium` no están disponibles en el CLI)
- **Worktree:** `design-system-museo-t1`

### T2 · section-components-refactor
- **Objetivo:** refactorizar los 15 componentes de sección para consumir CSS vars en lugar de hardcodear colores/tipografías.
- **Archivos que puede tocar (lista cerrada):**
  - `components/templates/minimal-gallery/sections/*.tsx` (5 archivos)
  - `components/templates/editorial/sections/*.tsx` (5)
  - `components/templates/immersive/sections/*.tsx` (5)
  - `components/templates/shared/SectionSurface.tsx` (si aplica para centralizar el consumo de vars)
- **Contrato:** cada sección renderiza respetando `color-scheme: 'default'|'dark'|'accent'|'soft'` del `SectionStyleSchema` ya existente, usando las CSS vars de T1.
- **Depende de:** T1 (`lib/tokens/css-vars.ts` y vars en globals.css).
- **Criterios de éxito:**
  - tsc + lint + build verdes.
  - `/sites/luna-vega|marco-torres|sofia-rios` renderizan sin errores de hidratación (verificable en consola del browser).
  - Tests unit existentes de secciones (en `__tests__/`) siguen pasando.
- **Rama:** `squad/design-system-museo/t2-sections`
- **Modelo:** Claude Code (perfil activo, sin --model)
- **Worktree:** `design-system-museo-t2`

### T3 · dialect-distinctiveness
- **Objetivo:** refinar `index.tsx` y `nav.tsx` de cada template para que cada dialecto exprese su énfasis (spacing, tipografía, grilla).
- **Archivos que puede tocar (lista cerrada):**
  - `components/templates/minimal-gallery/{index.tsx,nav.tsx}`
  - `components/templates/editorial/{index.tsx,nav.tsx}`
  - `components/templates/immersive/{index.tsx,nav.tsx}`
- **Contrato:** ningún cambio en secciones hijas; solo wrappers y navegación. No toca CSS vars (T1) ni sections (T2).
- **Criterios de éxito:**
  - tsc + lint + build verdes.
  - Los 3 dialectos son visualmente distinguibles en el screenshot comparativo (parte de T5).
  - Tests existentes pasan.
- **Rama:** `squad/design-system-museo/t3-dialects`
- **Modelo:** Claude Code (perfil activo, sin --model)
- **Worktree:** `design-system-museo-t3`

### T4 · demo-configs-migration
- **Objetivo:** actualizar los 6 configs demo (3 artistas × draft+published) a la paleta/tipografía museo, uno por dialecto.
- **Archivos que puede tocar (lista cerrada):**
  - `data/artists/luna-vega/config.published.json` + `config.draft.json`
  - `data/artists/marco-torres/config.published.json` + `config.draft.json`
  - `data/artists/sofia-rios/config.published.json` + `config.draft.json`
- **Contrato:**
  - luna-vega → `template: minimal-gallery`, `spacing: spacious`, `columns: 3`.
  - marco-torres → `template: editorial`, `spacing: normal`, `columns: 2`, `artworkTreatment: frame`.
  - sofia-rios → `template: immersive`, `spacing: normal`, `columns: 2`, `artworkTreatment: bleed`.
  - Todos comparten paleta base museo (`background #faf7f2`, `text #1a1a1a`) pero pueden diferenciarse en `accent`.
- **Criterios de éxito:**
  - `npm test -- --testPathPattern site-config` pasa (los tests de schema validan los configs).
  - `/sites/<slug>` renderiza para los 3 artistas sin errores de validación.
- **Rama:** `squad/design-system-museo/t4-configs`
- **Modelo:** Claude Code (perfil activo, sin --model)
- **Worktree:** `design-system-museo-t4`

### T5 · playwright-visual-regression
- **Objetivo:** agregar visual regression en Playwright que capture screenshots por `template × dialect` con umbral de diff razonable.
- **Archivos que puede tocar (lista cerrada):**
  - `tests/e2e/visual/museum-dialects.spec.ts` (nuevo)
  - `playwright.config.ts` (solo si requiere ajustar proyectos o output dir)
  - `tests/e2e/visual/__snapshots__/` (nuevo directorio, baseline screenshots generados por Playwright)
- **Contrato:** 3 tests (uno por artista), cada uno abre `/sites/<slug>` y hace `expect(page).toHaveScreenshot()`. Umbral: `maxDiffPixelRatio: 0.02`.
- **Depende de:** T2, T3, T4 (necesita el nuevo look renderizado).
- **Criterios de éxito:**
  - `npx playwright test tests/e2e/visual/` pasa.
  - 3 archivos de baseline generados en `__snapshots__/`.
- **Rama:** `squad/design-system-museo/t5-visual-regression`
- **Modelo:** Claude Code (perfil activo, sin --model)
- **Worktree:** `design-system-museo-t5`

## Dependencias y paralelismo

```
T1 ──> T2 ─┐
       T3 ─┤
T4 ───────┼──> integración ──> T5 ──> verificación final
          │
      (paralelo T2,T3,T4)
```

- T1 primero (define CSS vars).
- T2, T3, T4 en paralelo (archivos disjuntos).
- Integración junta los 4.
- T5 se corre contra la rama de integración (necesita el look final).
- Verificación final (M → sí): una vez al final.

## Verificación final

- **Modelo:** Claude Code · `claude-sonnet-5-5-high` (distinto en effort a los ejecutores, cumple "distinto modelo" del Art. 5.5).
- **Criterios ejecutables** sobre `squad/design-system-museo/integracion`:
  - Tests: `npm test -- --passWithNoTests` → OK.
  - Lint: `npm run lint` → OK.
  - Tipos: `npx tsc --noEmit` → OK.
  - Build: `npm run build` → OK.
  - Visual regression: `npx playwright test tests/e2e/visual/` → OK.
  - Backwards compat: un config legacy (ej. snapshot del `config.published.json` anterior al ticket) sigue validando con `SiteConfigSchema.safeParse()` → `success: true`.

## ETA

- T1: 25 min
- T2+T3+T4 paralelo: 30 min (el más largo probablemente T2)
- Integración: 10 min
- T5 (sobre integración): 20 min
- Verificación final: 15 min
- **Total:** ~100 min desde 17:30 → **19:10 Lima** (margen hasta 19:30 por posibles iteraciones de boceto).
