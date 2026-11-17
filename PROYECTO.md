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

- [Por completar]

## Historial de tiempos

| Fecha | Ticket | Tamaño | N° tareas | ETA inicial | Fin real | Desvío |
|-------|--------|--------|-----------|-------------|----------|--------|
