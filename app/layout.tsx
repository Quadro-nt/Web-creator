import type { Metadata } from 'next'
import type { CSSProperties } from 'react'
import { defaultSiteConfig } from '@/lib/schemas/site-config.schema'
import { cssVarMap } from '@/lib/tokens/css-vars'
import './globals.css'

export const metadata: Metadata = {
  title: 'Quadro Sites',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const vars = cssVarMap(defaultSiteConfig)
  return (
    <html lang="es" style={vars as CSSProperties}>
      <body>{children}</body>
    </html>
  )
}
