import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals'
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
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

  it('permite agregar un módulo, editar su contenido en el inspector y verlo en el lienzo', () => {
    render(<EditorClient initialConfig={defaultSiteConfig} artistSlug="luna-vega" works={[]} />)

    fireEvent.click(screen.getByRole('button', { name: 'Agregar Encargos / CTA' }))

    const preview = screen.getByTestId('preview-frame')
    expect(within(preview).getByText('¿Buscas una obra a medida?')).toBeTruthy()

    const titleInput = screen.getByDisplayValue('¿Buscas una obra a medida?')
    fireEvent.change(titleInput, { target: { value: 'Encargos personalizados 2026' } })

    expect(within(preview).getByText('Encargos personalizados 2026')).toBeTruthy()
  })

  it('permite deshacer y rehacer cambios desde la barra superior', () => {
    render(<EditorClient initialConfig={defaultSiteConfig} artistSlug="luna-vega" works={[]} />)

    const undoBtn = screen.getByRole('button', { name: 'Deshacer' }) as HTMLButtonElement
    const redoBtn = screen.getByRole('button', { name: 'Rehacer' }) as HTMLButtonElement
    expect(undoBtn.disabled).toBe(true)
    expect(redoBtn.disabled).toBe(true)

    const siteTitleInput = screen.getByDisplayValue(defaultSiteConfig.identity.siteTitle)
    fireEvent.change(siteTitleInput, { target: { value: 'Nuevo Título Studio' } })

    const preview = screen.getByTestId('preview-frame')
    expect(within(preview).getByRole('heading', { level: 1 }).textContent).toBe('Nuevo Título Studio')
    expect(undoBtn.disabled).toBe(false)

    fireEvent.click(undoBtn)
    expect(within(preview).getByRole('heading', { level: 1 }).textContent).toBe(
      defaultSiteConfig.identity.siteTitle
    )
    expect(redoBtn.disabled).toBe(false)

    fireEvent.click(redoBtn)
    expect(within(preview).getByRole('heading', { level: 1 }).textContent).toBe('Nuevo Título Studio')
  })

  it('permite cambiar a la pestaña Diseño y aplicar un preset curatorial', () => {
    render(<EditorClient initialConfig={defaultSiteConfig} artistSlug="luna-vega" works={[]} />)

    fireEvent.click(screen.getByRole('button', { name: 'Diseño' }))
    fireEvent.click(screen.getByRole('button', { name: /Noche Inmersiva/i }))

    const templateSelect = screen.getByLabelText('Template') as HTMLSelectElement
    expect(templateSelect.value).toBe('immersive')
  })

  it('permite abrir los inspectores de Header y Barra de anuncios', () => {
    render(<EditorClient initialConfig={defaultSiteConfig} artistSlug="luna-vega" works={[]} />)

    fireEvent.click(screen.getByRole('button', { name: /Header/i }))
    expect(screen.getByText('Encabezado (Header)')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: '← Sitio' }))

    fireEvent.click(screen.getByRole('button', { name: /Anuncios/i }))
    expect(screen.getByText('Barra de anuncios superior')).toBeTruthy()
  })

  it('permite agregar una Cinta animada y aplicar el preset Pop Studio', () => {
    render(<EditorClient initialConfig={defaultSiteConfig} artistSlug="luna-vega" works={[]} />)

    fireEvent.click(screen.getByRole('button', { name: 'Agregar Cinta animada' }))
    const preview = screen.getByTestId('preview-frame')
    expect(within(preview).getAllByText('OBRAS ORIGINALES').length).toBeGreaterThan(0)

    fireEvent.click(screen.getByRole('button', { name: 'Diseño' }))
    fireEvent.click(screen.getByRole('button', { name: /Pop Studio/i }))
    expect(within(preview).getByText('NUEVA COLECCIÓN DISPONIBLE')).toBeTruthy()
  })
})
