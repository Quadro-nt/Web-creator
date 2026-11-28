import { describe, it, expect } from '@jest/globals'
import { fireEvent, render, screen } from '@testing-library/react'
import { ImageGallery, parseDimensionsCm } from '../ImageGallery'

describe('parseDimensionsCm', () => {
  it('parses standard "120 x 90 cm" and unicode "80 × 60 cm" formats', () => {
    expect(parseDimensionsCm('120 x 90 cm')).toEqual({ widthCm: 120, heightCm: 90 })
    expect(parseDimensionsCm('80 × 60 cm')).toEqual({ widthCm: 80, heightCm: 60 })
    expect(parseDimensionsCm('300 x 200 x 200 cm')).toEqual({ widthCm: 300, heightCm: 200 })
  })

  it('returns null for non-numeric or missing dimensions', () => {
    expect(parseDimensionsCm('variable')).toBeNull()
    expect(parseDimensionsCm(undefined)).toBeNull()
    expect(parseDimensionsCm('')).toBeNull()
  })
})

describe('ImageGallery', () => {
  it('opens Lightbox HD on "Ampliar obra", closes on Escape, and restores focus to trigger', () => {
    render(
      <ImageGallery
        images={['https://example.com/1.jpg']}
        alt="Horizonte"
        dimensions="120 x 90 cm"
      />,
    )

    const zoomBtn = screen.getByRole('button', { name: 'Ampliar obra' })
    zoomBtn.focus()
    fireEvent.click(zoomBtn)

    const dialog = screen.getByRole('dialog')
    expect(dialog.getAttribute('aria-modal')).toBe('true')

    fireEvent.keyDown(window, { key: 'Escape' })
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(document.activeElement).toBe(zoomBtn)
  })

  it('opens Lightbox HD on main image click and supports ArrowLeft/ArrowRight navigation', () => {
    render(
      <ImageGallery
        images={['https://example.com/1.jpg', 'https://example.com/2.jpg']}
        alt="Díptico"
        dimensions="80 × 60 cm"
      />,
    )

    const imgBtn = screen.getByRole('button', { name: 'Ampliar Díptico' })
    imgBtn.focus()
    fireEvent.click(imgBtn)

    expect(screen.getByText('1 / 2')).toBeTruthy()
    fireEvent.keyDown(window, { key: 'ArrowRight' })
    expect(screen.getByText('2 / 2')).toBeTruthy()
    fireEvent.keyDown(window, { key: 'ArrowLeft' })
    expect(screen.getByText('1 / 2')).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: 'Cerrar vista ampliada' }))
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(document.activeElement).toBe(imgBtn)
  })

  it('renders "Ver en sala" with 260 cm reference wall when dimensions are parseable and omits it otherwise', () => {
    const { rerender } = render(
      <ImageGallery
        images={['https://example.com/1.jpg']}
        alt="Retrato"
        dimensions="80 × 60 cm"
      />,
    )

    const roomBtn = screen.getByRole('button', { name: 'Ver en sala' })
    expect(roomBtn.getAttribute('aria-pressed')).toBe('false')

    fireEvent.click(roomBtn)
    expect(roomBtn.getAttribute('aria-pressed')).toBe('true')
    expect(screen.getByText(/80 × 60 cm · Pared de referencia: 260 cm/i)).toBeTruthy()

    rerender(
      <ImageGallery
        images={['https://example.com/1.jpg']}
        alt="Instalación"
        dimensions="variable"
      />,
    )
    expect(screen.queryByRole('button', { name: 'Ver en sala' })).toBeNull()
  })
})
