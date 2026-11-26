import { describe, it, expect, jest } from '@jest/globals'
import { render, screen, fireEvent } from '@testing-library/react'
import PageTree from '../PageTree'
import type { SiteConfig } from '@/lib/schemas/site-config.schema'
import { defaultSiteConfig } from '@/lib/schemas/site-config.schema'

const config: SiteConfig = {
  ...defaultSiteConfig,
  pages: [
    {
      slug: 'home',
      title: 'Home',
      isHome: true,
      showInNav: true,
      sections: [
        { id: 'cover-1', type: 'cover', variant: 'fullscreen', visible: true, content: {} },
      ],
    },
    { slug: 'bio', title: 'Bio', isHome: false, showInNav: true, sections: [] },
  ],
}

const noop = () => {}
const commonProps = {
  config,
  activePageId: 'home',
  selectedSectionId: null,
  onSelectPage: noop,
  onSelectSection: noop,
  onOpenCreatePage: noop,
  onOpenEditPage: noop,
  onDeletePage: noop,
  onSetHomePage: noop,
  onDuplicatePage: noop,
}

describe('PageTree', () => {
  it('renders one entry per page', () => {
    render(<PageTree {...commonProps} />)
    expect(screen.getByText('Home')).toBeTruthy()
    expect(screen.getByText('Bio')).toBeTruthy()
  })

  it('marks the home page with a badge', () => {
    render(<PageTree {...commonProps} />)
    expect(screen.getByLabelText('Home page')).toBeTruthy()
  })

  it('calls onSelectPage when clicking a page row', () => {
    const onSelectPage = jest.fn()
    render(<PageTree {...commonProps} onSelectPage={onSelectPage} />)
    fireEvent.click(screen.getByText('Bio'))
    expect(onSelectPage).toHaveBeenCalledWith('bio')
  })

  it('calls onOpenCreatePage on "+" click', () => {
    const onOpenCreatePage = jest.fn()
    render(<PageTree {...commonProps} onOpenCreatePage={onOpenCreatePage} />)
    fireEvent.click(screen.getByRole('button', { name: /nueva página/i }))
    expect(onOpenCreatePage).toHaveBeenCalled()
  })

  it('shows sections of the active page', () => {
    render(<PageTree {...commonProps} />)
    expect(screen.getByText(/cover/i)).toBeTruthy()
  })
})
