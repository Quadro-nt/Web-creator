import { NextResponse } from 'next/server'
import { z } from 'zod'
import { SiteConfigSchema } from '@/lib/schemas/site-config.schema'
import { createFileAdapter } from '@/lib/storage'
import { verifyEditorRequest } from '@/lib/auth/verify-api-request'

const BodySchema = z.object({
  artistSlug: z.string().min(1),
  config: z.unknown(),
})

export async function POST(request: Request) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
  }

  const parsed = BodySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'artistSlug requerido' }, { status: 400 })
  }

  const auth = await verifyEditorRequest(request, parsed.data.artistSlug)
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const configResult = SiteConfigSchema.safeParse(parsed.data.config)
  if (!configResult.success) {
    return NextResponse.json(
      { error: 'Configuración inválida', issues: configResult.error.issues },
      { status: 400 }
    )
  }

  const storage = createFileAdapter()
  await storage.saveDraft(auth.artistSlug, configResult.data)
  await storage.publish(auth.artistSlug)
  return NextResponse.json({ ok: true })
}
