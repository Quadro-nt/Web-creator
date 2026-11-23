import { validateEditorToken } from '@/lib/auth/token-validator'
import { createFileAdapter } from '@/lib/storage'
import { createFileWorksAdapter } from '@/lib/works/file-adapter'
import { defaultSiteConfig } from '@/lib/schemas/site-config.schema'
import EditorClient from './EditorClient'

type Props = {
  params: { token: string }
}

export default async function EditorPage({ params }: Props) {
  const slug = await validateEditorToken(params.token)

  if (!slug) {
    return (
      <main style={{ padding: '4rem 2rem', textAlign: 'center' }}>
        <h1 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Acceso denegado</h1>
        <p style={{ opacity: 0.7 }}>El token proporcionado no es válido.</p>
      </main>
    )
  }

  const storage = createFileAdapter()
  const [draft, published] = await Promise.all([
    storage.getDraft(slug),
    storage.getPublished(slug),
  ])
  const config = draft ?? published ?? defaultSiteConfig

  const worksRepo = createFileWorksAdapter()
  const works = await worksRepo.getWorks(slug)

  return (
    <EditorClient
      initialConfig={config}
      publishedConfig={published}
      artistSlug={slug}
      editorToken={params.token}
      works={works}
    />
  )
}
