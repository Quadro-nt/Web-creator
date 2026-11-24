import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const APP_SUBDOMAINS = new Set(['www', 'app'])

function rewriteSubdomain(request: NextRequest, subdomain: string): NextResponse {
  if (APP_SUBDOMAINS.has(subdomain.toLowerCase())) {
    return NextResponse.next()
  }
  const url = request.nextUrl.clone()
  if (url.pathname.startsWith('/sites/')) {
    return NextResponse.next()
  }
  url.pathname = `/sites/${subdomain}${url.pathname}`
  return NextResponse.rewrite(url)
}

export function middleware(request: NextRequest) {
  const rawHost = request.headers.get('host') || ''
  const hostname = rawHost.split(':')[0]
  const productionDomain = '.quadro-nt.com'
  const devDomain = '.localhost'

  if (hostname.endsWith(productionDomain)) {
    const subdomain = hostname.replace(productionDomain, '')
    return rewriteSubdomain(request, subdomain)
  }

  if (hostname.endsWith(devDomain)) {
    const subdomain = hostname.split(devDomain)[0]
    return rewriteSubdomain(request, subdomain)
  }

  const url = request.nextUrl.clone()
  if (url.pathname.startsWith('/obras/')) {
    const referer = request.headers.get('referer')
    if (referer) {
      try {
        const refPath = new URL(referer, request.url).pathname
        const match = refPath.match(/^\/sites\/([a-z0-9-]+)(?:\/|$)/)
        if (match) {
          url.pathname = `/sites/${match[1]}${url.pathname}`
          return NextResponse.rewrite(url)
        }
      } catch {
        // Ignore malformed referer header
      }
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next|api|editor|studio|login|signup|onboarding|.*\\.ico|.*\\.png|.*\\.jpg|.*\\.jpeg|.*\\.svg|.*\\.gif|.*\\.webp|.*\\.css|.*\\.js).*)',
  ],
}
