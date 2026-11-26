import type { PageConfig, SiteConfig, SectionConfig } from '@/lib/schemas/site-config.schema'
import { createUniqueSectionId } from './useConfigHistory'

function cloneSectionsWithNewIds(sections: SectionConfig[]): SectionConfig[] {
  return sections.map((s) => ({
    ...s,
    id: createUniqueSectionId(s.type),
    content: JSON.parse(JSON.stringify(s.content)),
  }))
}

export function addPage(
  config: SiteConfig,
  input: { title: string; slug: string; showInNav?: boolean; copyFromSlug?: string }
): SiteConfig {
  const pages = config.pages ?? []
  if (pages.some((p) => p.slug === input.slug)) {
    throw new Error(`ya existe una página con slug "${input.slug}"`)
  }
  const copyFrom = input.copyFromSlug
    ? pages.find((p) => p.slug === input.copyFromSlug)
    : undefined
  const newPage: PageConfig = {
    slug: input.slug,
    title: input.title,
    isHome: false,
    showInNav: input.showInNav ?? true,
    sections: copyFrom ? cloneSectionsWithNewIds(copyFrom.sections) : [],
  }
  return { ...config, pages: [...pages, newPage] }
}

export function deletePage(config: SiteConfig, slug: string): SiteConfig {
  const pages = config.pages ?? []
  const target = pages.find((p) => p.slug === slug)
  if (!target) throw new Error(`La página "${slug}" no existe`)
  if (target.isHome)
    throw new Error('No se puede borrar la página home. Marcá otra como home primero.')
  return { ...config, pages: pages.filter((p) => p.slug !== slug) }
}

export function setHomePage(config: SiteConfig, slug: string): SiteConfig {
  const pages = config.pages ?? []
  if (!pages.some((p) => p.slug === slug)) {
    throw new Error(`La página "${slug}" no existe`)
  }
  return {
    ...config,
    pages: pages.map((p) => ({ ...p, isHome: p.slug === slug })),
  }
}

export function movePage(config: SiteConfig, from: number, to: number): SiteConfig {
  if (from === to) return config
  const pages = [...(config.pages ?? [])]
  const [moved] = pages.splice(from, 1)
  pages.splice(to, 0, moved)
  return { ...config, pages }
}

export function duplicatePage(config: SiteConfig, slug: string): SiteConfig {
  const pages = config.pages ?? []
  const source = pages.find((p) => p.slug === slug)
  if (!source) throw new Error(`La página "${slug}" no existe`)
  let candidate = `${slug}-copy`
  let i = 2
  while (pages.some((p) => p.slug === candidate)) {
    candidate = `${slug}-copy-${i}`
    i += 1
  }
  const copy: PageConfig = {
    ...source,
    slug: candidate,
    title: `${source.title} (copia)`,
    isHome: false,
    sections: cloneSectionsWithNewIds(source.sections),
  }
  return { ...config, pages: [...pages, copy] }
}

export function renamePage(
  config: SiteConfig,
  currentSlug: string,
  updates: { title: string; slug: string; showInNav: boolean; navLabel?: string }
): SiteConfig {
  const pages = config.pages ?? []
  if (updates.slug !== currentSlug && pages.some((p) => p.slug === updates.slug)) {
    throw new Error(`ya existe una página con slug "${updates.slug}"`)
  }
  return {
    ...config,
    pages: pages.map((p) =>
      p.slug === currentSlug
        ? {
            ...p,
            slug: updates.slug,
            title: updates.title,
            showInNav: updates.showInNav,
            ...(updates.navLabel !== undefined ? { navLabel: updates.navLabel } : {}),
          }
        : p
    ),
  }
}
