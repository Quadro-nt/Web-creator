import { describe, it, expect, jest, beforeAll, beforeEach } from '@jest/globals'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import type { ComponentType } from 'react'
import type { StudioTopBarProps } from '../StudioTopBar'

const mockPush = jest.fn()
const mockRefresh = jest.fn()

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    refresh: mockRefresh,
  }),
}))

let StudioTopBar: ComponentType<StudioTopBarProps>

beforeAll(async () => {
  const mod = await import('../StudioTopBar')
  StudioTopBar = mod.default
})

describe('StudioTopBar', () => {
  const mockFetch = jest.fn<typeof fetch>()

  beforeEach(() => {
    mockPush.mockReset()
    mockRefresh.mockReset()
    mockFetch.mockReset()
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ ok: true }),
    } as Response)
    global.fetch = mockFetch
  })

  it('renders brand link, artist subdomain pill, display name, public link, and user email', () => {
    render(
      <StudioTopBar
        artistSlug="luna-vega"
        displayName="Luna Vega"
        userEmail="luna@example.com"
      />
    )

    const brandLink = screen.getByRole('link', { name: 'QUADRO STUDIO' })
    expect(brandLink.getAttribute('href')).toBe('/')

    expect(screen.getByText('Luna Vega')).toBeTruthy()
    expect(screen.getByText('luna-vega.quadro-nt.com')).toBeTruthy()

    const publicLink = screen.getByRole('link', { name: 'Ver sitio público ↗' })
    expect(publicLink.getAttribute('href')).toBe('/sites/luna-vega')
    expect(publicLink.getAttribute('target')).toBe('_blank')
    expect(publicLink.getAttribute('rel')).toBe('noopener noreferrer')

    expect(screen.getByText('luna@example.com')).toBeTruthy()
  })

  it('renders subdomain without display name when displayName is null', () => {
    render(
      <StudioTopBar
        artistSlug="marco-torres"
        displayName={null}
        userEmail="marco@example.com"
      />
    )

    expect(screen.getByText('marco-torres.quadro-nt.com')).toBeTruthy()
    expect(screen.getByText('marco@example.com')).toBeTruthy()
  })

  it('calls POST /api/auth/logout and redirects to /login when clicking Cerrar sesión', async () => {
    render(
      <StudioTopBar
        artistSlug="sofia-rios"
        displayName="Sofía Ríos"
        userEmail="sofia@example.com"
      />
    )

    fireEvent.click(screen.getByRole('button', { name: 'Cerrar sesión' }))

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/auth/logout', { method: 'POST' })
      expect(mockPush).toHaveBeenCalledWith('/login')
      expect(mockRefresh).toHaveBeenCalledTimes(1)
    })
  })
})
