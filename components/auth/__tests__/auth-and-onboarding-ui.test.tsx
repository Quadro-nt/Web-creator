import '@testing-library/jest-dom/jest-globals'
import {
  describe,
  it,
  expect,
  jest,
  beforeAll,
  beforeEach,
  afterEach,
} from '@jest/globals'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'

const mockPush = jest.fn()
const mockRefresh = jest.fn()

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    refresh: mockRefresh,
  }),
}))

let AuthFormCard: typeof import('@/components/auth/AuthFormCard').AuthFormCard
let OnboardingForm: typeof import('@/app/onboarding/OnboardingForm').OnboardingForm

beforeAll(async () => {
  ;({ AuthFormCard } = await import('@/components/auth/AuthFormCard'))
  ;({ OnboardingForm } = await import('@/app/onboarding/OnboardingForm'))
})

function createJsonResponse(body: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  } as Response
}

describe('AuthFormCard', () => {
  const originalFetch = global.fetch

  beforeEach(() => {
    mockPush.mockReset()
    mockRefresh.mockReset()
    global.fetch = jest.fn() as unknown as typeof fetch
  })

  afterEach(() => {
    global.fetch = originalFetch
  })

  it('renders Google OAuth link and translates oauth_unavailable initialError in login mode', () => {
    render(<AuthFormCard mode="login" initialError="oauth_unavailable" />)

    const googleLink = screen.getByRole('link', { name: /continuar con google/i })
    expect(googleLink).toHaveAttribute('href', '/api/auth/oauth/google')
    expect(screen.getByRole('alert')).toHaveTextContent(
      'El inicio con Google no está activo en este entorno. Usa tu correo y contraseña.'
    )
    expect(screen.getByText(/o con tu correo/i)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /volver al inicio/i })).toHaveAttribute('href', '/')
  })

  it('translates missing_code initialError', () => {
    render(<AuthFormCard mode="login" initialError="missing_code" />)

    expect(screen.getByRole('alert')).toHaveTextContent(
      'No pudimos completar el acceso con Google. Inténtalo nuevamente.'
    )
  })

  it('submits login credentials and redirects on success', async () => {
    const fetchMock = global.fetch as jest.MockedFunction<typeof fetch>
    fetchMock.mockResolvedValueOnce(
      createJsonResponse({ ok: true, redirectTo: '/studio' })
    )

    render(<AuthFormCard mode="login" />)

    fireEvent.change(screen.getByLabelText(/correo electrónico/i), {
      target: { value: 'valeria@estudio.com' },
    })
    fireEvent.change(screen.getByLabelText(/contraseña/i), {
      target: { value: 'secreto123' },
    })
    fireEvent.click(screen.getByRole('button', { name: /iniciar sesión/i }))

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/auth/login',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: 'valeria@estudio.com',
            password: 'secreto123',
          }),
        })
      )
      expect(mockPush).toHaveBeenCalledWith('/studio')
      expect(mockRefresh).toHaveBeenCalled()
    })
  })

  it('shows API error message when login fails', async () => {
    const fetchMock = global.fetch as jest.MockedFunction<typeof fetch>
    fetchMock.mockResolvedValueOnce(
      createJsonResponse({ ok: false, error: 'Email o contraseña incorrectos.' }, 401)
    )

    render(<AuthFormCard mode="login" />)

    fireEvent.change(screen.getByLabelText(/correo electrónico/i), {
      target: { value: 'valeria@estudio.com' },
    })
    fireEvent.change(screen.getByLabelText(/contraseña/i), {
      target: { value: 'incorrecta' },
    })
    fireEvent.click(screen.getByRole('button', { name: /iniciar sesión/i }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Email o contraseña incorrectos.'
    )
    expect(mockPush).not.toHaveBeenCalled()
  })

  it('includes template in Google OAuth link and shows email confirmation banner on signup', async () => {
    const fetchMock = global.fetch as jest.MockedFunction<typeof fetch>
    fetchMock.mockResolvedValueOnce(
      createJsonResponse({ ok: true, needsEmailConfirmation: true })
    )

    render(<AuthFormCard mode="signup" initialTemplate="editorial" />)

    const googleLink = screen.getByRole('link', { name: /continuar con google/i })
    expect(googleLink).toHaveAttribute(
      'href',
      '/api/auth/oauth/google?template=editorial'
    )

    fireEvent.change(screen.getByLabelText(/correo electrónico/i), {
      target: { value: 'nueva@artista.com' },
    })
    fireEvent.change(screen.getByLabelText(/contraseña/i), {
      target: { value: 'clave-segura-8' },
    })
    fireEvent.click(screen.getByRole('button', { name: /crear cuenta/i }))

    expect(await screen.findByRole('status')).toHaveTextContent(/revisa tu correo/i)
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/auth/signup',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          email: 'nueva@artista.com',
          password: 'clave-segura-8',
          template: 'editorial',
        }),
      })
    )
    expect(mockPush).not.toHaveBeenCalled()
  })

  it('validates minimum 8 characters before calling signup API', async () => {
    const fetchMock = global.fetch as jest.MockedFunction<typeof fetch>

    render(<AuthFormCard mode="signup" />)

    fireEvent.change(screen.getByLabelText(/correo electrónico/i), {
      target: { value: 'nueva@artista.com' },
    })
    fireEvent.change(screen.getByLabelText(/contraseña/i), {
      target: { value: '1234567' },
    })
    fireEvent.click(screen.getByRole('button', { name: /crear cuenta/i }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'La contraseña debe tener al menos 8 caracteres.'
    )
    expect(fetchMock).not.toHaveBeenCalled()
  })
})

describe('OnboardingForm', () => {
  const originalFetch = global.fetch

  beforeEach(() => {
    jest.useFakeTimers()
    mockPush.mockReset()
    mockRefresh.mockReset()
    global.fetch = jest.fn() as unknown as typeof fetch
  })

  afterEach(() => {
    jest.useRealTimers()
    global.fetch = originalFetch
  })

  it('auto-generates slug from displayName and checks availability with debounce', async () => {
    const fetchMock = global.fetch as jest.MockedFunction<typeof fetch>
    fetchMock.mockResolvedValueOnce(
      createJsonResponse({ available: true, normalizedSlug: 'valeria-montes' })
    )

    render(<OnboardingForm userEmail="valeria@estudio.com" />)

    const nameInput = screen.getByLabelText(/nombre artístico/i)
    const slugInput = screen.getByLabelText(/dirección de tu web/i) as HTMLInputElement

    fireEvent.change(nameInput, { target: { value: 'Valeria Montes' } })
    expect(slugInput.value).toBe('valeria-montes')
    expect(screen.getByText(/verificando\.\.\./i)).toBeInTheDocument()

    await act(async () => {
      jest.advanceTimersByTime(350)
    })

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/onboarding?slug=valeria-montes',
        expect.objectContaining({ signal: expect.any(AbortSignal) })
      )
      expect(screen.getByText(/disponible ✓/i)).toBeInTheDocument()
    })

    // Once manually edited, changing displayName no longer overwrites slug
    fetchMock.mockResolvedValueOnce(
      createJsonResponse({
        available: false,
        normalizedSlug: 'estudio-vm',
        reason: 'Este subdominio ya está en uso.',
      })
    )

    fireEvent.change(slugInput, { target: { value: 'estudio-vm' } })
    fireEvent.change(nameInput, { target: { value: 'Valeria Montes Taller' } })
    expect(slugInput.value).toBe('estudio-vm')

    await act(async () => {
      jest.advanceTimersByTime(350)
    })

    await waitFor(() => {
      expect(screen.getByText(/no disponible/i)).toBeInTheDocument()
    })
  })

  it('selects template, submits POST /api/onboarding and redirects to /studio', async () => {
    const fetchMock = global.fetch as jest.MockedFunction<typeof fetch>
    fetchMock
      .mockResolvedValueOnce(
        createJsonResponse({ available: true, normalizedSlug: 'valeria-montes' })
      )
      .mockResolvedValueOnce(
        createJsonResponse({ ok: true, slug: 'valeria-montes', redirectTo: '/studio' }, 201)
      )

    render(
      <OnboardingForm
        userEmail="valeria@estudio.com"
        initialTemplate="minimal-gallery"
      />
    )

    fireEvent.change(screen.getByLabelText(/nombre artístico/i), {
      target: { value: 'Valeria Montes' },
    })

    await act(async () => {
      jest.advanceTimersByTime(350)
    })

    fireEvent.change(screen.getByLabelText(/whatsapp/i), {
      target: { value: '+51 999-000-000' },
    })
    expect((screen.getByLabelText(/whatsapp/i) as HTMLInputElement).value).toBe(
      '51999000000'
    )

    const editorialButton = screen.getByRole('button', { name: /editorial/i })
    fireEvent.click(editorialButton)
    expect(editorialButton).toHaveAttribute('aria-pressed', 'true')

    fireEvent.click(screen.getByRole('button', { name: /crear mi sitio/i }))

    await waitFor(() => {
      expect(fetchMock).toHaveBeenLastCalledWith(
        '/api/onboarding',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            displayName: 'Valeria Montes',
            slug: 'valeria-montes',
            template: 'editorial',
            whatsappNumber: '51999000000',
          }),
        })
      )
      expect(mockPush).toHaveBeenCalledWith('/studio')
      expect(mockRefresh).toHaveBeenCalled()
    })
  })

  it('logs out and redirects to /login when clicking Cerrar sesión', async () => {
    const fetchMock = global.fetch as jest.MockedFunction<typeof fetch>
    fetchMock.mockResolvedValueOnce(createJsonResponse({ ok: true }))

    render(<OnboardingForm userEmail="valeria@estudio.com" />)

    fireEvent.click(screen.getByRole('button', { name: /cerrar sesión/i }))

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith('/api/auth/logout', { method: 'POST' })
      expect(mockPush).toHaveBeenCalledWith('/login')
      expect(mockRefresh).toHaveBeenCalled()
    })
  })
})
