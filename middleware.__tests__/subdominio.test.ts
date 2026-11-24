/**
 * @jest-environment node
 */
import { describe, it, expect } from '@jest/globals'
import { NextRequest } from 'next/server'
import { middleware, config } from '../middleware'

function makeReq(urlStr: string, host: string, referer?: string): NextRequest {
  const headers: Record<string, string> = { host }
  if (referer) {
    headers.referer = referer
  }
  return new NextRequest(urlStr, { headers })
}

describe('middleware — subdomain resolution', () => {
  it('request to localhost/_sites/luna-vega does not rewrite (host is not quadro-nt.com)', () => {
    const res = middleware(makeReq('http://localhost:3000/_sites/luna-vega', 'localhost:3000'))
    expect(res.headers.get('x-middleware-rewrite')).toBeNull()
  })

  it('request to luna-vega.quadro-nt.com/ rewrites to /sites/luna-vega/', () => {
    const res = middleware(makeReq('http://luna-vega.quadro-nt.com/', 'luna-vega.quadro-nt.com'))
    const dest = res.headers.get('x-middleware-rewrite')
    expect(dest).not.toBeNull()
    expect(new URL(dest!).pathname).toMatch(/^\/sites\/luna-vega\/?$/)
  })

  it('request to luna-vega.quadro-nt.com/obras/formas-01 rewrites correctly', () => {
    const res = middleware(
      makeReq('http://luna-vega.quadro-nt.com/obras/formas-01', 'luna-vega.quadro-nt.com'),
    )
    const dest = res.headers.get('x-middleware-rewrite')
    expect(dest).not.toBeNull()
    expect(new URL(dest!).pathname).toBe('/sites/luna-vega/obras/formas-01')
  })

  it('request to localhost:3000/editor/token-luna passes without rewriting', () => {
    const res = middleware(
      makeReq('http://localhost:3000/editor/token-luna', 'localhost:3000'),
    )
    expect(res.headers.get('x-middleware-rewrite')).toBeNull()
  })

  it('request to localhost:3000/obras/formas-01 with /sites/luna-vega referer rewrites to /sites/luna-vega/obras/formas-01', () => {
    const res = middleware(
      makeReq(
        'http://localhost:3000/obras/formas-01',
        'localhost:3000',
        'http://localhost:3000/sites/luna-vega',
      ),
    )
    const dest = res.headers.get('x-middleware-rewrite')
    expect(dest).not.toBeNull()
    expect(new URL(dest!).pathname).toBe('/sites/luna-vega/obras/formas-01')
  })

  it('request to localhost:3000/obras/formas-01 without /sites/<artist> referer does not rewrite', () => {
    const res = middleware(
      makeReq('http://localhost:3000/obras/formas-01', 'localhost:3000'),
    )
    expect(res.headers.get('x-middleware-rewrite')).toBeNull()
  })

  it('subdomain request already starting with /sites/ does not duplicate /sites/', () => {
    const prodRes = middleware(
      makeReq(
        'http://luna-vega.quadro-nt.com/sites/luna-vega/obras/formas-01',
        'luna-vega.quadro-nt.com',
      ),
    )
    expect(prodRes.headers.get('x-middleware-rewrite')).toBeNull()

    const devRes = middleware(
      makeReq('http://luna-vega.localhost:3000/sites/luna-vega', 'luna-vega.localhost:3000'),
    )
    expect(devRes.headers.get('x-middleware-rewrite')).toBeNull()
  })

  it('www.quadro-nt.com and app.quadro-nt.com (and .localhost equivalents) do not rewrite to /sites/...', () => {
    for (const host of [
      'www.quadro-nt.com',
      'app.quadro-nt.com',
      'www.localhost:3000',
      'app.localhost:3000',
    ]) {
      const res = middleware(makeReq(`http://${host}/`, host))
      expect(res.headers.get('x-middleware-rewrite')).toBeNull()
    }
  })
})

describe('config.matcher — _next path exclusion', () => {
  it('_next/static and app shell routes are excluded by the matcher pattern', () => {
    const inner = config.matcher[0].replace(/^\/\(/, '').replace(/\)$/, '')
    const regex = new RegExp('^(?:' + inner + ')$')
    expect(regex.test('_next/static/chunk.js')).toBe(false)
    expect(regex.test('studio')).toBe(false)
    expect(regex.test('login')).toBe(false)
    expect(regex.test('signup')).toBe(false)
    expect(regex.test('onboarding')).toBe(false)
  })

  it('regular artist paths are included by the matcher pattern', () => {
    const inner = config.matcher[0].replace(/^\/\(/, '').replace(/\)$/, '')
    const regex = new RegExp('^(?:' + inner + ')$')
    expect(regex.test('luna-vega')).toBe(true)
  })
})
