import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import EditorClient from '@/app/editor/[token]/EditorClient'
import { defaultSiteConfig } from '@/lib/schemas/site-config.schema'

type FetchArgs = [input: RequestInfo | URL, init?: RequestInit]

function mockFetchOk(): jest.Mock {
  const fn = jest.fn(async () => ({
    ok: true,
    status: 200,
    json: async () => ({ ok: true }),
  })) as unknown as jest.Mock
  return fn
}

describe('EditorClient', () => {
  const originalFetch = global.fetch

  beforeEach(() => {
    const mock = mockFetchOk()
    global.fetch = mock as unknown as typeof fetch
  })

  afterEach(() => {
    global.fetch = originalFetch
    jest.clearAllMocks()
  })

  it('renderiza ControlPanel y PreviewFrame con la configuración inicial', () => {
    render(<EditorClient initialConfig={defaultSiteConfig} artistSlug="luna-vega" works={[]} />)

    expect(screen.getByTestId('editor-root')).toBeTruthy()
    expect(screen.getByTestId('preview-frame')).toBeTruthy()
    expect(screen.getByDisplayValue(defaultSiteConfig.identity.siteTitle)).toBeTruthy()
    expect(screen.getByRole('button', { name: /guardar borrador/i })).toBeTruthy()
    expect(screen.getByRole('button', { name: /publicar/i })).toBeTruthy()
  })

  it('al hacer click en "Guardar borrador" llama a /api/draft con el slug y config', async () => {
    render(<EditorClient initialConfig={defaultSiteConfig} artistSlug="luna-vega" works={[]} />)

    fireEvent.click(screen.getByRole('button', { name: /guardar borrador/i }))

    const fetchMock = global.fetch as unknown as jest.Mock
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1))

    const [url, init] = fetchMock.mock.calls[0] as FetchArgs
    expect(url).toBe('/api/draft')
    expect(init?.method).toBe('POST')
    const body = JSON.parse(String(init?.body)) as { artistSlug: string; config: unknown }
    expect(body.artistSlug).toBe('luna-vega')
    expect(body.config).toEqual(defaultSiteConfig)
  })

  it('al hacer click en "Publicar" llama a /api/publish', async () => {
    render(<EditorClient initialConfig={defaultSiteConfig} artistSlug="marco-torres" works={[]} />)

    fireEvent.click(screen.getByRole('button', { name: /publicar/i }))

    const fetchMock = global.fetch as unknown as jest.Mock
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1))

    const [url, init] = fetchMock.mock.calls[0] as FetchArgs
    expect(url).toBe('/api/publish')
    expect(init?.method).toBe('POST')
    const body = JSON.parse(String(init?.body)) as { artistSlug: string }
    expect(body.artistSlug).toBe('marco-torres')
  })
})
