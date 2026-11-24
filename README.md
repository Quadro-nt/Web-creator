# Quadro Sites — Piloto

Plataforma multi-sitio sobre Next.js donde cada artista del marketplace Quadro diseña y publica su propia web desde un editor visual. Pensada para artistas del catálogo emergente de Quadro: ellos editan contenido, tipografías, colores y secciones sin tocar código. El piloto valida con 3-5 artistas que el flujo (alta → edición → publicación → compra por WhatsApp) funciona de punta a punta antes de abrirlo al resto del marketplace.

## Requisitos

- Node.js >= 18
- npm

## Instalación y arranque local

```bash
npm install
npm run dev
# Sitios de prueba: http://luna-vega.localhost:3000 (o http://localhost:3000/sites/luna-vega)
# Editor: http://localhost:3000/editor/token-luna-vega-dev
```

En local los sitios se acceden por subdominio (`http://<slug>.localhost:3000`) o por ruta (`/sites/<slug>`). En producción, el `middleware.ts` resuelve el subdominio (`<slug>.quadro-nt.com`) y reescribe la petición hacia `/sites/<slug>`.

## Cómo dar de alta un artista

Para incorporar un nuevo artista al piloto:

1. **Crear la carpeta** `data/artists/<slug>/`. El `<slug>` es el identificador en URL (ej: `luna-vega`); usa sólo minúsculas, números y guiones.
2. **Crear `works.json`** con el catálogo de obras siguiendo el schema de la sección [Schema de works.json](#schema-de-worksjson).
3. **Crear `config.published.json`** con la configuración del sitio (template, tokens de diseño, secciones, identidad). El schema completo está en `lib/schemas/site-config.schema.ts`. Puedes partir de `defaultSiteConfig` exportado en ese mismo archivo.
4. **Crear `token.txt`** con una cadena aleatoria larga (mínimo 32 caracteres). Es el token secreto que el artista usará para entrar al editor. **No se comparte por canales inseguros ni se versiona en git.**
5. **Entregar al artista la URL del editor**: `/editor/<contenido-de-token.txt>`. Al entrar, puede editar y publicar; los cambios quedan en `config.draft.json` (borrador) y pasan a `config.published.json` al publicar.

> El artista nunca ve ni toca `token.txt`. Se le entrega sólo la URL final del editor que contiene ese token.

## Schema de works.json

`works.json` describe el catálogo de obras del artista. Es un objeto con `artistSlug` y un arreglo `works`. Cada obra tiene estos campos:

| Campo         | Tipo              | Requerido | Descripción |
|---------------|-------------------|-----------|-------------|
| `slug`        | string            | Sí        | Identificador único de la obra dentro del artista. Sólo minúsculas, números y guiones. |
| `title`       | string (1-120)    | Sí        | Título de la obra. |
| `year`        | número entero     | Sí        | Año de creación (1900-2100). |
| `medium`      | string (≤80)      | Sí        | Técnica (ej: "Óleo sobre lienzo"). Puede quedar vacío si no aplica. |
| `dimensions`  | string (≤60)      | Sí        | Dimensiones legibles (ej: "80 × 60 cm"). |
| `price`       | número positivo   | No        | Precio en la moneda indicada por `currency`. Si se omite, el sitio muestra "Consultar precio". |
| `currency`    | `"PEN"` \| `"USD"`| No        | Moneda del precio. Por defecto `PEN`. |
| `sold`        | boolean           | No        | `true` marca la obra como vendida (se oculta el botón de compra). Por defecto `false`. |
| `images`      | string[] (URL)    | Sí        | URLs de las imágenes de la obra. Al menos 1. La primera se usa como miniatura. |
| `description` | string (≤600)     | No        | Texto corto sobre la obra. |
| `tags`        | string[]          | No        | Etiquetas para filtrar/agrupar. Por defecto `[]`. |

### Ejemplo completo

```json
{
  "artistSlug": "luna-vega",
  "works": [
    {
      "slug": "amanecer-en-barranco",
      "title": "Amanecer en Barranco",
      "year": 2024,
      "medium": "Óleo sobre lienzo",
      "dimensions": "80 × 60 cm",
      "price": 2800,
      "currency": "PEN",
      "sold": false,
      "images": [
        "https://cdn.quadro-nt.com/luna-vega/amanecer-barranco-1.jpg",
        "https://cdn.quadro-nt.com/luna-vega/amanecer-barranco-2.jpg"
      ],
      "description": "Pintura al óleo sobre el malecón de Barranco al amanecer, con énfasis en la luz dorada sobre el acantilado.",
      "tags": ["óleo", "paisaje", "lima"]
    }
  ]
}
```

## Variables de entorno

Se configuran en `.env.local` (dev) o en el dashboard de Vercel (prod). **Nunca se commitean valores a git.**

| Variable                      | Descripción                                                                 | Ejemplo                       |
|-------------------------------|-----------------------------------------------------------------------------|-------------------------------|
| `AI_PROVIDER`                 | Proveedor de IA. `anthropic` para producción, `mock` para desarrollo/tests. Default: `mock`. | `anthropic`                   |
| `AI_API_KEY`                  | Clave de API del proveedor de IA. Requerida si `AI_PROVIDER=anthropic`.    | `sk-ant-...`                  |
| `AI_DAILY_LIMIT_PER_ARTIST`   | Tope de pedidos a la IA por artista por día. Default: `20`.                | `20`                          |
| `NEXT_PUBLIC_BASE_URL`        | URL base pública del sitio. Se usa para enlaces absolutos y metadatos OG. | `https://quadro-nt.com`       |
| `NEXT_PUBLIC_WHATSAPP_NUMBER` | Número de WhatsApp en formato internacional (sin `+` ni espacios). Se usa para construir los deeplinks de compra. | `51999000000`                 |

## Tests

```bash
npm test                   # tests unitarios (Jest)
npx playwright test        # tests E2E (requiere el servidor corriendo con npm run dev)
```

Comandos de verificación adicionales:

```bash
npm run lint               # linter
npx tsc --noEmit           # chequeo de tipos
npm run build              # build de producción
```

## Despliegue en Vercel

Pasos generales. El detalle completo (adaptador de almacenamiento en producción, backups, CDN de imágenes) estará en `README-prod.md` cuando se defina el adaptador de producción.

1. **Conectar el repo a Vercel** desde el dashboard: importar el proyecto desde GitHub y dejar la configuración por defecto de Next.js.
2. **Configurar variables de entorno** en el dashboard de Vercel (ver [Variables de entorno](#variables-de-entorno)). Asignar cada variable al entorno correspondiente (Production, Preview, Development).
3. **Resolución de subdominios**: configurar un wildcard DNS `*.quadro-nt.com` apuntando a Vercel (CNAME a `cname.vercel-dns.com`) y agregar el dominio wildcard `*.quadro-nt.com` en la sección Domains del proyecto de Vercel.
4. **Middleware**: `middleware.ts` ya está preparado para detectar el subdominio en producción y reescribir la petición a `/sites/<slug>`. No requiere configuración adicional.

## Estructura del proyecto (breve)

| Carpeta                        | Propósito |
|--------------------------------|-----------|
| `app/sites/[artist]/`          | Sitios públicos de artistas (render de templates). |
| `app/editor/[token]/`          | Editor visual (entrada por token). |
| `app/api/`                     | Endpoints: guardar borrador (`draft`), publicar (`publish`), sugerencias de IA (`ai-suggest`). |
| `components/templates/`        | Los 3 templates: `minimal-gallery`, `editorial`, `immersive`. |
| `components/editor/`           | Componentes del editor visual (paneles, controles, previsualización). |
| `lib/schemas/`                 | Schemas Zod de configuración de sitio y de obras. |
| `lib/tokens/`                  | Motor de tokens de diseño y utilidades de contraste. |
| `lib/ai/`                      | Interfaz `AIProvider`, `MockProvider` y rate limiter por artista. |
| `data/artists/`                | Datos locales de artistas (works, config, token). **No se versiona en producción.** |
