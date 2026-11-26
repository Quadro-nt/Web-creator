import { describe, it, expect, jest } from '@jest/globals'
import { useState } from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import LinkField from '../LinkField'
import { defaultSiteConfig } from '@/lib/schemas/site-config.schema'

const config = {
  ...defaultSiteConfig,
  pages: [
    { slug: 'home', title: 'Home', isHome: true, showInNav: true, sections: [] },
    { slug: 'exhibitions', title: 'Exhibitions', isHome: false, showInNav: true, sections: [] },
  ],
}

describe('LinkField', () => {
  it('detects internal href and populates page selector', () => {
    render(<LinkField value="/exhibitions" config={config} onChange={() => {}} />)
    const typeSelect = screen.getByLabelText(/tipo/i) as HTMLSelectElement
    expect(typeSelect.value).toBe('internal')
    expect(screen.getByDisplayValue('Exhibitions')).toBeTruthy()
  })

  it('detects https href', () => {
    render(<LinkField value="https://example.com" config={config} onChange={() => {}} />)
    expect((screen.getByLabelText(/tipo/i) as HTMLSelectElement).value).toBe('external')
  })

  it('detects mailto', () => {
    render(<LinkField value="mailto:hola@ex.com" config={config} onChange={() => {}} />)
    expect((screen.getByLabelText(/tipo/i) as HTMLSelectElement).value).toBe('email')
  })

  it('switches to external and emits URL change', () => {
    const onChange = jest.fn()
    function Controlled() {
      const [val, setVal] = useState('/exhibitions')
      return (
        <LinkField
          value={val}
          config={config}
          onChange={(next) => {
            onChange(next)
            setVal(next)
          }}
        />
      )
    }
    render(<Controlled />)
    fireEvent.change(screen.getByLabelText(/tipo/i), { target: { value: 'external' } })
    // after type switch, value becomes 'https://' — component re-renders showing URL input
    fireEvent.change(screen.getByLabelText(/url/i), { target: { value: 'https://new.com' } })
    expect(onChange).toHaveBeenLastCalledWith('https://new.com')
  })

  it('switches internal to another page', () => {
    const onChange = jest.fn()
    render(<LinkField value="/" config={config} onChange={onChange} />)
    fireEvent.change(screen.getByLabelText(/página/i), { target: { value: 'exhibitions' } })
    expect(onChange).toHaveBeenCalledWith('/exhibitions')
  })

  it('shows warning when internal href references missing page', () => {
    render(<LinkField value="/deleted-page" config={config} onChange={() => {}} />)
    expect(screen.getByText(/esta página ya no existe/i)).toBeTruthy()
  })
})
