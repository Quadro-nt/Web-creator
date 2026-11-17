import type { Artwork } from '@/lib/schemas/works.schema'
import { Button } from './Button'

type Props = {
  artwork: Artwork
  artistSlug: string
}

export function BuyButton({ artwork, artistSlug }: Props) {
  if (artwork.sold) return null

  const number = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER
  if (!number) return null

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? ''
  const message = `Hola, me interesa la obra '${artwork.title}' (${artwork.year}) de ${artistSlug}. Mas info en: ${baseUrl}/obras/${artwork.slug}`
  const url = `https://wa.me/${number}?text=${encodeURIComponent(message)}`

  return (
    <Button href={url} shape="pill" style="filled">
      Comprar via WhatsApp
    </Button>
  )
}
