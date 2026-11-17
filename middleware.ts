import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') || ''
  const productionDomain = '.quadro-nt.com'

  if (hostname.endsWith(productionDomain)) {
    const subdomain = hostname.replace(productionDomain, '')
    const url = request.nextUrl.clone()
    const pathname = url.pathname
    url.pathname = `/_sites/${subdomain}${pathname}`
    return NextResponse.rewrite(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next|api|editor|.*\\.ico|.*\\.png|.*\\.jpg|.*\\.jpeg|.*\\.svg|.*\\.gif|.*\\.webp|.*\\.css|.*\\.js).*)',
  ],
}
