import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const rawHost = request.headers.get('host') || ''
  const hostname = rawHost.split(':')[0]
  const productionDomain = '.quadro-nt.com'
  const devDomain = '.localhost'

  if (hostname.endsWith(productionDomain)) {
    const subdomain = hostname.replace(productionDomain, '')
    const url = request.nextUrl.clone()
    url.pathname = `/sites/${subdomain}${url.pathname}`
    return NextResponse.rewrite(url)
  }

  if (hostname.endsWith(devDomain)) {
    const subdomain = hostname.split(devDomain)[0]
    const url = request.nextUrl.clone()
    url.pathname = `/sites/${subdomain}${url.pathname}`
    return NextResponse.rewrite(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next|api|editor|.*\\.ico|.*\\.png|.*\\.jpg|.*\\.jpeg|.*\\.svg|.*\\.gif|.*\\.webp|.*\\.css|.*\\.js).*)',
  ],
}
