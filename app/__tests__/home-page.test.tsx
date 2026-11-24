import { describe, it, expect } from '@jest/globals'
import { render, screen } from '@testing-library/react'
import HomePage, { metadata } from '../page'

describe('HomePage (Quadro Sites landing)', () => {
  it('exports Spanish SEO metadata', () => {
    expect(metadata.title).toBe('Quadro Sites — Crea tu portafolio de artista')
    expect(typeof metadata.description).toBe('string')
    expect(String(metadata.description).length).toBeGreaterThan(20)
  })

  it('renders the main headline and Quadro Sites brand', () => {
    render(<HomePage />)

    const heading = screen.getByRole('heading', {
      level: 1,
      name: 'Tu obra merece un espacio propio en internet.',
    })
    expect(heading).toBeTruthy()

    const brandMatches = screen.getAllByText(/Quadro Sites/i)
    expect(brandMatches.length).toBeGreaterThan(0)

    expect(
      screen.getByText('Portafolios para artistas de Quadro'),
    ).toBeTruthy()
  })

  it('contains navigation and CTA links to /login and /signup', () => {
    render(<HomePage />)

    const links = screen.getAllByRole('link')
    const hrefs = links.map((link) => link.getAttribute('href'))

    expect(hrefs).toContain('/login')
    expect(hrefs).toContain('/signup')
    expect(hrefs).toContain('#como-funciona')
    expect(hrefs).toContain('#plantillas')
  })

  it('shows the 3 curated templates with signup template links and demo links', () => {
    render(<HomePage />)

    expect(
      screen.getByRole('heading', { level: 3, name: 'Minimal Gallery' }),
    ).toBeTruthy()
    expect(
      screen.getByRole('heading', { level: 3, name: 'Editorial' }),
    ).toBeTruthy()
    expect(
      screen.getByRole('heading', { level: 3, name: 'Immersive' }),
    ).toBeTruthy()

    const links = screen.getAllByRole('link')
    const hrefs = links.map((link) => link.getAttribute('href'))

    expect(hrefs).toContain('/signup?template=minimal-gallery')
    expect(hrefs).toContain('/signup?template=editorial')
    expect(hrefs).toContain('/signup?template=immersive')

    expect(hrefs).toContain('/sites/luna-vega')
    expect(hrefs).toContain('/sites/marco-torres')
    expect(hrefs).toContain('/sites/sofia-rios')
  })
})
