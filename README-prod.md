# Quadro Sites — Guía Operativa de Producción

Esta guía describe el despliegue, operación, seguridad y mantenimiento de **Quadro Sites** en producción sobre **Vercel**, **Supabase** (Postgres + Storage) y **Anthropic**.

> **Regla de seguridad:** Nunca guardes ni commitees valores reales de `.env*`, llaves de API, `SUPABASE_SERVICE_ROLE_KEY` ni tokens de editor (`token.txt`) en git.

---

## 1. Arquitectura de producción

```text
  [Visitante / Artista]
          │
          ├── https://<slug>.quadro-nt.com ──► Vercel (Next.js 14 App Router)
          │                                      └─ middleware.ts reescribe a /sites/<slug>
          │
          └── https://quadro-nt.com/editor/<token>
                                                 │
                 ┌───────────────────────────────┼───────────────────────────────┐
                 ▼                               ▼                               ▼
     Supabase Postgres                  Supabase Storage                 Anthropic API
  (tablas: artists, works,          (bucket público: artist-media;     (AI_PROVIDER=anthropic,
   newsletter_subscribers,           escritura solo via service_role)   límite diario en Postgres
   ai_daily_usage, ai_logs)                                             y auditoría en ai_logs)
```

Componentes principales:

- **Vercel (Next.js 14 App Router):** Sirve los sitios públicos por subdominio (`<slug>.quadro-nt.com` vía `middleware.ts`), el editor visual (`/editor/[token]`) y los endpoints `/api/*`.
- **Supabase Postgres (`supabase/schema.sql`):** Persiste configuración publicada/borrador (`artists`), catálogo de obras (`works`), suscriptores (`newsletter_subscribers`), cuotas diarias de IA (`ai_daily_usage`) y auditoría de pedidos a la IA (`ai_logs`). El acceso desde el servidor se activa con `STORAGE_BACKEND=cloud`.
- **Supabase Storage (`artist-media`):** Almacena imágenes subidas por los artistas bajo `<slug>/...` con lectura pública y escritura restringida al servidor (`service_role`).
- **Anthropic (`AIProvider`):** Ejecuta sugerencias de diseño en `/api/ai-suggest` validando la salida con `SiteConfigSchema` y respetando `AI_DAILY_LIMIT_PER_ARTIST`.
- **WhatsApp:** Los botones de compra construyen deeplinks directos (`wa.me`) en el navegador usando `NEXT_PUBLIC_WHATSAPP_NUMBER`, sin SDK ni backend de terceros.

---

## 2. Variables de entorno en Vercel

Configúralas en **Vercel Dashboard → Project → Settings → Environment Variables**. Nunca copies valores reales en este repositorio.

| Variable | Propósito | Obligatorio / Opcional | Entorno (Production / Preview) |
| --- | --- | --- | --- |
| `STORAGE_BACKEND` | Activa adaptadores cloud (`cloud`). Si no es `cloud`, usa sistema de archivos local (`file`). | Obligatorio (`cloud`) | Production (y Preview si apunta a Supabase de pruebas) |
| `SUPABASE_URL` | URL base del proyecto Supabase (`https://<project-ref>.supabase.co`). | Obligatorio con `STORAGE_BACKEND=cloud` | Production / Preview |
| `SUPABASE_SERVICE_ROLE_KEY` | Llave `service_role` de Supabase usada exclusivamente en servidor. | Obligatorio con `STORAGE_BACKEND=cloud` | Production / Preview |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Llave pública (`anon` / Publishable) de Supabase; obligatoria para registro/login de artistas y Google OAuth. | Obligatorio con `STORAGE_BACKEND=cloud` | Production / Preview |
| `SUPABASE_STORAGE_BUCKET` | Nombre del bucket de Supabase Storage para medios de artistas. | Opcional (default: `artist-media`) | Production / Preview |
| `ARTIST_TOKEN_HASHES` | Mapa JSON `{"<slug>":"<sha256-hex>"}` usado como respaldo de validación cloud y como entrada opcional en `scripts/seed-cloud.ts`. | Opcional | Production / Preview |
| `AI_PROVIDER` | Proveedor de IA: `anthropic` o `mock`. En `NODE_ENV=production`, si se omite usa `anthropic`. | Recomendado explícito (`anthropic` en Prod, `mock` en Preview) | Production (`anthropic`) / Preview (`mock`) |
| `AI_API_KEY` | Clave de API de Anthropic para `/api/ai-suggest`. | Obligatorio si `AI_PROVIDER=anthropic` | Production |
| `AI_MODEL` | Identificador del modelo de Anthropic. | Opcional (default: `claude-haiku-4-5`) | Production / Preview |
| `AI_DAILY_LIMIT_PER_ARTIST` | Tope máximo de pedidos diarios a la IA por artista. | Opcional (default: `20`) | Production / Preview |
| `NEXT_PUBLIC_BASE_URL` | URL base pública del sitio (ej. `https://quadro-nt.com`) para metadatos y enlaces absolutos. | Obligatorio | Production / Preview |
| `NEXT_PUBLIC_WHATSAPP_NUMBER` | Número de WhatsApp en formato internacional sin `+` ni espacios (ej. `51999000000`) para deeplinks de compra. | Obligatorio para compra por WhatsApp | Production / Preview |
| `NEXT_PUBLIC_SUPABASE_MEDIA_HOST` | Hostname personalizado adicional de Supabase Storage permitido por `SiteConfigSchema`. | Opcional | Production / Preview |
| `NEXT_PUBLIC_MEDIA_HOST` | Hostname CDN externo permitido por `SiteConfigSchema` para imágenes. | Opcional | Production / Preview |

---

## 3. Configuración de Supabase

### 3.1. Aplicar el esquema SQL

1. Crea un proyecto en Supabase (región cercana a tus usuarios, ej. `us-east-1` o `sa-east-1`).
2. Abre **SQL Editor** en el dashboard de Supabase (o usa `psql` / Supabase CLI con tu conexión de Postgres).
3. Ejecuta el contenido completo de `supabase/schema.sql`. El script es idempotente (`CREATE TABLE IF NOT EXISTS`) y crea:
   - `artists`
   - `works`
   - `newsletter_subscribers`
   - `ai_daily_usage`
   - `ai_logs`

### 3.2. Crear el bucket público `artist-media`

1. En **Storage → Buckets**, crea un bucket llamado `artist-media` con la opción **Public bucket** activada (o verifica el nombre definido en `SUPABASE_STORAGE_BUCKET`).
2. Configura las políticas RLS en `storage.objects` para permitir **lectura pública** y **escritura únicamente vía `service_role`** (el rol `service_role` omite RLS en Supabase; basta con crear la política de lectura pública y no otorgar `INSERT`/`UPDATE`/`DELETE` a `anon` ni `authenticated`):

```sql
-- Lectura pública de imágenes del bucket artist-media
CREATE POLICY "Public read access for artist-media"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'artist-media');
```

3. Verifica que no existan políticas de `INSERT`, `UPDATE` o `DELETE` abiertas a `anon` o `authenticated` para `bucket_id = 'artist-media'`. Las subidas desde `/api/upload` se realizan exclusivamente en servidor mediante `SUPABASE_SERVICE_ROLE_KEY`.

### 3.3. Autenticación de artistas (Supabase Auth + Google Login)

1. **Migración SQL idempotente (para bases ya creadas):** si tu tabla `artists` fue creada antes de habilitar cuentas de artista, ejecuta en **SQL Editor**:

```sql
ALTER TABLE artists ADD COLUMN IF NOT EXISTS owner_user_id uuid UNIQUE;
ALTER TABLE artists ADD COLUMN IF NOT EXISTS owner_email text;
ALTER TABLE artists ADD COLUMN IF NOT EXISTS display_name text;
```

2. **Configuración de URLs en Supabase (`Authentication → URL Configuration`):**
   - **Site URL:** `https://<tu-dominio>` (por ejemplo, `https://quadro-nt.com`).
   - **Redirect URLs:** agrega las rutas de callback permitidas para OAuth y confirmación por correo:
     - `https://<tu-dominio>/api/auth/callback`
     - `https://*.vercel.app/api/auth/callback`

3. **Activar proveedores en Supabase (`Authentication → Providers`):**
   - **Email:** habilita el proveedor **Email**.
     - *Confirm email:* déjalo **ON** en producción si deseas exigir verificación de correo antes de iniciar sesión (el enlace redirige a `/api/auth/callback`), o **OFF** si prefieres ingreso inmediato tras el registro durante el piloto.
   - **Google OAuth:**
     1. En **Google Cloud Console → APIs & Services → Credentials**, crea un **OAuth 2.0 Client ID** (tipo *Web application*) y registra como *Authorized redirect URI* el callback de Supabase (`https://<project-ref>.supabase.co/auth/v1/callback`).
     2. Copia el **Client ID** y el **Client Secret** generados.
     3. En **Supabase → Authentication → Providers → Google**, activa el proveedor, pega el **Client ID** y el **Client Secret**, y guarda los cambios.

---

## 4. Wildcard DNS `*.quadro-nt.com`

1. En tu proveedor DNS de `quadro-nt.com`:
   - Configura el dominio raíz `quadro-nt.com` con un registro `A` apuntando a `76.76.21.21` (o `ALIAS`/`ANAME` según soporte tu proveedor).
   - Configura el registro wildcard:
     - **Tipo:** `CNAME`
     - **Nombre / Host:** `*` (resuelve `*.quadro-nt.com`)
     - **Valor / Destino:** `cname.vercel-dns.com`
2. En **Vercel Dashboard → Project → Settings → Domains**:
   - Agrega `quadro-nt.com`.
   - Agrega `*.quadro-nt.com`.
   - Si Vercel solicita verificación por registro `TXT` para emitir el certificado TLS wildcard, agrega el registro `TXT` indicado en tu DNS y espera la validación.
3. `middleware.ts` ya detecta el host `<slug>.quadro-nt.com` en producción y reescribe la petición internamente a `/sites/<slug>`.

---

## 5. Higiene de git y rotación de tokens (pasos manuales para Lionel)

Antes de pasar el repo a producción, asegúrate de que ningún token ni estado operativo local quede versionado en git y rota todos los tokens de desarrollo.

### 5.1. Retirar archivos sensibles/locales del índice de git

Ejecuta estos comandos en la raíz del repositorio (esto los quita del tracking de git sin borrar tus archivos locales):

```bash
git rm --cached --ignore-unmatch data/artists/*/token.txt
git rm --cached --ignore-unmatch data/artists/*/config.draft.json
git rm --cached --ignore-unmatch data/artists/*/subscribers.json
git rm --cached --ignore-unmatch data/artists/*/ai-daily-count.json
git rm --cached --ignore-unmatch data/artists/*/ai-log.jsonl
```

Verifica con `git status` y confirma que `.gitignore` cubra esos patrones antes de hacer commit. Si alguno de esos tokens de desarrollo ya estuvo en el historial remoto de un repo privado que se abrirá o compartirá, rota los tokens inmediatamente (paso siguiente).

### 5.2. Generar nuevos tokens y actualizar hashes SHA-256

Para cada artista (`luna-vega`, `marco-torres`, `sofia-rios`):

1. Genera un token aleatorio nuevo (48 caracteres hex = 24 bytes de entropía):

```bash
node -e "console.log(require('crypto').randomBytes(24).toString('hex'))"
```

2. Calcula el hash SHA-256 (hex en minúsculas) de ese token sin guardarlo en archivos del repo:

```bash
node -e "const c=require('crypto'); console.log(c.createHash('sha256').update(process.argv[1],'utf8').digest('hex'))" "<TOKEN_GENERADO>"
```

3. Guarda la URL del editor `https://quadro-nt.com/editor/<TOKEN_GENERADO>` en tu gestor de contraseñas.
4. Actualiza `artists.token_hash` en Supabase (SQL Editor):

```sql
UPDATE artists
SET token_hash = '<SHA256_HEX>',
    updated_at = now()
WHERE slug = 'luna-vega';
```

5. *(Opcional)* Si también mantienes respaldo en `ARTIST_TOKEN_HASHES` en Vercel, actualiza el JSON `{"luna-vega":"<SHA256_HEX>", ...}` en las variables de entorno de Vercel y redeploya.

---

## 6. Ejecución del seed inicial

El script `scripts/seed-cloud.ts` es idempotente: lee únicamente `data/artists/<slug>/config.published.json` (validado con `SiteConfigSchema`) y `data/artists/<slug>/works.json` (validado con `WorksFileSchema`), **sin leer jamás `token.txt`**, y hace `upsert` sobre `artists` (`onConflict: 'slug'`) y `works` (`onConflict: 'artist_slug'`).

### 6.1. Dry-run (sin red ni credenciales)

Verifica primero los archivos y el plan de carga:

```bash
npx ts-node --compiler-options '{"module":"commonjs"}' scripts/seed-cloud.ts --dry-run
```

> **Nota para PowerShell en Windows:** escapa las comillas internas del JSON si tu terminal las elimina:
> `npx ts-node --compiler-options '{\"module\":\"commonjs\"}' scripts/seed-cloud.ts --dry-run`

### 6.2. Ejecución real contra Supabase

Exporta en tu terminal local (sin commitearlas) `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` y, si ya precalculaste hashes, `ARTIST_TOKEN_HASHES`:

```bash
npx ts-node --compiler-options '{"module":"commonjs"}' scripts/seed-cloud.ts
```

- Si `ARTIST_TOKEN_HASHES` define el hash para un slug, se usa ese hash directamente (`hashSource=env`).
- Si un slug no tiene hash en `ARTIST_TOKEN_HASHES`, el script genera un token seguro en memoria, almacena solo su SHA-256 en `artists.token_hash`, e imprime **una sola vez** en stdout las rutas `/editor/<token>` para que las guardes en tu gestor de contraseñas.

---

## 7. Backups y rotación de token de un artista individual

### 7.1. Estrategia de backups

- **Base de datos Postgres (Supabase):**
  - Activa **PITR (Point-in-Time Recovery)** en Supabase (plan Pro o superior) para recuperación granular ante borrados o corrupciones accidentales.
  - Complementa con un `pg_dump` periódico automatizado (usando la URL directa de Postgres en un secret de CI o servidor seguro, nunca en este repo), cifrando el volcado antes de guardarlo en almacenamiento externo:
    ```bash
    pg_dump --format=custom --no-owner --no-privileges "$SUPABASE_DB_URL" -f "quadro-sites-$(date +%F).dump"
    ```
- **Bucket `artist-media` (Supabase Storage):**
  - Programa una sincronización periódica del bucket `artist-media` hacia un bucket secundario o almacenamiento S3/R2 usando credenciales `service_role` de solo lectura o la API de Storage, ya que `pg_dump` respalda metadatos pero no los binarios de Storage.

### 7.2. Rotar el token de un artista individual

1. Genera un nuevo token de 24 bytes:
   `node -e "console.log(require('crypto').randomBytes(24).toString('hex'))"`
2. Calcula su hash SHA-256:
   `node -e "const c=require('crypto'); console.log(c.createHash('sha256').update(process.argv[1],'utf8').digest('hex'))" "<NUEVO_TOKEN>"`
3. Ejecuta en Supabase SQL Editor:
   ```sql
   UPDATE artists
   SET token_hash = '<NUEVO_SHA256_HEX>',
       updated_at = now()
   WHERE slug = '<slug-del-artista>';
   ```
4. Si usas `ARTIST_TOKEN_HASHES` en Vercel, actualiza también el hash de ese artista en la variable de entorno.
5. Guarda la nueva URL `https://quadro-nt.com/editor/<NUEVO_TOKEN>` en tu gestor de contraseñas, entrégasela al artista por un canal seguro y verifica que la URL con el token anterior sea rechazada (`401`/`403`).

---

## 8. Checklist de pruebas manuales post-deploy

Ejecuta esta verificación completa después del primer deploy a producción:

- [ ] **Subdominios y TLS:** Abre `https://luna-vega.quadro-nt.com`, `https://marco-torres.quadro-nt.com` y `https://sofia-rios.quadro-nt.com`. Confirma certificado SSL válido, carga del template correcto y visualización de las obras publicadas.
- [ ] **Acceso al editor con token rotado:** Abre `https://quadro-nt.com/editor/<token-rotado>` para un artista piloto y verifica que carga el editor; verifica que un token inválido o el antiguo token `-dev` ya no dan acceso.
- [ ] **Subida de imagen a Supabase Storage:** En el editor, sube una imagen válida (JPG/PNG/WebP ≤ 5 MB), confirma que responde OK y que la URL resultante apunta a `https://<project-ref>.supabase.co/storage/v1/object/public/artist-media/...` y carga públicamente.
- [ ] **Edición, publicación y revalidación de caché:** Cambia un título o color en el editor, guarda borrador, haz clic en **Publicar** y recarga `https://<slug>.quadro-nt.com` (sin caché del navegador) confirmando que el cambio aparece inmediatamente.
- [ ] **Sugerencia de IA real (Anthropic) y límite diario:** Envía un pedido de ajuste en el asistente de IA del editor; confirma que aplica un cambio válido, registra una fila en `ai_logs`, incrementa `ai_daily_usage` en Supabase y respeta el tope `AI_DAILY_LIMIT_PER_ARTIST`.
- [ ] **Suscripción a newsletter:** Envía un correo de prueba desde el formulario de newsletter en el sitio público de un artista y verifica la fila creada en `newsletter_subscribers` en Supabase.
- [ ] **Botón de compra por WhatsApp:** En una obra disponible (`sold: false`), haz clic en el botón de compra y confirma que construye el enlace `https://wa.me/<NEXT_PUBLIC_WHATSAPP_NUMBER>?text=...` con el título de la obra; confirma que en obras marcadas `sold: true` el botón no se muestra.
