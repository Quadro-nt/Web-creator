# Multi-sitio — Diseño

**Fecha:** 2026-11-26
**Scope:** Habilitar que un user pueda crear y gestionar N sitios (1 user → N artistas). Dashboard `/studio` con listado, crear nuevo sitio, borrar sitio, switcher entre sitios desde el editor.
**Estado:** aprobado para ejecución tras brainstorming con Lionel.

## Contexto

Quadro Sites hoy tiene constraint 1 user = 1 artist = 1 site vía `artists.owner_user_id UNIQUE` + check de 409 en `createArtistSiteForUser`. `/studio` es el editor del único artista del user logueado.

Este spec cierra el ítem **A** del bundle original #1 del brainstorming de 2026-11-25. Los otros ítems del bundle #3 (editor estilo granular por sección, sección carrusel) quedan para specs separados.

## Objetivos

1. Un user puede crear N sitios sin límite (ni cap suave).
2. Dashboard en `/studio` lista los sitios del user: featured (más recientemente editado) + lista densa de los demás + "+ Nuevo sitio".
3. Editor de un sitio específico en `/studio/[slug]` con topbar que incluye dropdown switcher + "← Mis sitios" explícito.
4. Borrar sitios desde el dashboard con confirmación "escribí el slug".
5. Compat: Lionel Arts (sitio actual de Lionel) y los 3 seeds (luna-vega, marco-torres, sofia-rios) siguen funcionando sin intervención manual.

## Decisiones transversales

- **Ownership**: seguimos con `artists.owner_user_id` (singular), solo quitamos el UNIQUE. Habilita colaboración en el futuro vía junction `user_artists` — spec aparte cuando aparezca demanda.
- **Sin límite por user**: cualquier user puede crear cualquier cantidad de sitios.
- **Fetch cache**: `dynamic = 'force-dynamic'` + `fetchCache = 'force-no-store'` + `revalidate = 0` en `/studio/*` (mismo patrón que `/sites/*`).
- **Sin feature flags**: mergea a main y feature queda disponible.
- **Testing baseline**: `npm test`, `npm run lint`, `npx tsc --noEmit`, `npm run build` verdes.

## 1 · Modelo de datos

Cambios en `supabase/schema.sql` (al final, idempotentes):

```sql
-- Multi-sitio: 1 user puede tener N artistas.
ALTER TABLE artists DROP CONSTRAINT IF EXISTS artists_owner_user_id_key;
CREATE INDEX IF NOT EXISTS artists_owner_user_id_idx ON artists(owner_user_id);
```

Script separado `supabase/migrations/2026-11-26-multi-sitio.sql` con el mismo SQL, para ejecutar en prod sin re-aplicar `schema.sql`.

**Invariantes**:
- `artists.slug` sigue siendo PK (identidad global de sitio).
- `artists.owner_user_id` sigue existiendo, ahora puede repetirse.
- Un `uid` puede ser dueño de N rows.
- Nada cambia en `works`, `newsletter_subscribers`, `ai_daily_usage`, `ai_logs` — referencian `artist_slug` que sigue siendo PK de artists.

**Roadmap (fuera de este spec)**: tabla `user_artists(user_id, artist_slug, role)` cuando aparezca demanda de colaboración o roles granulares. Migración: `INSERT INTO user_artists SELECT owner_user_id, slug, 'owner' FROM artists; ALTER TABLE artists DROP COLUMN owner_user_id;`.

## 2 · Routing

Rutas en `app/studio/`:

```
app/studio/
├── page.tsx                  ← NUEVO: dashboard (listado + featured + "+ Nuevo sitio")
├── [slug]/
│   ├── page.tsx              ← MOVIDO: editor (lo que hoy es /studio/page.tsx)
│   └── StudioTopBar.tsx      ← MOVIDO: topbar con dropdown + "Volver"
```

**Lo que no cambia**:
- `/sites/[artist]`, `/_sites/[artist]` — público, igual.
- `/editor/[token]` — token-based editor dev, igual.
- `/onboarding` — mismo formulario; solo refactor del server-side (sacar check 409).
- `/login`, `/signup` — igual.

**Lógica en `/studio/page.tsx` (dashboard)**:

```tsx
export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'
export const revalidate = 0

export default async function StudioDashboardPage() {
  const user = await getSessionUserOrRedirect()  // redirige a /login
  const artists = await getArtistsByUserId(user.id)
  if (artists.length === 0) redirect('/onboarding')
  return <StudioDashboard artists={artists} userEmail={user.email} />
}
```

**Lógica en `/studio/[slug]/page.tsx` (editor)**:

```tsx
export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'
export const revalidate = 0

type Props = { params: { slug: string } }

export default async function StudioEditorPage({ params }: Props) {
  const user = await getSessionUserOrRedirect()
  const current = await getArtistBySlugAndUserId(params.slug, user.id)
  if (!current) notFound()
  const others = await getArtistsByUserId(user.id).then(all => all.filter(a => a.slug !== params.slug))
  // ... carga config, works ...
  return (
    <>
      <StudioTopBar currentArtist={current} otherArtists={others} userEmail={user.email} />
      <EditorClient initialConfig={config} publishedConfig={published} artistSlug={current.slug} editorToken={SESSION_SENTINEL_TOKEN} works={works} />
    </>
  )
}
```

**Autorización**: `getArtistBySlugAndUserId(slug, uid)` ejecuta `SELECT * FROM artists WHERE slug = $1 AND owner_user_id = $2`. Si no matchea, `notFound()` (devuelve 404, no revela existencia).

**Redirect del onboarding tras crear**: `/onboarding` form submit → crea artist → `router.push('/studio/<nuevoSlug>')` (hoy va a `/studio` a secas).

**Link del wordmark**: `StudioTopBar` cambia `href="/"` a `href="/studio"`.

## 3 · Dashboard UI

**Estructura visual** (hybrid featured + list):

```
┌───────────────────────────────────────────────────────┐
│ QUADRO STUDIO                         email · cerrar  │
├───────────────────────────────────────────────────────┤
│ Mis sitios                                            │
│                                                       │
│ ┌─────────┬───────────────────────────────────────┐  │
│ │ preview │ MÁS RECIENTE                          │  │
│ │ 180x180 │ Lionel Arts                           │  │
│ │         │ lionel-arts.quadro-nt.com · Publicado │  │
│ │         │ [Editar →]  [Ver sitio público ↗]  ⋯  │  │
│ └─────────┴───────────────────────────────────────┘  │
│                                                       │
│ OTROS SITIOS (2)                      + Nuevo sitio   │
│ ┌─────────────────────────────────────────────────┐  │
│ │ Serie Nocturnas · nocturnas.quadro-nt.com · bo. │  │
│ │                                   Editar →   ⋯  │  │
│ ├─────────────────────────────────────────────────┤  │
│ │ Sandbox · sandbox.quadro-nt.com · borrador      │  │
│ │                                   Editar →   ⋯  │  │
│ └─────────────────────────────────────────────────┘  │
└───────────────────────────────────────────────────────┘
```

**Featured**: `artists.sort((a,b) => b.updated_at - a.updated_at)[0]`. Si `artists.length === 1`, se renderiza solo la featured y se oculta "OTROS SITIOS". Si `artists.length === 0`, el dashboard redirige a `/onboarding` antes de llegar acá.

**Preview visual de la card featured**: thumbnail del `config.identity.coverImageUrl` si existe. Si no, gradient derivado de `styleTokens.accent + background` (mismo patrón de `app/page.tsx` TemplateMiniPreview).

**Badge de estado** por sitio:
- **Publicado**: verde + bullet relleno, `config_published` existe y vigente.
- **Solo borrador**: gris + bullet hueco, solo `config_draft`.
- **Borrador pendiente**: naranja, `config_draft !== config_published`.

**Menú `⋯` por sitio** (misma lista en featured y list items):
- Editar → `/studio/<slug>`
- Ver sitio público → `/sites/<slug>` en nueva pestaña
- **Borrar sitio** → abre `DeleteSiteModal`

(Duplicar sitio: excluido explícitamente del scope.)

**`DeleteSiteModal`**:

```
Borrar sitio

Vas a borrar permanentemente:
  Lionel Arts (lionel-arts.quadro-nt.com)

Se eliminan: config, draft, obras, suscriptores al
newsletter, logs de IA. Las imágenes quedan en storage
pero no son accesibles desde la app.

Para confirmar, escribí el slug exacto:
[________________________]

[Cancelar]           [Borrar sitio]
                     ↑ disabled hasta matchear
```

Validación del input: trim + case-sensitive exact match con `slug`. Botón disabled hasta que coincide.

**Backend delete**:
- `DELETE /api/artists/<slug>` (nuevo endpoint).
- Headers: cookies de sesión (Supabase auth).
- Body: `{ confirmSlug: string }` — second check server-side por si el frontend bypasea validación client.
- Lógica: validar session, chequear `getArtistBySlugAndUserId(slug, uid)`, si body.confirmSlug !== slug → 400, si OK → `DELETE FROM artists WHERE slug = $1 AND owner_user_id = $2` → cascade.
- Return 200 `{ ok: true }` o 404 (sitio no existe o no es del user) o 400 (mal confirmSlug) o 401 (no session).

**Re-fetch tras delete**: router.refresh() en el frontend.

**Componentes nuevos** (`app/studio/`):
- `page.tsx` — Server Component, fetch + render.
- `StudioDashboard.tsx` — Client Component, maneja estado del modal.
- `SiteCard.tsx` — featured card.
- `SiteListItem.tsx` — fila de la lista.
- `DeleteSiteModal.tsx` — modal de confirmación.

**DashboardTopBar** (separado del editor topbar): wordmark + email + cerrar sesión. Sin badge de sitio ni "Ver sitio público" (estás viendo todos). Puede ser el mismo archivo `StudioTopBar` con una prop `mode: 'dashboard' | 'editor'`, o dos componentes separados — decisión de implementación.

## 4 · Studio topbar (editor del sitio)

**Layout desktop**:

```
QUADRO STUDIO    ← Mis sitios    [ Lionel Arts ▾ ]   ...   Ver sitio ↗  email  ⍈
```

1. **`QUADRO STUDIO`** — wordmark, link a `/studio` (dashboard).
2. **`← Mis sitios`** — botón explícito, link a `/studio`.
3. **Dropdown switcher** del sitio actual — chip con `currentArtist.displayName` + `▾`. Click abre:
   ```
   Mis sitios
   ────────────────────────────────
   ● Lionel Arts (actual)              (bold, no clickable)
   ○ Serie Nocturnas                   → /studio/nocturnas
   ○ Sandbox                           → /studio/sandbox
   ────────────────────────────────
   + Nuevo sitio                       → /onboarding
   ```
4. Espacio (flex-grow).
5. **`Ver sitio público ↗`** — link a `/sites/<slug>` en nueva pestaña.
6. **Email** (hidden <768px).
7. **`Cerrar sesión`**.

**Props de `StudioTopBar`** (`app/studio/[slug]/StudioTopBar.tsx`):

```ts
type StudioTopBarProps = {
  currentArtist: { slug: string; displayName: string | null }
  otherArtists: Array<{ slug: string; displayName: string | null }>
  userEmail: string
}
```

**Estado client del dropdown**:
- `const [open, setOpen] = useState(false)`
- ESC → close.
- Click afuera → close (overlay invisible full-screen).
- Teclas ↑↓ opcional (nice-to-have, YAGNI).

**Mobile (<768px)**:
- `← Mis sitios` oculto (el wordmark linkea igual).
- Chip del switcher con nombre truncado.
- Email oculto.

**Navegación**:
- Click en otro sitio del dropdown → `router.push('/studio/<otroSlug>')`.
- `+ Nuevo sitio` → `router.push('/onboarding')`.

## 5 · Migración y compat retroactiva

**Datos actuales**:
- Supabase prod: 1 user (`lionel@quadro-nt.com`) con 1 sitio `lionel-arts`.
- Seeds públicos: `luna-vega`, `marco-torres`, `sofia-rios` sin `owner_user_id`.
- Dev file: mismos 3 seeds, sin user real.

**Enfoque**: migración SQL de schema, sin tocar data.

**Ejecutar en prod**: `psql $SUPABASE_URL -f supabase/migrations/2026-11-26-multi-sitio.sql` o desde Supabase SQL Editor. El script es idempotente (los `IF EXISTS` protegen).

**Rollback**: `DROP INDEX IF EXISTS artists_owner_user_id_idx; ALTER TABLE artists ADD CONSTRAINT artists_owner_user_id_key UNIQUE (owner_user_id);` — requiere que no haya users con >1 sitio (borrar los extra antes).

**Cambios de código**:

En `lib/onboarding/artist-onboarding.ts`:
- Renombrar `getArtistByUserId(userId): Artist | null` → `getArtistsByUserId(userId): Artist[]` (array, order by `updated_at` desc).
- Dejar `getArtistByUserId` como thin wrapper `@deprecated` que devuelve `artists[0] ?? null`. Eliminarlo al final del plan cuando todos los consumers se refactorizan.
- Agregar `getArtistBySlugAndUserId(slug, userId): Artist | null`.
- En `createArtistSiteForUser`: eliminar bloque del check 409 "ya tienes un sitio" (líneas 241-247).

En `app/studio/page.tsx` (hoy editor):
- Convertir en dashboard (renderiza `<StudioDashboard>`).
- Lógica actual del editor se mueve a `app/studio/[slug]/page.tsx`.

En `app/onboarding/*`:
- Tras crear artista, redirect cambia de `/studio` a `/studio/<nuevoSlug>` (lleva directo al editor).
- Mensaje opcional: "Creando tu sitio N°X" si `artists.length > 0` (nice-to-have, YAGNI).

En `StudioTopBar.tsx`:
- Se mueve a `app/studio/[slug]/`.
- `href` del wordmark cambia de `/` a `/studio`.
- Agrega `← Mis sitios` button + dropdown switcher (ver Sección 4).

En `components/` (nuevos):
- `components/studio/SiteCard.tsx`
- `components/studio/SiteListItem.tsx`
- `components/studio/DeleteSiteModal.tsx`

**Flow para Lionel tras la migración**:
1. Visita `/studio` → ve dashboard con featured = "Lionel Arts".
2. Click "Editar →" → `/studio/lionel-arts` → mismo editor que hoy, con topbar nuevo.
3. Click "+ Nuevo sitio" → `/onboarding` → crea "lionel-nocturnas" → redirect `/studio/lionel-nocturnas`.
4. Vuelve a `/studio` (wordmark o "← Mis sitios") → ve los dos sitios.

**File adapter (dev)**: no se extiende para multi-sitio. En dev con `STORAGE_BACKEND=file`, los seeds no tienen owner; el dashboard `/studio` no tiene mucho sentido conceptual acá. Documentar en `PROYECTO.md`: "en dev se accede al editor vía `/editor/<token>`; `/studio` requiere cloud + usuario Supabase".

## 6 · Testing

**Unidad (Jest + RTL)**:

Onboarding (`lib/onboarding/__tests__/artist-onboarding.test.ts`):
- `createArtistSiteForUser` acepta llamadas repetidas con distintos slugs para el mismo userId.
- `createArtistSiteForUser` rechaza con 409 si el slug ya existe globalmente.
- `getArtistsByUserId(uid)` devuelve `[]` si el user no tiene sitios.
- `getArtistsByUserId(uid)` devuelve 1 si tiene uno.
- `getArtistsByUserId(uid)` devuelve `[B, A]` (más reciente primero) para 2 sitios.
- `getArtistsByUserId(uid)` filtra por owner — no devuelve sitios de otros users.
- `getArtistBySlugAndUserId` devuelve el sitio si coincide user + slug.
- `getArtistBySlugAndUserId` devuelve null si el slug es de otro user.
- `getArtistByUserId` (deprecado) devuelve el primero del array.

Dashboard (`app/studio/__tests__/dashboard-page.test.tsx`):
- Sin user → redirige a `/login`.
- User con 0 sitios → redirige a `/onboarding`.
- User con sitios → renderiza `<StudioDashboard>` con el array correcto.

API delete (`app/api/artists/[slug]/__tests__/delete.test.ts`):
- `DELETE /api/artists/<slug>` con token + sitio propio + `confirmSlug` correcto → 200, row borrada, works cascadean.
- Con sitio ajeno → 404.
- Sin auth → 401.
- `confirmSlug` mismatch → 400.

Editor studio (`app/studio/[slug]/__tests__/editor-page.test.tsx`):
- Sin user → redirige a `/login`.
- Slug ajeno → `notFound()`.
- Slug propio → renderiza `<EditorClient>` + `<StudioTopBar>` con props correctas.

Topbar (`app/studio/[slug]/__tests__/StudioTopBar.test.tsx`):
- Dropdown cerrado por default.
- Click en chip → abre dropdown con lista de `otherArtists`.
- Click en un sitio → `router.push('/studio/<slug>')`.
- `+ Nuevo sitio` → `router.push('/onboarding')`.
- `← Mis sitios` → `router.push('/studio')`.
- ESC cierra.
- Click afuera cierra.

Delete modal (`components/studio/__tests__/DeleteSiteModal.test.tsx`):
- Botón "Borrar sitio" disabled hasta match exacto.
- Case-sensitive.
- Trim del input.
- Click "Cancelar" cierra sin eliminar.

Site card + list item (`components/studio/__tests__/SiteCard.test.tsx`, `SiteListItem.test.tsx`):
- Render de name, subdominio, estado (publicado/borrador/pendiente).
- Click "Editar →" dispara navegación correcta.
- Click `⋯` abre menú con opciones.

**Integración (Jest + RTL)**:
- Dashboard con 2 sitios renderiza featured + list correctamente.
- Flow completo de borrado: click `⋯` → "Borrar" → modal → input slug → confirmar → mock API 200 → re-fetch → dashboard muestra 1 sitio.

**E2E (Playwright, ticket aparte si CI lo requiere)**:
- Signup nuevo con artista X → dashboard con X único.
- Click "+ Nuevo sitio" → onboarding → crear Y → dashboard con Y featured y X en la lista.
- Topbar dropdown: switch entre X e Y, editor cambia correctamente.
- Borrar X desde dashboard → vuelve solo Y.

**Tests que se modifican (regresión)**:
- `app/studio/__tests__/studio-top-bar.test.tsx` — update para nuevos props (`currentArtist`, `otherArtists`) y asserts del dropdown.
- `lib/onboarding/__tests__/artist-onboarding.test.ts` — tests que esperaban 409 en segundo signup para el mismo user: actualizar a "ambas vuelven ok".
- `app/__tests__/home-page.test.tsx` — update si asume `/studio` es editor directo.

## 7 · Riesgos y fuera de scope

**Riesgos técnicos**:
- **Autorización rota**: `getArtistBySlugAndUserId` tiene que filtrar por AND owner_user_id, nunca solo por slug. Unit test explícito.
- **DELETE cascade**: ya está en el schema (`works`, `newsletter_subscribers`, `ai_daily_usage`, `ai_logs` cascadean por FK). Verificar con integration test.
- **Imágenes huérfanas tras DELETE**: aceptable; script de cleanup fuera de scope.
- **File adapter (dev)**: no cubre multi-sitio. Documentar limitación.
- **Race al duplicar slug**: PK sirve como barrera; 23505 → 409 claro.
- **State desync**: tabs con sitio ya borrado → `notFound()` en el editor.
- **Vercel cache**: `force-dynamic` + `fetchCache = 'force-no-store'` + `revalidate = 0` en `/studio/*`.

**Riesgos UX**:
- User con >20 sitios: lista densa aguanta pero no es ideal. Paginación — otro spec si aparece.
- "← Mis sitios" vs wordmark: redundancia intencional pedida.

**Fuera de scope**:
- Junction `user_artists` (Opción B del brainstorming). Spec aparte cuando aparezca demanda.
- Duplicar sitio. Descartado.
- Soft delete / archivar. Hard delete en este spec.
- Buscador/filtro de sitios.
- Ordenar por otro criterio.
- Exportar sitio (backup JSON).
- Analytics por sitio.
- Billing / planes / límites por tier.
- Specs separados del bundle original: **C (editor estilo granular)**, **D (sección carrusel)**.
