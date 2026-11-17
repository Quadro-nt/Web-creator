# Imagenes de produccion

Esta carpeta es el punto de montaje para las imagenes definitivas de los artistas (obras, portadas, OG, biografia).

## Flujo recomendado

- **Produccion**: subir aqui las imagenes optimizadas por cada artista bajo `public/placeholders/<slug>/`, o servirlas desde un CDN (Vercel Blob, S3, Cloudinary) y referenciarlas por URL absoluta en los JSON de configuracion.
- **Desarrollo y fixtures**: los JSON de los artistas de prueba (`data/artists/<slug>/works.json`, `data/artists/<slug>/config.published.json`) usan URLs de Picsum Photos con semilla fija, por ejemplo `https://picsum.photos/seed/luna-1/800/1000`. La semilla hace que la imagen sea estable entre ejecuciones.

## Por que no commiteamos imagenes reales

- Peso del repo (las obras suelen pesar varios MB cada una).
- Derechos de autor: cada obra pertenece al artista.
- En los tests las URLs se mockean, por lo que no se descargan en CI.

## Para agregar imagenes reales a un artista en produccion

1. Colocar los archivos en `public/placeholders/<slug>/<nombre>.jpg` (o subirlos al CDN).
2. Actualizar `data/artists/<slug>/works.json` con las URLs absolutas (locales: `/placeholders/<slug>/<nombre>.jpg`).
3. Validar con `npm test -- --passWithNoTests` que el JSON sigue cumpliendo con `WorksFileSchema`.
