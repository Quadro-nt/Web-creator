import type { Artwork } from '@/lib/schemas/works.schema'
import type { SiteConfig } from '@/lib/schemas/site-config.schema'
import { Button } from './Button'

type Props = {
  artwork: Artwork
  artistSlug: string
  config?: SiteConfig | null
}

function extractDigits(value: unknown): string {
  return typeof value === 'string' ? value.replace(/\D/g, '') : ''
}

function resolveWhatsappNumber(config?: SiteConfig | null): string {
  if (!config) {
    return extractDigits(process.env.NEXT_PUBLIC_WHATSAPP_NUMBER)
  }

  const contactSection = config.pages
    .flatMap((p) => p.sections)
    .find((s) => s.type === 'contact')
  const candidates = [
    config.header?.whatsappNumber,
    config.footer?.whatsapp,
    contactSection?.content?.whatsapp,
    process.env.NEXT_PUBLIC_WHATSAPP_NUMBER,
  ]

  for (const candidate of candidates) {
    const digits = extractDigits(candidate)
    if (digits) return digits
  }

  return ''
}

function buildArtworkUrl(baseUrl: string, artistSlug: string, artworkSlug: string): string {
  if (!baseUrl) {
    return `/obras/${artworkSlug}`
  }
  try {
    const parsed = new URL(baseUrl)
    const host = parsed.hostname.startsWith(`${artistSlug}.`)
      ? parsed.host
      : `${artistSlug}.${parsed.host}`
    return `${parsed.protocol}//${host}/obras/${artworkSlug}`
  } catch {
    return `${baseUrl}/obras/${artworkSlug}`
  }
}

export function BuyButton({ artwork, artistSlug, config }: Props) {
  if (artwork.sold) return null

  const number = resolveWhatsappNumber(config)
  if (!number) return null

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? ''
  const artworkUrl = buildArtworkUrl(baseUrl, artistSlug, artwork.slug)
  const message = `Hola, me interesa la obra '${artwork.title}' (${artwork.year}) de ${artistSlug}. Más info en: ${artworkUrl}`
  const url = `https://wa.me/${number}?text=${encodeURIComponent(message)}`

  const shape = config ? config.button.shape : 'pill'
  const style = config ? config.button.style : 'filled'
  const label = config
    ? artwork.price === undefined
      ? 'Consultar precio'
      : config.button.buyText || 'Comprar vía WhatsApp'
    : 'Comprar vía WhatsApp'

  return (
    <Button href={url} shape={shape} style={style}>
      {label}
    </Button>
  )
}
