import { NextResponse } from 'next/server'
import { z } from 'zod'
import { SiteConfigSchema } from '@/lib/schemas/site-config.schema'
import { createFileAdapter } from '@/lib/storage'

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

  const configResult = SiteConfigSchema.safeParse(parsed.data.config)
  if (!configResult.success) {
    return NextResponse.json(
      { error: 'Configuración inválida', issues: configResult.error.issues },
      { status: 400 }
    )
  }

  const storage = createFileAdapter()
  await storage.saveDraft(parsed.data.artistSlug, configResult.data)
  return NextResponse.json({ ok: true })
}
