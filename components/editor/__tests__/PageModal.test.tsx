import { describe, it, expect, jest } from '@jest/globals'
import { render, screen, fireEvent } from '@testing-library/react'
import PageModal from '../PageModal'
import { defaultSiteConfig } from '@/lib/schemas/site-config.schema'

const config = {
  ...defaultSiteConfig,
  pages: [
    { slug: 'home', title: 'Home', isHome: true, showInNav: true, sections: [] },
  ],
}

describe('PageModal create mode', () => {
  it('auto-generates slug from title', () => {
    const onSubmit = jest.fn()
    render(<PageModal mode="create" config={config} onSubmit={onSubmit} onClose={() => {}} />)
    const titleInput = screen.getByLabelText(/título/i) as HTMLInputElement
    fireEvent.change(titleInput, { target: { value: 'My Exhibitions' } })
    const slugInput = screen.getByLabelText(/slug/i) as HTMLInputElement
    expect(slugInput.value).toBe('my-exhibitions')
  })

  it('validates slug format in real time', () => {
    render(<PageModal mode="create" config={config} onSubmit={() => {}} onClose={() => {}} />)
    const slugInput = screen.getByLabelText(/slug/i) as HTMLInputElement
    fireEvent.change(slugInput, { target: { value: 'Invalid Slug' } })
    expect(screen.getByText(/formato de slug inválido/i)).toBeTruthy()
  })

  it('blocks submit when slug collides with existing', () => {
    render(<PageModal mode="create" config={config} onSubmit={() => {}} onClose={() => {}} />)
    fireEvent.change(screen.getByLabelText(/título/i), { target: { value: 'Home' } })
    const submitBtn = screen.getByRole('button', { name: /crear/i })
    expect(submitBtn.hasAttribute('disabled')).toBe(true)
  })

  it('calls onSubmit with payload on valid create', () => {
    const onSubmit = jest.fn()
    render(<PageModal mode="create" config={config} onSubmit={onSubmit} onClose={() => {}} />)
    fireEvent.change(screen.getByLabelText(/título/i), { target: { value: 'Exhibitions' } })
    fireEvent.click(screen.getByRole('button', { name: /crear/i }))
    expect(onSubmit).toHaveBeenCalledWith({
      title: 'Exhibitions',
      slug: 'exhibitions',
      showInNav: true,
      copyFromSlug: undefined,
    })
  })
})

describe('PageModal edit mode', () => {
  it('pre-fills title and slug', () => {
    render(
      <PageModal
        mode={{ kind: 'edit', slug: 'home' }}
        config={config}
        onSubmit={() => {}}
        onClose={() => {}}
      />
    )
    const titleInput = screen.getByLabelText(/título/i) as HTMLInputElement
    expect(titleInput.value).toBe('Home')
  })
})
