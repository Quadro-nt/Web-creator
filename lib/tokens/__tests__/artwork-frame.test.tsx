import { describe, it, expect } from '@jest/globals'
import { render, screen } from '@testing-library/react'
import { ArtworkFrame } from '../../../components/ArtworkFrame'

describe('ArtworkFrame', () => {
  it('renders with treatment=frame and wrapper exists', () => {
    render(<ArtworkFrame treatment="frame"><img src="/test.jpg" alt="art" /></ArtworkFrame>)
    const wrapper = screen.getByAltText('art').parentElement
    expect(wrapper).toBeTruthy()
    expect(wrapper?.getAttribute('data-treatment')).toBe('frame')
  })

  it('renders with treatment=bleed', () => {
    render(<ArtworkFrame treatment="bleed"><img src="/test.jpg" alt="bleed-art" /></ArtworkFrame>)
    const wrapper = screen.getByAltText('bleed-art').parentElement
    expect(wrapper).toBeTruthy()
    expect(wrapper?.getAttribute('data-treatment')).toBe('bleed')
  })
})
