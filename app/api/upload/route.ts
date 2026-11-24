import { NextResponse } from 'next/server'
import { createLocalMediaAdapter, MAX_MEDIA_SIZE_BYTES } from '@/lib/media/media-adapter'
import { verifyEditorRequest } from '@/lib/auth/verify-api-request'

export async function GET(request: Request) {
  const url = new URL(request.url)
  const expectedSlug = url.searchParams.get('artistSlug') ?? undefined

  const auth = await verifyEditorRequest(request, expectedSlug)
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const media = createLocalMediaAdapter()
  const items = await media.list(auth.artistSlug)
  return NextResponse.json({ items })
}

export async function POST(request: Request) {
  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return NextResponse.json({ error: 'Se esperaba multipart/form-data' }, { status: 400 })
  }

  const artistSlugRaw = formData.get('artistSlug')
  const expectedSlug = typeof artistSlugRaw === 'string' && artistSlugRaw.trim() ? artistSlugRaw.trim() : undefined

  const auth = await verifyEditorRequest(request, expectedSlug)
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const file = formData.get('file')
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'Archivo requerido en el campo "file"' }, { status: 400 })
  }

  if (file.size === 0) {
    return NextResponse.json({ error: 'El archivo está vacío' }, { status: 400 })
  }
  if (file.size > MAX_MEDIA_SIZE_BYTES) {
    return NextResponse.json({ error: 'La imagen supera el máximo de 5 MB' }, { status: 400 })
  }

  const media = createLocalMediaAdapter()
  try {
    const buffer = Buffer.from(await file.arrayBuffer())
    const item = await media.save(auth.artistSlug, file.name, file.type, buffer)
    return NextResponse.json({ ok: true, item })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error al guardar la imagen'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
