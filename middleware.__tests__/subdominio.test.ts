/**
 * @jest-environment node
 */
import { describe, it, expect } from '@jest/globals'
import { NextRequest } from 'next/server'
import { middleware, config } from '../middleware'

function makeReq(urlStr: string, host: string): NextRequest {
  return new NextRequest(urlStr, { headers: { host } })
}

describe('middleware — subdomain resolution', () => {
  it('request to localhost/_sites/luna-vega does not rewrite (host is not quadro-nt.com)', () => {
    const res = middleware(makeReq('http://localhost:3000/_sites/luna-vega', 'localhost:3000'))
    expect(res.headers.get('x-middleware-rewrite')).toBeNull()
  })

  it('request to luna-vega.quadro-nt.com/ rewrites to /_sites/luna-vega/', () => {
    const res = middleware(makeReq('http://luna-vega.quadro-nt.com/', 'luna-vega.quadro-nt.com'))
    const dest = res.headers.get('x-middleware-rewrite')
    expect(dest).not.toBeNull()
    expect(new URL(dest!).pathname).toMatch(/^\/_sites\/luna-vega\/?$/)
  })

  it('request to luna-vega.quadro-nt.com/obras/formas-01 rewrites correctly', () => {
    const res = middleware(
      makeReq('http://luna-vega.quadro-nt.com/obras/formas-01', 'luna-vega.quadro-nt.com'),
    )
    const dest = res.headers.get('x-middleware-rewrite')
    expect(dest).not.toBeNull()
    expect(new URL(dest!).pathname).toBe('/_sites/luna-vega/obras/formas-01')
  })

  it('request to localhost:3000/editor/token-luna passes without rewriting', () => {
    const res = middleware(
      makeReq('http://localhost:3000/editor/token-luna', 'localhost:3000'),
    )
    expect(res.headers.get('x-middleware-rewrite')).toBeNull()
  })
})

describe('config.matcher — _next path exclusion', () => {
  it('_next/static paths are excluded by the matcher pattern', () => {
    const inner = config.matcher[0].replace(/^\/\(/, '').replace(/\)$/, '')
    const regex = new RegExp('^(?:' + inner + ')$')
    expect(regex.test('_next/static/chunk.js')).toBe(false)
  })

  it('regular artist paths are included by the matcher pattern', () => {
    const inner = config.matcher[0].replace(/^\/\(/, '').replace(/\)$/, '')
    const regex = new RegExp('^(?:' + inner + ')$')
    expect(regex.test('luna-vega')).toBe(true)
  })
})
