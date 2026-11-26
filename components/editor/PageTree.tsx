'use client'

import { useState } from 'react'
import type { SiteConfig } from '@/lib/schemas/site-config.schema'
import { STUDIO_COLORS, studioSecondaryBtn } from './studio-styles'

type Props = {
  config: SiteConfig
  activePageId: string
  selectedSectionId: string | null
  onSelectPage: (slug: string) => void
  onSelectSection: (sectionId: string) => void
  onOpenCreatePage: () => void
  onOpenEditPage: (slug: string) => void
  onDeletePage: (slug: string) => void
  onSetHomePage: (slug: string) => void
  onDuplicatePage: (slug: string) => void
}

export default function PageTree({
  config,
  activePageId,
  selectedSectionId,
  onSelectPage,
  onSelectSection,
  onOpenCreatePage,
  onOpenEditPage,
  onDeletePage,
  onSetHomePage,
  onDuplicatePage,
}: Props) {
  const pages = config.pages ?? []
  const [openMenuSlug, setOpenMenuSlug] = useState<string | null>(null)
  const [expandedSlug, setExpandedSlug] = useState<string>(activePageId)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0.25rem 0.5rem',
        }}
      >
        <span
          style={{
            fontSize: '0.7rem',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            color: STUDIO_COLORS.muted,
          }}
        >
          Páginas
        </span>
        <button
          type="button"
          onClick={onOpenCreatePage}
          aria-label="Nueva página"
          style={{
            ...studioSecondaryBtn,
            padding: '0.15rem 0.5rem',
            fontSize: '0.8rem',
          }}
        >
          + Nueva página
        </button>
      </div>

      {pages.map((page) => {
        const isActive = page.slug === activePageId
        const isExpanded = expandedSlug === page.slug
        return (
          <div key={page.slug}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                padding: '0.35rem 0.5rem',
                background: isActive ? STUDIO_COLORS.accentSoft : 'transparent',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
              onClick={() => {
                onSelectPage(page.slug)
                setExpandedSlug(page.slug)
              }}
            >
              <span
                onClick={(e) => {
                  e.stopPropagation()
                  setExpandedSlug(isExpanded ? '' : page.slug)
                }}
                style={{ cursor: 'pointer', fontSize: '0.7rem', color: STUDIO_COLORS.muted }}
                aria-label={isExpanded ? 'Colapsar' : 'Expandir'}
              >
                {isExpanded ? '▾' : '▸'}
              </span>
              {page.isHome && (
                <span
                  aria-label="Home page"
                  style={{
                    display: 'inline-block',
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    background: STUDIO_COLORS.accent,
                  }}
                />
              )}
              <span style={{ flex: 1, fontSize: '0.85rem' }}>{page.title}</span>
              <button
                type="button"
                aria-label={`Menú de ${page.title}`}
                onClick={(e) => {
                  e.stopPropagation()
                  setOpenMenuSlug(openMenuSlug === page.slug ? null : page.slug)
                }}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: STUDIO_COLORS.muted,
                  cursor: 'pointer',
                  padding: '0 0.25rem',
                }}
              >
                ⋯
              </button>
            </div>

            {openMenuSlug === page.slug && (
              <div
                style={{
                  background: STUDIO_COLORS.surface,
                  border: `1px solid ${STUDIO_COLORS.border}`,
                  borderRadius: '6px',
                  padding: '0.25rem',
                  marginTop: '0.25rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.15rem',
                }}
              >
                <button
                  type="button"
                  onClick={() => {
                    setOpenMenuSlug(null)
                    onOpenEditPage(page.slug)
                  }}
                  style={{ ...studioSecondaryBtn, textAlign: 'left' }}
                >
                  Editar página
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setOpenMenuSlug(null)
                    onDuplicatePage(page.slug)
                  }}
                  style={{ ...studioSecondaryBtn, textAlign: 'left' }}
                >
                  Duplicar
                </button>
                {!page.isHome && (
                  <button
                    type="button"
                    onClick={() => {
                      setOpenMenuSlug(null)
                      onSetHomePage(page.slug)
                    }}
                    style={{ ...studioSecondaryBtn, textAlign: 'left' }}
                  >
                    Marcar como home
                  </button>
                )}
                <button
                  type="button"
                  disabled={page.isHome}
                  onClick={() => {
                    setOpenMenuSlug(null)
                    onDeletePage(page.slug)
                  }}
                  title={page.isHome ? 'Marcá otra como home primero' : undefined}
                  style={{
                    ...studioSecondaryBtn,
                    textAlign: 'left',
                    color: page.isHome ? STUDIO_COLORS.muted : STUDIO_COLORS.danger,
                    cursor: page.isHome ? 'not-allowed' : 'pointer',
                  }}
                >
                  Borrar
                </button>
              </div>
            )}

            {isExpanded && (
              <div style={{ paddingLeft: '1.25rem', marginTop: '0.2rem' }}>
                {page.sections.length === 0 ? (
                  <div
                    style={{
                      fontSize: '0.7rem',
                      color: STUDIO_COLORS.muted,
                      padding: '0.25rem 0',
                    }}
                  >
                    (sin secciones)
                  </div>
                ) : (
                  page.sections.map((s) => (
                    <div
                      key={s.id}
                      onClick={() => onSelectSection(s.id)}
                      style={{
                        fontSize: '0.75rem',
                        padding: '0.2rem 0.4rem',
                        cursor: 'pointer',
                        borderRadius: '3px',
                        background:
                          selectedSectionId === s.id ? STUDIO_COLORS.accentSoft : 'transparent',
                        color: STUDIO_COLORS.muted,
                      }}
                    >
                      · {s.type}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
