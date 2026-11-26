import { randomBytes } from 'crypto'
import { access, mkdir, writeFile } from 'fs/promises'
import path from 'path'
import { validateNewArtistSlug, normalizeArtistSlug } from '../auth/reserved-slugs'
import { readLocalAuthUsers, writeLocalAuthUsers } from '../auth/session'
import { hashTokenSha256 } from '../auth/token-validator'
import { getStorageBackend, getSupabaseAdminClient } from '../cloud/supabase-client'
import { SiteConfigSchema, type SiteConfig } from '../schemas/site-config.schema'

export type TemplateChoice = 'minimal-gallery' | 'editorial' | 'immersive'

const TEMPLATE_PRESETS: Record<
  TemplateChoice,
  {
    styleTokens: SiteConfig['styleTokens']
    headerLayout: 'left' | 'centered' | 'minimal'
    buttonShape: 'square' | 'rounded' | 'pill'
  }
> = {
  'minimal-gallery': {
    styleTokens: {
      background: '#ffffff',
      text: '#1a1a1a',
      accent: '#b86b35',
      fontPair: 'dm-serif-inter',
      spacing: 'normal',
      artworkTreatment: 'margin',
    },
    headerLayout: 'minimal',
    buttonShape: 'rounded',
  },
  editorial: {
    styleTokens: {
      background: '#faf7f2',
      text: '#1c1917',
      accent: '#9a3412',
      fontPair: 'playfair-raleway',
      spacing: 'spacious',
      artworkTreatment: 'frame',
    },
    headerLayout: 'centered',
    buttonShape: 'square',
  },
  immersive: {
    styleTokens: {
      background: '#111111',
      text: '#f5f3ef',
      accent: '#d4a373',
      fontPair: 'cormorant-jost',
      spacing: 'spacious',
      artworkTreatment: 'bleed',
    },
    headerLayout: 'left',
    buttonShape: 'pill',
  },
}

function getArtistsBaseDir(baseDir?: string): string {
  return baseDir ?? path.join(process.cwd(), 'data', 'artists')
}

function isCloudMode(baseDir?: string): boolean {
  return !baseDir && getStorageBackend() === 'cloud'
}

/** Builds and validates an initial SiteConfig tailored to the chosen template. */
export function buildInitialSiteConfig(params: {
  displayName: string
  template: TemplateChoice
  whatsappNumber?: string
}): SiteConfig {
  const cleanName = params.displayName.trim().slice(0, 80)
  const preset = TEMPLATE_PRESETS[params.template]
  const cleanWhatsapp = params.whatsappNumber?.trim() || undefined

  return SiteConfigSchema.parse({
    template: params.template,
    styleTokens: preset.styleTokens,
    button: {
      shape: preset.buttonShape,
      style: 'filled',
      buyText: 'Consultar precio',
    },
    sizes: {
      typeScale: 'medium',
      artworkSize: 'medium',
      columns: '3',
      contentWidth: 'mid',
    },
    animations: {
      scrollReveal: 'soft',
      hoverEffect: 'info',
      pageTransition: 'fade',
    },
    navigation: {
      type: 'top',
      sticky: true,
    },
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
    identity: {
      siteTitle: cleanName,
    },
  })
}

/** Finds the artist site owned by the given user ID, or null if none exists. */
export async function getArtistByUserId(
  userId: string,
  baseDir?: string
): Promise<{ slug: string; displayName: string | null } | null> {
  if (!userId) return null

  if (isCloudMode(baseDir)) {
    const supabase = getSupabaseAdminClient()
    const { data, error } = await supabase
      .from('artists')
      .select('slug, display_name')
      .eq('owner_user_id', userId)
      .maybeSingle()

    if (error || !data) return null
    return {
      slug: data.slug,
      displayName: (data as { display_name?: string | null }).display_name ?? null,
    }
  }

  const users = await readLocalAuthUsers(baseDir)
  const user = users.find((u) => u.id === userId)
  if (!user || !user.artistSlug) return null
  return {
    slug: user.artistSlug,
    displayName: user.displayName ?? null,
  }
}

/** Validates a candidate slug and checks whether it is available to claim. */
export async function isSlugAvailable(
  rawSlug: string,
  baseDir?: string
): Promise<{ available: boolean; normalizedSlug: string; reason?: string }> {
  const validation = validateNewArtistSlug(rawSlug)
  if (!validation.ok) {
    return {
      available: false,
      normalizedSlug: normalizeArtistSlug(rawSlug),
      reason: validation.error,
    }
  }

  const { slug } = validation

  if (isCloudMode(baseDir)) {
    const supabase = getSupabaseAdminClient()
    const { data, error } = await supabase
      .from('artists')
      .select('slug')
      .eq('slug', slug)
      .maybeSingle()

    if (error) {
      return {
        available: false,
        normalizedSlug: slug,
        reason: 'No se pudo verificar la disponibilidad del subdominio.',
      }
    }

    if (data) {
      return {
        available: false,
        normalizedSlug: slug,
        reason: 'Este subdominio ya está en uso.',
      }
    }

    return { available: true, normalizedSlug: slug }
  }

  const publishedPath = path.join(getArtistsBaseDir(baseDir), slug, 'config.published.json')
  try {
    await access(publishedPath)
    return {
      available: false,
      normalizedSlug: slug,
      reason: 'Este subdominio ya está en uso.',
    }
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
      return { available: true, normalizedSlug: slug }
    }
    throw err
  }
}

/** Creates an initial published site and works store owned by the authenticated user. */
export async function createArtistSiteForUser(
  params: {
    userId: string
    email: string
    displayName: string
    slug: string
    template: TemplateChoice
    whatsappNumber?: string
  },
  baseDir?: string
): Promise<{ ok: true; slug: string; config: SiteConfig } | { ok: false; status: 400 | 409; error: string }> {
  const cleanDisplayName = params.displayName.trim()
  if (!cleanDisplayName) {
    return { ok: false, status: 400, error: 'El nombre artístico es obligatorio.' }
  }

  const slugValidation = validateNewArtistSlug(params.slug)
  if (!slugValidation.ok) {
    return { ok: false, status: 400, error: slugValidation.error }
  }

  const existingSite = await getArtistByUserId(params.userId, baseDir)
  if (existingSite) {
    return {
      ok: false,
      status: 409,
      error: `Ya tienes un sitio creado (${existingSite.slug}).`,
    }
  }

  const availability = await isSlugAvailable(slugValidation.slug, baseDir)
  if (!availability.available) {
    return {
      ok: false,
      status: 409,
      error: availability.reason ?? 'Este subdominio no está disponible.',
    }
  }

  const slug = slugValidation.slug
  const config = buildInitialSiteConfig({
    displayName: cleanDisplayName,
    template: params.template,
    whatsappNumber: params.whatsappNumber,
  })

  if (isCloudMode(baseDir)) {
    const supabase = getSupabaseAdminClient()
    const tokenHash = hashTokenSha256(randomBytes(24).toString('hex'))
    const now = new Date().toISOString()

    const { error: insertError } = await supabase.from('artists').insert({
      slug,
      token_hash: tokenHash,
      owner_user_id: params.userId,
      owner_email: params.email,
      display_name: cleanDisplayName,
      config_published: config,
      config_draft: null,
      updated_at: now,
    })

    if (insertError) {
      const status = insertError.code === '23505' ? 409 : 400
      return {
        ok: false,
        status,
        error:
          status === 409
            ? 'Este subdominio o cuenta ya tiene un sitio registrado.'
            : insertError.message,
      }
    }

    const { error: worksError } = await supabase
      .from('works')
      .upsert({ artist_slug: slug, items: [], updated_at: now }, { onConflict: 'artist_slug' })

    if (worksError) {
      return { ok: false, status: 400, error: worksError.message }
    }

    return { ok: true, slug, config }
  }

  const artistDir = path.join(getArtistsBaseDir(baseDir), slug)
  await mkdir(artistDir, { recursive: true })
  await writeFile(
    path.join(artistDir, 'config.published.json'),
    `${JSON.stringify(config, null, 2)}\n`,
    'utf-8'
  )
  await writeFile(path.join(artistDir, 'works.json'), '[]\n', 'utf-8')

  const users = await readLocalAuthUsers(baseDir)
  const existingUser = users.find((u) => u.id === params.userId)
  if (existingUser) {
    existingUser.artistSlug = slug
    existingUser.displayName = cleanDisplayName
  } else {
    users.push({
      id: params.userId,
      email: params.email,
      passwordHash: '',
      artistSlug: slug,
      displayName: cleanDisplayName,
    })
  }
  await writeLocalAuthUsers(users, baseDir)

  return { ok: true, slug, config }
}
