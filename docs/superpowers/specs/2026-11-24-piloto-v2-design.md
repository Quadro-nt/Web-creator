# Quadro Sites v2 — Diseño integral (museo + estructura + uploads + demo + copilot)

**Fecha:** 2026-11-24
**Scope:** 5 tickets secuenciales que llevan el piloto desde "funcional" a "producto demostrable".
**Estado:** aprobado para ejecución. El spec vive; los tickets individuales se refinan al lanzar `/squad`.

## Contexto

Quadro Sites hoy renderiza 3 plantillas (`minimal-gallery`, `editorial`, `immersive`), todas con las mismas 5 secciones (`cover`, `artworks`, `bio`, `exhibitions`, `contact`). El schema declara 18 tipos de sección pero solo esos 5 tienen renderer. El look and feel se parametriza vía `styleTokens` del config; `app/globals.css` es Tailwind puro sin CSS variables globales. Los 3 artistas demo usan `picsum.photos` como placeholder. La IA en el editor es reactiva (usuario pide, IA responde).

## Objetivos

1. **Rediseñar el idioma visual** hacia "museo-contemporáneo" (crema, sans + serif display, obra protagonista).
2. **Ampliar la estructura disponible** con 6 secciones nuevas y 2 variantes extra por sección existente.
3. **Permitir upload de imágenes en cualquier sección**, con galería inline donde aplique.
4. **Poblar contenido demo realista** en los 3 artistas.
5. **Introducir un AI copilot proactivo** que sugiere alternativas tras cambios significativos.

## Decisiones transversales

- **Backwards compatible:** `SiteConfigSchema` se extiende, nunca se reemplaza. Todos los configs existentes siguen validando.
- **Testing baseline:** cada ticket cierra con `npm test`, `npm run lint`, `npx tsc --noEmit` y `npm run build` verdes. Los 3 primeros tickets agregan screenshots de Playwright como visual regression.
- **Performance:** el bundle final no crece más de ~15% respecto al baseline pre-v2 (`npm run build` imprime size).
- **Sin feature flags:** cada ticket mergea a `main` y la feature queda disponible en `/sites/<slug>`.
- **Media attribution:** cualquier imagen demo con licencia atribuible se registra en `data/attributions.json` (nuevo archivo).

## Secuencia de tickets

```
T-D (design-system-museo) → T-B (nuevas-secciones) → T-C (uploads-universales) → T-A (demo-content-enriquecido) → T-E (ai-copilot)
```

Razón del orden: T-D establece el idioma visual que T-B consume. T-B habilita los contenedores que T-C llena de imágenes y T-A puebla con contenido. T-E sugiere entre las alternativas que los 4 tickets anteriores construyeron.

---

## T-D · design-system-museo

**Objetivo:** reemplazar el idioma visual actual por un sistema "museo-contemporáneo" coherente en los 3 dialectos de plantilla.

### Scope

- **Paleta base** (nuevos defaults en `defaultSiteConfig` y en `data/artists/*/config.*.json`):
  - `background`: crema (`#faf7f2` o similar), `text`: tinta oscura (`#1a1a1a`), `accent`: terroso cálido por defecto (`#c47a3a` ya aplica), `secondaryBg`: blanco roto.
- **Tipografía:**
  - Pair por defecto: `cormorant-jost` o `fraunces-nunito` (serif display + sans minimal). Confirmar ratio y tracking al implementar.
  - `uppercaseHeadings=false`, `headingTracking=normal` como defaults.
- **Dialectos:**
  - `minimal-gallery`: espaciado "spacious", columnas 3, obra con margin, nav superior fina.
  - `editorial`: espaciado "normal", jerarquía tipográfica con headlines grandes, columnas 2, obra con frame.
  - `immersive`: espaciado "normal", columnas 2 o 1, obra con bleed, header flotante, posible fondo oscuro selectivo.
- **CSS global:** `app/globals.css` agrega CSS custom properties derivadas del config en runtime (via `data-*` en `<html>` o `<style>` injectado por layout). Lista mínima:
  - `--qs-bg`, `--qs-text`, `--qs-accent`, `--qs-secondary-bg`, `--qs-border`.
  - `--qs-font-heading`, `--qs-font-body`.
  - `--qs-space-xs|sm|md|lg|xl`, `--qs-radius-sm|md|lg`.
- **Componentes afectados:** todos los `components/templates/*/sections/*.tsx` pasan a leer de las CSS vars en vez de hardcodear tokens.
- **Migración de configs:** `data/artists/luna-vega|marco-torres|sofia-rios/config.published.json` se actualizan a la nueva paleta/tipografía museo, uno por dialecto.
- **Visual regression:** Playwright captura screenshot por `template × dialect` en `tests/e2e/visual/` con umbral de diff razonable.

### Acceptance criteria

- `npm test`, lint, tsc, build verdes.
- `/sites/luna-vega`, `/sites/marco-torres`, `/sites/sofia-rios` renderizan con la nueva paleta.
- Los 3 dialectos son visualmente distintos pero claramente de la misma marca.
- Tokens viejos siguen funcionando (configs en memoria no quiebran).

---

## T-B · nuevas-secciones

**Objetivo:** implementar 6 secciones nuevas y 2 variantes extra por sección existente, en los 3 dialectos.

### Scope

- **Secciones nuevas** (los 6 tipos ya declarados en `SECTION_TYPES`):
  - `gallery` — galería suelta de imágenes con título. Variantes: `grid`, `masonry`, `carousel`.
  - `statement` — texto curatorial largo opcional + comilla + atribución. Variantes: `narrow`, `fullwidth`.
  - `featured-work` — una obra destacada en grande con metadata completa. Variantes: `left-image`, `right-image`, `background`.
  - `press` — lista de prensa con logo o cover + cita + link. Variantes: `logos`, `cards`.
  - `cta` — bloque de llamada a acción (ej. "Agendá una visita", "Suscribite al boletín"). Variantes: `banner`, `stacked`.
  - `video` — un video embebido (YouTube/Vimeo) con poster opcional. Variantes: `inline`, `fullwidth`.
- **Variantes extra** de secciones existentes (2 por c/u, total 10):
  - `cover`: + `split` (texto izquierda, imagen derecha) y + `typography-only`.
  - `artworks`: + `masonry` y + `editorial-list`.
  - `bio`: + `with-portrait` y + `pull-quote`.
  - `exhibitions`: + `timeline` y + `cards`.
  - `contact`: + `with-map-illustration` y + `form-compact` (sin backend — solo UI).
- **Schema:** cada sección nueva define un sub-schema de `content` en `lib/schemas/site-config.schema.ts` y lo valida en `SectionConfigSchema` (patch: `content: z.discriminatedUnion('type', [...])` o similar). Mantener compatibilidad con secciones legacy que usen `z.record(z.unknown())`.
- **Editor:** `ModuleLibrary.tsx` lista las 6 nuevas; `SectionInspector.tsx` expone el UI de edición por tipo. Variantes seleccionables desde el panel.
- **Renderers:** 6 secciones × 3 dialectos = 18 componentes en `components/templates/<dialect>/sections/<section>.tsx`.
- **Default sections:** `defaultSiteConfig.sections` no cambia (seguimos con las 5 existentes visibles por default); el artista agrega las nuevas desde el editor.

### Acceptance criteria

- 6 renderers nuevos × 3 dialectos renderizan sin warnings.
- Las 10 variantes extra funcionan en los 3 dialectos.
- `SectionInspector` permite crear, editar y previsualizar cada sección nueva.
- Unit tests cubren el schema extendido y el flujo de agregar sección en el editor.

---

## T-C · uploads-universales

**Objetivo:** permitir que cualquier sección tenga imagen opcional + galería inline donde aplique.

### Scope

- **Schema:**
  - Todas las secciones aceptan `content.image?: mediaUrlSchema` (imagen principal opcional).
  - Secciones multi-imagen (`gallery`, `press`, `featured-work`) usan `content.images: mediaUrlSchema[]` o estructura equivalente.
  - `bio`, `exhibitions`, `contact` ganan `image?` en su sub-schema.
- **Editor:**
  - `SectionInspector` expone un slot "Imagen" por sección que abre `MediaPickerModal.tsx`.
  - `MediaLibrary.tsx` se reutiliza sin cambios estructurales; aparece desde más contextos.
  - Para secciones multi-imagen, interfaz de lista reordenable (drag & drop simple).
- **Renderers:** los componentes de sección (nuevos y existentes) consumen `content.image` si está presente y la renderizan según variante.
- **Validación:** `mediaUrlSchema` ya valida `/uploads/<slug>/<file>` + hosts configurados + Supabase storage. No cambia.
- **Storage adapters:** `lib/media/*` ya está wired; no requiere cambios en T-C.

### Acceptance criteria

- `bio`, `exhibitions`, `contact` y todas las secciones nuevas tienen slot de imagen funcional.
- Subir una imagen → preview inmediata → aparece en render de `/sites/<slug>`.
- Galerías inline (gallery, press) permiten reordenar y eliminar imágenes.
- Tests de integración cubren upload → persist → render.

---

## T-A · demo-content-enriquecido

**Objetivo:** reemplazar los placeholders de `picsum` por contenido demo realista que showcasee los 3 dialectos + todas las secciones nuevas.

### Scope

- **3 artistas enriquecidos** (sin agregar nuevos):
  - `luna-vega` → dialecto `minimal-gallery`. 10-12 obras. Statement curatorial, featured-work, gallery secundaria, contacto con portrait.
  - `marco-torres` → dialecto `editorial`. 10-12 obras. Press, exhibitions con timeline, CTA de suscripción.
  - `sofia-rios` → dialecto `immersive`. 10-12 obras. Video de proceso, bio con pull-quote, featured-work en background.
- **Fuente de imágenes:** Unsplash curado manualmente (API o lista de IDs); obras reales de Quadro si hay permisos. Metadata: `attribution` con autor + link de Unsplash o "cortesía Quadro".
- **Script:** `scripts/seed-demo.ts` genera/actualiza los 3 configs + works.json a partir de un seed estático (`data/demo-seed/<slug>/{config,works,images}.json`). Reemplaza a `scripts/seed-cloud.ts` para el flujo local (cloud sigue usando seed-cloud).
- **Assets:** imágenes en `public/demo/<slug>/*.jpg` (local) + opción de mirror a Supabase storage cuando `STORAGE_BACKEND=cloud`.
- **Attribution file:** `data/attributions.json` lista cada imagen con su fuente y crédito.

### Acceptance criteria

- `/sites/luna-vega|marco-torres|sofia-rios` muestran contenido coherente sin placeholders obvios.
- Todas las secciones nuevas (gallery, statement, featured-work, press, cta, video) aparecen en al menos un artista demo.
- Las variantes nuevas se usan al menos una vez cada una en los 3 demos.
- `data/attributions.json` lista todas las imágenes con autor.

---

## T-E · ai-copilot

**Objetivo:** copilot proactivo que, tras cambios significativos del editor, propone 2-3 alternativas aplicables con un click.

### Scope

- **Módulo nuevo:** `lib/copilot/`
  - `types.ts` — `Suggestion = { id, type: 'visual'|'structural'|'content'|'best-practice', title, rationale, preview?, patch: JsonPatch, source: 'rules'|'ai' }`.
  - `rules.ts` — motor determinista. Reglas iniciales:
    - *Best practice:* perfil incompleto (sin logo, sin email, obra sin descripción).
    - *Estructural:* tiene cover pero no bio visible; tiene artworks pero no featured-work.
    - *Visual:* paleta con contraste bajo (<AA).
  - `suggester.ts` — orquesta. Dado `{currentConfig, changeEvent}`, llama reglas y, si procede, hace 1 request IA para contenido/variantes contextuales.
  - `patch.ts` — aplica `patch` a config de forma atómica (JsonPatch o immer).
- **API:**
  - `POST /api/copilot/suggest` body: `{ artistSlug, currentConfig, changeEvent }` → `Suggestion[]`.
  - Reusa rate limit existente (`lib/ai/`); sugerencias con `source='ai'` cuentan contra la cuota diaria, las `source='rules'` no.
  - Logger existente registra prompts y respuestas.
- **UI:**
  - `components/editor/CopilotPanel.tsx` — rail derecho del editor, debajo de `AIRequestPanel`. Muestra 2-3 cards activas.
  - Cada card: título + rationale corto + preview visual del cambio (si visual) + botones "Aplicar" / "Descartar".
  - `useCopilotSuggestions` hook: observa el `useConfigHistory` del editor, debounce 2500ms, llama a `/api/copilot/suggest`, almacena últimas sugerencias.
  - Aplicar = patch atómico al config draft; persistir vía `/api/draft` existente.
  - Descartar = marca como vista en estado local (no se repite esa sugerencia por 1 hora).
- **Tipos de sugerencias cubiertas (las 4):**
  - Visuales: colores, fonts, spacing, variantes de sección.
  - Estructurales: agregar/reordenar/activar secciones.
  - Contenido: textos de bio, statement, SEO.
  - Best practices: compleción de perfil, obras sin descripción, falta de contacto.
- **Testing:** unit tests del motor de reglas + mock del provider IA + integración del hook.

### Acceptance criteria

- Al cambiar `styleTokens.accent` → aparece 1 sugerencia visual + 1 relacionada en <3s.
- Al cambiar de dialecto `editorial` → aparece 1 sugerencia estructural (ej. "activá press").
- Sugerencias `source='rules'` no consumen cuota IA (verificable en `ai-log.jsonl`).
- Botón "Aplicar" modifica el draft y rerenderea el preview sin recargar.
- Rate limit respetado: cuando se alcanza, el copilot emite solo sugerencias de reglas.

---

## Open items (se cierran al planificar cada ticket con /squad)

- **T-D:** confirmar la `fontPair` default exacta y los valores de crema/tinta en hex exacto.
- **T-B:** definir el shape de `content` para `cta`, `press` y `video` en el schema (campos específicos). Decidir si `SectionConfigSchema.content` pasa a discriminated union o se queda como record.
- **T-C:** decidir si `gallery` y `press` reusan el mismo adapter de "lista reordenable" o cada uno trae su propio UI.
- **T-A:** elegir las URLs de Unsplash concretas o la lista de imágenes a descargar (manual, no automatizado).
- **T-E:** decidir si las "best practices" son sugerencias persistentes (checklist en el panel) o one-shot (igual que visuales/estructurales).

Cada ticket resuelve sus open items en la fase de planning de su `/squad`; no se pre-deciden aquí para no bloquear.
