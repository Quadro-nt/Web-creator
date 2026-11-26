import type { AnchorHTMLAttributes, ReactNode } from 'react'
import { resolveSiteHref, isExternalHref } from '@/lib/templates/resolve-href'

type Props = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> & {
  href: string
  artistSlug: string
  children: ReactNode
}

/** Anchor that resolves internal paths to /sites/<slug>/... and adds safe target for external. */
export default function SafeLink({ href, artistSlug, children, ...rest }: Props) {
  const resolved = resolveSiteHref(href, artistSlug)
  const external = isExternalHref(href)
  return (
    <a
      {...rest}
      href={resolved}
      {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
    >
      {children}
    </a>
  )
}
