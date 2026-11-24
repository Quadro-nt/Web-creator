import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import EditorClient from '@/app/editor/[token]/EditorClient'
import { SESSION_SENTINEL_TOKEN, getSessionUserFromCookies } from '@/lib/auth/session'
import { getArtistByUserId } from '@/lib/onboarding/artist-onboarding'
import { defaultSiteConfig } from '@/lib/schemas/site-config.schema'
import { getStorageAdapter } from '@/lib/storage'
import { getWorksRepository } from '@/lib/works/repository'
import StudioTopBar from './StudioTopBar'

export const dynamic = 'force-dynamic'

/** Authenticated artist studio page wrapping EditorClient with StudioTopBar. */
export default async function StudioPage() {
  const cookieStore = cookies()
  const user = await getSessionUserFromCookies(cookieStore)

  if (!user) {
    redirect('/login')
  }

  const artist = await getArtistByUserId(user.id)

  if (!artist) {
    redirect('/onboarding')
  }

  const storage = getStorageAdapter()
  const worksRepo = getWorksRepository()
  const [draft, published, works] = await Promise.all([
    storage.getDraft(artist.slug),
    storage.getPublished(artist.slug),
    worksRepo.getWorks(artist.slug),
  ])
  const config = draft ?? published ?? defaultSiteConfig

  return (
    <>
      <StudioTopBar
        artistSlug={artist.slug}
        displayName={artist.displayName}
        userEmail={user.email}
      />
      <EditorClient
        initialConfig={config}
        publishedConfig={published}
        artistSlug={artist.slug}
        editorToken={SESSION_SENTINEL_TOKEN}
        works={works}
      />
    </>
  )
}
