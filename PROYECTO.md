# PROYECTO.md — Quadro Sites

## Qué es

App Next.js multi-sitio donde cada artista de Quadro diseña su web con un editor visual y la publica en su subdominio (`nombre.quadro-nt.com`). En local se sirve por ruta (`/_sites/nombre`). Piloto para validar con 3-5 artistas del marketplace de arte emergente Quadro.

## Stack

- **Framework**: Next.js 14 App Router + TypeScript
- **Estilos**: Tailwind CSS + CSS custom properties (tokens de diseño generados desde config)
- **Validación**: Zod (schema de configuración de sitio y de obras)
- **Tests unitarios**: Jest + React Testing Library
- **Tests E2E**: Playwright
- **Almacenamiento (dev)**: archivos JSON locales en `data/artists/<slug>/`
- **IA**: interfaz `AIProvider` con MockProvider para tests y ClientProvider (Anthropic) para prod
- **Servicios externos**: WhatsApp deeplink (solo URL construida, sin SDK); Vercel para despliegue

## Cómo correr localmente

```bash
npm install
npm run dev        # levanta en localhost:3000
# Artistas de prueba: /_sites/luna-vega, /_sites/marco-torres, /_sites/sofia-rios
# Editor: /editor/token-luna-vega-dev
```

## Verificación — comandos que deben pasar antes de worker_done

```bash
# Tests unitarios
npm test -- --passWithNoTests

# Linter
npm run lint

# Tipos
npx tsc --noEmit

# Build
npm run build
```

## Verificación E2E (solo en T7 y en integración final)

```bash
npx playwright test
```

## Zonas que no tocar sin aprobación de Lionel

- `.env*` y `data/artists/*/token.txt` — tokens secretos de acceso al editor
- `.squad/`, `.claude/`, `hooks/` — configuración del squad
- Llamadas reales a WhatsApp, Vercel o proveedor de IA en producción

## Variables de entorno

```
AI_PROVIDER              # 'anthropic' | 'openai'
AI_API_KEY               # clave de API del proveedor
AI_DAILY_LIMIT_PER_ARTIST  # tope diario por artista (default: 20)
NEXT_PUBLIC_BASE_URL     # URL base (ej: https://quadro-nt.com)
```

## Artistas de prueba (dev)

| Slug | Template | Token de editor |
|------|----------|-----------------|
| luna-vega | minimal-gallery | token-luna-vega-dev |
| marco-torres | editorial | token-marco-torres-dev |
| sofia-rios | immersive | token-sofia-rios-dev |

## Lo que el escuadrón ha aprendido

<!-- El planificador actualiza esta sección al cerrar cada ticket (Art. 10 Constitución) -->

- En Next.js 14 App Router las rutas activas de artistas están en `app/sites/[artist]/` (en local: `http://<slug>.localhost:3000` o `/sites/<slug>`), no en `app/_sites/`.
- En Next.js 14 `next build` falla si un `route.ts` exporta funciones que no sean handlers HTTP o metadata de segmento; los helpers de rate limit y reset de pruebas deben vivir en `lib/`.
- Con `@jest/globals` y `next/jest`, los `import` estáticos se evalúan antes de mocks dinámicos; usar `await import(...)` tras `jest.mock(...)` cuando se mockeen módulos en tests de rutas API.
- `jsdom` imprime `Error: Could not parse CSS stylesheet` al encontrar `@container qs-canvas` en `<style>` inyectados, pero las 24 suites pasan sin fallo.
- En Windows con sandbox de Antigravity: `.git/` solo tiene permiso de lectura/ejecución en sandbox (los comandos git que escriben requieren `BypassSandbox: true`), y `run_workflow` evalúa las regex `Deny` de Terminal Commands contra el texto fuente completo de `.agents/workflows/squad_ticket.py`.
- `STORAGE_BACKEND=cloud` activa los adaptadores Supabase (Postgres + Storage) vía factories (`getStorageAdapter`, `getWorksRepository`, `getMediaAdapter`) y validación SHA-256 en `token-validator.ts`; el default `file` mantiene intactos dev, Jest y Playwright.
- `scripts/seed-cloud.ts` resuelve el alias `@/` en runtime para `ts-node`; en PowerShell se invoca con `--compiler-options '{\"module\":\"commonjs\"}'`.
- Con `@jest/globals` y `next/jest` (SWC), `jest.spyOn` sobre exports nombrados falla (`Cannot redefine property`); usar `jest.mock(..., () => ({ ...jest.requireActual(...), ... }))` junto con `await import(...)`.
- Al agregar dependencias a `package.json`, la regla de seguridad bloquea `npm install` a los agentes: Lionel debe ejecutar `npm install --package-lock-only` para mantener `package-lock.json` sincronizado para `npm ci`.
- En `@supabase/auth-js` (`GoTrueClient`), `persistSession: false` ignora `options.storage`; para PKCE server-side con cookies usar `persistSession: Boolean(options?.storage)`.
- Con Refresh Token Rotation de Supabase Auth, los Server Components validan sesión con `allowRefresh: false` y delegan la renovación de tokens expirados a `GET /api/auth/refresh` para poder emitir `Set-Cookie`.
- La suite de jest requiere **Node.js ≥ 22** porque `lib/auth/__tests__/session-and-onboarding.test.ts` ("writes code-verifier into PKCE storage using the real createSupabaseAuthClient") crea un `SupabaseClient` real que inicializa `RealtimeClient`, y `@supabase/realtime-js` necesita `globalThis.WebSocket` (nativo en Node 22+, ausente en 18/20). Correr las verificaciones en servers con Node ≥ 22 (o importar un polyfill `ws` antes de ejecutar).
- Verificación final de `design-system-museo` en Linux (Lenovo) reveló que `__tests__/backwards-compat.test.ts` fallaba `tsc` por ausencia de tipos globales de Jest; patrón obligatorio en este repo: **todo test nuevo debe importar explícitamente `{ describe, it, expect }` de `@jest/globals`**.

## Historial de tiempos

| Fecha | Ticket | Tamaño | N° tareas | ETA inicial | Fin real | Desvío |
|-------|--------|--------|-----------|-------------|----------|--------|
| 2026-11-24 | pilot-hardening-and-fixes | M | 3 | 09:45 | 09:36 | -9 min (0 rondas compuerta / 0 rondas verificación) |
| 2026-11-24 | prod-adapters-and-ai | L | 7 | 10:35 | 10:49 | +14 min (0 rondas compuerta / 1 ronda verificación; incl. 2 pausas manuales npm) |
| 2026-11-24 | artist-auth-and-home | L | 5 | 12:15 | 12:14 | -1 min (0 rondas compuerta / 1 ronda verificación) |
| 2026-11-24 | design-system-museo | M | 5 | 19:30 | 2026-11-25 10:45 | overnight + 1 FIX3 por tsc en Lenovo (0 rondas compuerta / 3 rondas verificación: local OK, Lenovo descubrió tsc fail por `@jest/globals` faltante + jest fail por Node<22 documentado) |
