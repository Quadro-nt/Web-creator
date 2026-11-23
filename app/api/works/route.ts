import { NextResponse } from 'next/server'
import { z } from 'zod'
import { WorksFileSchema } from '@/lib/schemas/works.schema'
import { createFileWorksAdapter } from '@/lib/works/file-adapter'
import { verifyEditorRequest } from '@/lib/auth/verify-api-request'

const PostBodySchema = z.object({
  artistSlug: z.string().min(1),
  works: z.unknown(),
})

export async function GET(request: Request) {
  const url = new URL(request.url)
  const expectedSlug = url.searchParams.get('artistSlug') ?? undefined

  const auth = await verifyEditorRequest(request, expectedSlug)
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const repo = createFileWorksAdapter()
  const works = await repo.getWorks(auth.artistSlug)
  return NextResponse.json({ works })
}

export async function POST(request: Request) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
  }

  const parsed = PostBodySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'artistSlug y works requeridos' }, { status: 400 })
  }

  const auth = await verifyEditorRequest(request, parsed.data.artistSlug)
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const validated = WorksFileSchema.safeParse({
    artistSlug: auth.artistSlug,
    works: parsed.data.works,
  })
  if (!validated.success) {
    return NextResponse.json(
      { error: 'Catálogo de obras inválido', issues: validated.error.issues },
      { status: 400 }
    )
  }

  const repo = createFileWorksAdapter()
  await repo.saveWorks(auth.artistSlug, validated.data.works)
  return NextResponse.json({ ok: true, works: validated.data.works })
}
