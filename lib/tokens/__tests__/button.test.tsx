import { describe, it, expect, jest } from '@jest/globals'
import { render, screen, fireEvent } from '@testing-library/react'
import { Button } from '../../../components/Button'

describe('Button', () => {
  it('renders with shape=square style=filled and text "Comprar"', () => {
    render(<Button shape="square" style="filled">Comprar</Button>)
    expect(screen.getByText('Comprar')).toBeTruthy()
  })

  it('renders with shape=pill style=outlined and exposes data attributes', () => {
    render(<Button shape="pill" style="outlined">Ver</Button>)
    const el = screen.getByText('Ver')
    expect(el.getAttribute('data-shape')).toBe('pill')
    expect(el.getAttribute('data-style')).toBe('outlined')
  })

  it('renders as <a> when href is provided', () => {
    render(<Button shape="rounded" style="filled" href="/comprar">Ir</Button>)
    const el = screen.getByText('Ir')
    expect(el.tagName.toLowerCase()).toBe('a')
    expect(el.getAttribute('href')).toBe('/comprar')
  })

  it('disabled button does not fire onClick', () => {
    const handler = jest.fn()
    render(
      <Button shape="rounded" style="filled" onClick={handler} disabled>
        Bloqueado
      </Button>
    )
    const btn = screen.getByText('Bloqueado')
    fireEvent.click(btn)
    expect(handler).not.toHaveBeenCalled()
  })
})
