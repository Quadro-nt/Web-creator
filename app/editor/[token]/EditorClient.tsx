'use client'

import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import type { PageConfig, SectionConfig, SectionType, SiteConfig } from '@/lib/schemas/site-config.schema'
import type { Artwork } from '@/lib/schemas/works.schema'
import { SECTION_TYPE_LABELS, type Viewport } from './EditorConfig'
import { createSectionFromModule, createUniqueSectionId, useConfigHistory } from '@/components/editor/useConfigHistory'
import PreviewFrame from '@/components/editor/PreviewFrame'
import PreviewToggle from '@/components/editor/PreviewToggle'
import ModuleLibrary from '@/components/editor/ModuleLibrary'
import SectionList from '@/components/editor/SectionList'
import PageTree from '@/components/editor/PageTree'
import * as pageOps from '@/components/editor/page-operations'
import ThemePanel from '@/components/editor/ThemePanel'
import WorksManager from '@/components/editor/WorksManager'
import MediaLibrary from '@/components/editor/MediaLibrary'
import MediaPickerModal from '@/components/editor/MediaPickerModal'
import AIRequestPanel from '@/components/editor/AIRequestPanel'
import SectionInspector from '@/components/editor/SectionInspector'
import CanvasSectionWrapper from '@/components/editor/CanvasSectionWrapper'
import CanvasDropZone from '@/components/editor/CanvasDropZone'
import { STUDIO_COLORS, studioPrimaryBtn, studioSecondaryBtn } from '@/components/editor/studio-styles'
import PageModal from '@/components/editor/PageModal'

type Status = 'idle' | 'saving' | 'saved' | 'publishing' | 'published' | 'error'
type LeftTab = 'modules' | 'layers' | 'theme' | 'works' | 'media' | 'ai'
type MobileTab = 'panel' | 'preview' | 'inspector'
type ChromeTarget = 'announcement' | 'header' | 'footer'

type Props = {
  initialConfig: SiteConfig
  publishedConfig?: SiteConfig | null
  artistSlug: string
  editorToken?: string
  works: Artwork[]
}

const LEFT_TABS: Array<{ key: LeftTab; label: string }> = [
  { key: 'modules', label: 'Módulos' },
  { key: 'layers', label: 'Páginas' },
  { key: 'theme', label: 'Diseño' },
  { key: 'works', label: 'Obras' },
  { key: 'media', label: 'Medios' },
  { key: 'ai', label: 'IA' },
]

export default function EditorClient({
  initialConfig,
  publishedConfig = null,
  artistSlug,
  editorToken,
  works: initialWorks,
}: Props) {
  const { config, setConfig, resetHistory, undo, redo, canUndo, canRedo } =
    useConfigHistory(initialConfig)
  const [works, setWorks] = useState<Artwork[]>(initialWorks)
  const [publishedState, setPublishedState] = useState<SiteConfig | null>(publishedConfig)
  const [viewport, setViewport] = useState<Viewport>('desktop')
  const [status, setStatus] = useState<Status>('idle')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [leftTab, setLeftTab] = useState<LeftTab>('modules')
  const [mobileTab, setMobileTab] = useState<MobileTab>('preview')
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null)
  const [selectedChrome, setSelectedChrome] = useState<ChromeTarget | null>(null)
  const [aiPreviewConfig, setAiPreviewConfig] = useState<SiteConfig | null>(null)

  const [activePageId, setActivePageId] = useState<string>(() => {
    const home = initialConfig.pages?.find((p) => p.isHome)
    return home?.slug ?? initialConfig.pages?.[0]?.slug ?? 'home'
  })

  const [pageModalMode, setPageModalMode] = useState<'create' | { kind: 'edit'; slug: string } | null>(null)

  const handleOpenCreatePage = () => setPageModalMode('create')
  const handleOpenEditPage = (slug: string) => setPageModalMode({ kind: 'edit', slug })

  const handleDeletePage = (slug: string) => {
    try {
      setConfig((prev) => pageOps.deletePage(prev, slug))
      if (slug === activePageId) {
        const home = config.pages?.find((p) => p.isHome)
        if (home) setActivePageId(home.slug)
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'No se pudo borrar la página')
    }
  }

  const handleSetHomePage = (slug: string) => {
    try {
      setConfig((prev) => pageOps.setHomePage(prev, slug))
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'No se pudo marcar como home')
    }
  }

  const handleDuplicatePage = (slug: string) => {
    try {
      setConfig((prev) => pageOps.duplicatePage(prev, slug))
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'No se pudo duplicar la página')
    }
  }

  const activePage = useMemo((): PageConfig | undefined => {
    const found = config.pages.find((p) => p.slug === activePageId)
    return found ?? config.pages.find((p) => p.isHome) ?? config.pages[0]
  }, [config, activePageId])

  const setActivePageSections = useCallback(
    (updater: (sections: SectionConfig[]) => SectionConfig[]) => {
      setConfig((prev) => {
        const pages = prev.pages.map((p) =>
          p.slug === activePageId ? { ...p, sections: updater(p.sections) } : p
        )
        return { ...prev, pages }
      })
    },
    [setConfig, activePageId]
  )

  const selectSection = useCallback((id: string | null) => {
    setSelectedSectionId(id)
    if (id !== null) setSelectedChrome(null)
  }, [])

  const selectChrome = useCallback((target: ChromeTarget | null) => {
    setSelectedChrome(target)
    if (target !== null) {
      setSelectedSectionId(null)
      setMobileTab('inspector')
    }
  }, [])
  const [activeDragLabel, setActiveDragLabel] = useState<string | null>(null)
  const [quickInsertIndex, setQuickInsertIndex] = useState<number | null>(null)
  const [mediaPicker, setMediaPicker] = useState<{
    open: boolean
    initialUrl: string
    onSelect: (url: string) => void
  } | null>(null)

  const initialJson = useMemo(() => JSON.stringify(initialConfig), [initialConfig])
  const lastSavedJsonRef = useRef<string>(initialJson)
  const currentConfigJson = useMemo(() => JSON.stringify(config), [config])
  const isDirty = currentConfigJson !== lastSavedJsonRef.current
  const hasUnpublishedChanges = useMemo(
    () => (publishedState ? currentConfigJson !== JSON.stringify(publishedState) : false),
    [currentConfigJson, publishedState]
  )

  const selectedSection = useMemo(
    () => (activePage?.sections ?? []).find((s) => s.id === selectedSectionId) ?? null,
    [activePage?.sections, selectedSectionId]
  )

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const postJson = useCallback(
    async (url: string, targetConfig: SiteConfig) => {
      setErrorMsg(null)
      const headers: Record<string, string> = { 'Content-Type': 'application/json' }
      if (editorToken) {
        headers['x-editor-token'] = editorToken
      }
      const res = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify({ artistSlug, config: targetConfig }),
      })
      if (!res.ok) {
        let message = `Error ${res.status}`
        try {
          const body = (await res.json()) as { error?: string }
          if (body?.error) message = body.error
        } catch {
          // ignore
        }
        throw new Error(message)
      }
    },
    [artistSlug, editorToken]
  )

  const handleSaveDraft = useCallback(async () => {
    if (status === 'saving' || status === 'publishing') return
    setStatus('saving')
    try {
      await postJson('/api/draft', config)
      lastSavedJsonRef.current = JSON.stringify(config)
      setStatus('saved')
      window.setTimeout(() => setStatus((s) => (s === 'saved' ? 'idle' : s)), 2000)
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Error desconocido')
      setStatus('error')
    }
  }, [config, postJson, status])

  const handlePublish = useCallback(async () => {
    if (status === 'saving' || status === 'publishing') return
    setStatus('publishing')
    try {
      await postJson('/api/publish', config)
      lastSavedJsonRef.current = JSON.stringify(config)
      setPublishedState(config)
      setStatus('published')
      window.setTimeout(() => setStatus((s) => (s === 'published' ? 'idle' : s)), 2000)
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Error desconocido')
      setStatus('error')
    }
  }, [config, postJson, status])

  const handleDiscardDraft = useCallback(async () => {
    if (!publishedState) return
    setErrorMsg(null)
    if (editorToken) {
      try {
        const res = await fetch(`/api/draft?artistSlug=${encodeURIComponent(artistSlug)}`, {
          method: 'DELETE',
          headers: { 'x-editor-token': editorToken },
        })
        if (!res.ok) {
          const body = (await res.json().catch(() => ({}))) as { error?: string }
          throw new Error(body.error ?? `Error ${res.status}`)
        }
      } catch (err) {
        setErrorMsg(err instanceof Error ? err.message : 'No se pudo descartar el borrador')
        setStatus('error')
        return
      }
    }
    resetHistory(publishedState)
    lastSavedJsonRef.current = JSON.stringify(publishedState)
    setSelectedSectionId(null)
    setAiPreviewConfig(null)
    setStatus('idle')
  }, [artistSlug, editorToken, publishedState, resetHistory])

  // Debounced autosave only after user edits when authenticated
  useEffect(() => {
    if (!editorToken || !isDirty || aiPreviewConfig) return
    const timer = window.setTimeout(() => {
      void handleSaveDraft()
    }, 1800)
    return () => window.clearTimeout(timer)
  }, [aiPreviewConfig, currentConfigJson, editorToken, handleSaveDraft, isDirty])

  // Warn before closing tab with unsaved edits
  useEffect(() => {
    if (!isDirty) return
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = ''
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [isDirty])

  // Keyboard shortcuts for Undo / Redo outside text inputs
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null
      const tag = target?.tagName?.toLowerCase()
      if (tag === 'input' || tag === 'textarea' || tag === 'select' || target?.isContentEditable) {
        return
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault()
        if (e.shiftKey) {
          redo()
        } else {
          undo()
        }
      } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault()
        redo()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [redo, undo])

  const handlePatch = useCallback(
    (patch: Partial<SiteConfig>) => {
      setConfig((prev) => ({ ...prev, ...patch }))
    },
    [setConfig]
  )

  const handleSectionsChange = useCallback(
    (sections: SectionConfig[]) => {
      setActivePageSections(() => sections)
    },
    [setActivePageSections]
  )

  const handleUpdateSection = useCallback(
    (sectionId: string, updater: (prev: SectionConfig) => SectionConfig) => {
      setActivePageSections((sections) => sections.map((s) => (s.id === sectionId ? updater(s) : s)))
    },
    [setActivePageSections]
  )

  const handleInsertModuleAt = useCallback(
    (type: SectionType, insertIndex?: number) => {
      const created = createSectionFromModule(type)
      setActivePageSections((sections) => {
        const nextSections = sections.slice()
        const targetIndex =
          insertIndex !== undefined
            ? Math.max(0, Math.min(nextSections.length, insertIndex))
            : selectedSectionId
              ? (() => {
                  const selIdx = nextSections.findIndex((s) => s.id === selectedSectionId)
                  return selIdx >= 0 ? selIdx + 1 : nextSections.length
                })()
              : nextSections.length
        nextSections.splice(targetIndex, 0, created)
        return nextSections
      })
      setSelectedSectionId(created.id)
      setSelectedChrome(null)
      setQuickInsertIndex(null)
    },
    [selectedSectionId, setActivePageSections]
  )

  const handleDuplicateSection = useCallback(
    (sectionId: string) => {
      let createdId: string | null = null
      setActivePageSections((sections) => {
        const idx = sections.findIndex((s) => s.id === sectionId)
        if (idx < 0) return sections
        const source = sections[idx]
        const clone: SectionConfig = {
          ...source,
          id: createUniqueSectionId(source.type),
          content: JSON.parse(JSON.stringify(source.content)) as Record<string, unknown>,
        }
        createdId = clone.id
        const next = sections.slice()
        next.splice(idx + 1, 0, clone)
        return next
      })
      if (createdId) setSelectedSectionId(createdId)
    },
    [setActivePageSections]
  )

  const handleDeleteSection = useCallback(
    (sectionId: string) => {
      setActivePageSections((sections) => sections.filter((s) => s.id !== sectionId))
      setSelectedSectionId((cur) => (cur === sectionId ? null : cur))
    },
    [setActivePageSections]
  )

  const handleMoveSection = useCallback(
    (sectionId: string, direction: -1 | 1) => {
      setActivePageSections((sections) => {
        const visible = sections.filter((s) => s.visible)
        const vIdx = visible.findIndex((s) => s.id === sectionId)
        const targetVisibleIdx = vIdx + direction
        if (vIdx < 0 || targetVisibleIdx < 0 || targetVisibleIdx >= visible.length) return sections
        const targetId = visible[targetVisibleIdx].id
        const fromIdx = sections.findIndex((s) => s.id === sectionId)
        const toIdx = sections.findIndex((s) => s.id === targetId)
        if (fromIdx < 0 || toIdx < 0) return sections
        return arrayMove(sections, fromIdx, toIdx)
      })
    },
    [setActivePageSections]
  )

  const handleAiApply = useCallback(
    (next: SiteConfig) => {
      setConfig(next)
      setAiPreviewConfig(null)
    },
    [setConfig]
  )

  function openMediaPicker(initialUrl: string, onSelect: (url: string) => void) {
    setMediaPicker({ open: true, initialUrl, onSelect })
  }

  function resolveInsertionIndex(visibleBoundaryIndex: number): number {
    const sections = activePage?.sections ?? []
    const visible = sections.filter((s) => s.visible)
    if (visibleBoundaryIndex <= 0) return 0
    if (visibleBoundaryIndex >= visible.length) return sections.length
    const anchorId = visible[visibleBoundaryIndex].id
    const idx = sections.findIndex((s) => s.id === anchorId)
    return idx >= 0 ? idx : sections.length
  }

  function handleDragStart(event: DragStartEvent) {
    const data = event.active.data.current as
      | { source?: string; moduleType?: SectionType; sectionId?: string }
      | undefined
    const sections = activePage?.sections ?? []
    if (data?.source === 'palette' && data.moduleType) {
      setActiveDragLabel(SECTION_TYPE_LABELS[data.moduleType] ?? data.moduleType)
    } else if (data?.sectionId) {
      const sec = sections.find((s) => s.id === data.sectionId)
      setActiveDragLabel(sec ? SECTION_TYPE_LABELS[sec.type] ?? sec.type : 'Sección')
    }
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveDragLabel(null)
    const { active, over } = event
    if (!over) return

    const activeData = active.data.current as
      | { source?: string; moduleType?: SectionType; sectionId?: string }
      | undefined
    const overData = over.data.current as
      | { source?: string; insertIndex?: number; sectionId?: string }
      | undefined

    const sections = activePage?.sections ?? []

    // 1) Dragging a new module from the palette
    if (activeData?.source === 'palette' && activeData.moduleType) {
      let targetIdx = sections.length
      if (overData?.source === 'drop-zone' && typeof overData.insertIndex === 'number') {
        targetIdx = resolveInsertionIndex(overData.insertIndex)
      } else if (overData?.sectionId) {
        const foundIdx = sections.findIndex((s) => s.id === overData.sectionId)
        if (foundIdx >= 0) targetIdx = foundIdx + 1
      }
      handleInsertModuleAt(activeData.moduleType, targetIdx)
      return
    }

    // 2) Reordering existing sections (from canvas or layers)
    const activeSectionId = activeData?.sectionId ?? String(active.id).replace(/^layer:/, '')
    if (!activeSectionId) return

    const oldIndex = sections.findIndex((s) => s.id === activeSectionId)
    if (oldIndex < 0) return

    if (overData?.source === 'drop-zone' && typeof overData.insertIndex === 'number') {
      const rawTarget = resolveInsertionIndex(overData.insertIndex)
      const adjusted = rawTarget > oldIndex ? rawTarget - 1 : rawTarget
      if (adjusted !== oldIndex) {
        handleSectionsChange(arrayMove(sections, oldIndex, Math.max(0, Math.min(sections.length - 1, adjusted))))
      }
      return
    }

    const overSectionId = overData?.sectionId ?? String(over.id).replace(/^layer:/, '')
    const newIndex = sections.findIndex((s) => s.id === overSectionId)
    if (newIndex >= 0 && newIndex !== oldIndex) {
      handleSectionsChange(arrayMove(sections, oldIndex, newIndex))
    }
  }

  const statusLabel =
    status === 'saving'
      ? 'Guardando…'
      : status === 'saved'
        ? 'Guardado'
        : status === 'publishing'
          ? 'Publicando…'
          : status === 'published'
            ? 'Publicado'
            : status === 'error'
              ? errorMsg ?? 'Error'
              : isDirty
                ? 'Cambios sin guardar'
                : ''

  const effectiveConfig = aiPreviewConfig ?? config
  const effectiveActivePage = useMemo((): PageConfig | undefined => {
    if (!aiPreviewConfig) return activePage
    const found = aiPreviewConfig.pages.find((p) => p.slug === activePageId)
    return found ?? aiPreviewConfig.pages.find((p) => p.isHome) ?? aiPreviewConfig.pages[0]
  }, [aiPreviewConfig, activePage, activePageId])
  const visibleSections = (effectiveActivePage?.sections ?? []).filter((s) => s.visible)
  const isDraggingPalette = activeDragLabel !== null && quickInsertIndex === null

  return (
    <div
      data-testid="editor-root"
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        background: '#e2e8f0',
        color: STUDIO_COLORS.text,
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      {/* Studio Top Bar */}
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0.6rem 1rem',
          background: STUDIO_COLORS.surface,
          borderBottom: `1px solid ${STUDIO_COLORS.border}`,
          gap: '0.75rem',
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <strong style={{ fontSize: '0.92rem' }}>Editor</strong>
          <span
            style={{
              fontSize: '0.75rem',
              color: STUDIO_COLORS.muted,
              background: STUDIO_COLORS.chrome,
              padding: '0.15rem 0.5rem',
              borderRadius: '9999px',
              border: `1px solid ${STUDIO_COLORS.border}`,
            }}
          >
            {artistSlug}
          </span>
          {statusLabel && (
            <span
              role="status"
              aria-live="polite"
              style={{
                fontSize: '0.76rem',
                fontWeight: 500,
                color:
                  status === 'error'
                    ? STUDIO_COLORS.danger
                    : isDirty && status === 'idle'
                      ? '#b45309'
                      : STUDIO_COLORS.success,
              }}
            >
              {statusLabel}
            </span>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <PreviewToggle viewport={viewport} onChange={setViewport} />
          <div style={{ display: 'inline-flex', gap: '0.25rem' }}>
            <button
              type="button"
              aria-label="Deshacer"
              disabled={!canUndo}
              onClick={undo}
              style={{
                ...studioSecondaryBtn,
                opacity: canUndo ? 1 : 0.45,
                cursor: canUndo ? 'pointer' : 'not-allowed',
              }}
            >
              ↶ Deshacer
            </button>
            <button
              type="button"
              aria-label="Rehacer"
              disabled={!canRedo}
              onClick={redo}
              style={{
                ...studioSecondaryBtn,
                opacity: canRedo ? 1 : 0.45,
                cursor: canRedo ? 'pointer' : 'not-allowed',
              }}
            >
              ↷ Rehacer
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
          <a
            href={`/sites/${artistSlug}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{ ...studioSecondaryBtn, textDecoration: 'none' }}
          >
            Ver sitio ↗
          </a>
          {hasUnpublishedChanges && (
            <button
              type="button"
              onClick={() => void handleDiscardDraft()}
              style={{ ...studioSecondaryBtn, color: STUDIO_COLORS.danger }}
            >
              Descartar borrador
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              setLeftTab('ai')
              setMobileTab('panel')
            }}
            style={studioSecondaryBtn}
          >
            Pídeselo a la IA
          </button>
          <button
            type="button"
            onClick={() => void handleSaveDraft()}
            disabled={status === 'saving' || status === 'publishing'}
            style={studioSecondaryBtn}
          >
            Guardar borrador
          </button>
          <button
            type="button"
            onClick={() => void handlePublish()}
            disabled={status === 'saving' || status === 'publishing'}
            style={studioPrimaryBtn}
          >
            Publicar
          </button>
        </div>
      </header>

      {/* Responsive narrow-screen switcher */}
      <div
        className="editor-tabs"
        style={{
          display: 'none',
          gap: '0.25rem',
          padding: '0.45rem 0.75rem',
          background: STUDIO_COLORS.surface,
          borderBottom: `1px solid ${STUDIO_COLORS.border}`,
        }}
      >
        {(
          [
            { key: 'panel', label: 'Panel' },
            { key: 'preview', label: 'Lienzo' },
            { key: 'inspector', label: 'Inspector' },
          ] as const
        ).map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setMobileTab(tab.key)}
            aria-pressed={mobileTab === tab.key}
            style={{
              flex: 1,
              padding: '0.45rem',
              background: mobileTab === tab.key ? STUDIO_COLORS.primary : '#ffffff',
              color: mobileTab === tab.key ? '#ffffff' : STUDIO_COLORS.text,
              border: `1px solid ${STUDIO_COLORS.inputBorder}`,
              borderRadius: '6px',
              fontSize: '0.8rem',
              fontWeight: 500,
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <style>{`
        .studio-shell { display: grid; grid-template-columns: 280px 1fr 320px; flex: 1; min-height: 0; }
        .studio-left { overflow-y: auto; border-right: 1px solid ${STUDIO_COLORS.border}; background: ${STUDIO_COLORS.chrome}; display: flex; flex-direction: column; min-height: 0; }
        .studio-canvas { overflow-y: auto; background: #e2e8f0; display: flex; flex-direction: column; min-height: 0; position: relative; }
        .studio-right { overflow-y: auto; border-left: 1px solid ${STUDIO_COLORS.border}; background: ${STUDIO_COLORS.chrome}; padding: 0.85rem; min-height: 0; }
        @media (max-width: 1080px) {
          .editor-tabs { display: flex !important; }
          .studio-shell { grid-template-columns: 1fr; }
          .studio-left { border-right: none; display: ${mobileTab === 'panel' ? 'flex' : 'none'}; }
          .studio-canvas { display: ${mobileTab === 'preview' ? 'flex' : 'none'}; }
          .studio-right { border-left: none; display: ${mobileTab === 'inspector' ? 'block' : 'none'}; }
        }
      `}</style>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={() => setActiveDragLabel(null)}
      >
        <div className="studio-shell">
          {/* Left Panel */}
          <aside className="studio-left">
            <nav
              aria-label="Herramientas del editor"
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '0.25rem',
                padding: '0.55rem',
                background: STUDIO_COLORS.surface,
                borderBottom: `1px solid ${STUDIO_COLORS.border}`,
                position: 'sticky',
                top: 0,
                zIndex: 20,
              }}
            >
              {LEFT_TABS.map((tab) => {
                const active = leftTab === tab.key
                return (
                  <button
                    key={tab.key}
                    type="button"
                    aria-pressed={active}
                    onClick={() => setLeftTab(tab.key)}
                    style={{
                      padding: '0.38rem 0.25rem',
                      borderRadius: '6px',
                      border: active ? `1px solid ${STUDIO_COLORS.primary}` : `1px solid transparent`,
                      background: active ? STUDIO_COLORS.primary : STUDIO_COLORS.chrome,
                      color: active ? '#ffffff' : STUDIO_COLORS.text,
                      fontSize: '0.74rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                    }}
                  >
                    {tab.label}
                  </button>
                )
              })}
            </nav>

            <div style={{ padding: '0.75rem', flex: 1 }}>
              {leftTab === 'modules' && (
                <ModuleLibrary
                  sections={activePage?.sections ?? []}
                  onAddModule={(type) => {
                    handleInsertModuleAt(type, quickInsertIndex ?? undefined)
                  }}
                  onSelectSection={(id) => selectSection(id)}
                />
              )}

              {leftTab === 'layers' && (
                <PageTree
                  config={config}
                  activePageId={activePageId}
                  selectedSectionId={selectedSectionId}
                  onSelectPage={(slug) => setActivePageId(slug)}
                  onSelectSection={(id) => selectSection(id)}
                  onOpenCreatePage={handleOpenCreatePage}
                  onOpenEditPage={handleOpenEditPage}
                  onDeletePage={handleDeletePage}
                  onSetHomePage={handleSetHomePage}
                  onDuplicatePage={handleDuplicatePage}
                />
              )}

              {leftTab === 'theme' && <ThemePanel config={config} onChange={handlePatch} />}

              {leftTab === 'works' && (
                <WorksManager
                  artistSlug={artistSlug}
                  editorToken={editorToken}
                  works={works}
                  onWorksChange={setWorks}
                  onOpenMediaPicker={openMediaPicker}
                />
              )}

              {leftTab === 'media' && (
                <MediaLibrary artistSlug={artistSlug} editorToken={editorToken} />
              )}

              {leftTab === 'ai' && (
                <AIRequestPanel
                  currentConfig={config}
                  artistSlug={artistSlug}
                  editorToken={editorToken}
                  selectedSectionId={selectedSectionId}
                  selectedSection={selectedSection}
                  onApply={handleAiApply}
                  onPreviewChange={setAiPreviewConfig}
                />
              )}
            </div>
          </aside>

          {/* Center Interactive Canvas */}
          <main
            className="studio-canvas"
            onClick={() => {
              setSelectedSectionId(null)
              setSelectedChrome(null)
            }}
          >
            {aiPreviewConfig && (
              <div
                onClick={(e) => e.stopPropagation()}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '0.75rem',
                  padding: '0.55rem 1rem',
                  background: STUDIO_COLORS.accent,
                  color: '#ffffff',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                }}
              >
                <span>Vista previa de propuesta IA — revisa el resultado antes de confirmar</span>
                <div style={{ display: 'flex', gap: '0.4rem' }}>
                  <button
                    type="button"
                    onClick={() => handleAiApply(aiPreviewConfig)}
                    style={{
                      ...studioPrimaryBtn,
                      background: '#ffffff',
                      color: STUDIO_COLORS.accent,
                      borderColor: '#ffffff',
                    }}
                  >
                    Aplicar cambio
                  </button>
                  <button
                    type="button"
                    onClick={() => setAiPreviewConfig(null)}
                    style={{
                      ...studioSecondaryBtn,
                      background: 'transparent',
                      color: '#ffffff',
                      borderColor: 'rgba(255,255,255,0.5)',
                    }}
                  >
                    Salir de vista previa
                  </button>
                </div>
              </div>
            )}

            <CanvasRootDroppable>
              <SortableContext
                items={visibleSections.map((s) => s.id)}
                strategy={verticalListSortingStrategy}
              >
                <PreviewFrame
                  config={effectiveConfig}
                  page={effectiveActivePage}
                  works={works}
                  artistSlug={artistSlug}
                  viewport={viewport}
                  onSelectChrome={aiPreviewConfig ? undefined : selectChrome}
                  renderSectionWrapper={
                    aiPreviewConfig
                      ? undefined
                      : (section, node, visibleIndex) => (
                          <Fragment key={section.id}>
                            <CanvasDropZone
                              index={visibleIndex}
                              isDraggingPalette={isDraggingPalette}
                              onQuickAddAt={(idx) => {
                                setQuickInsertIndex(resolveInsertionIndex(idx))
                                setLeftTab('modules')
                                setMobileTab('panel')
                              }}
                            />
                            <CanvasSectionWrapper
                              section={section}
                              index={visibleIndex}
                              total={visibleSections.length}
                              isSelected={selectedSectionId === section.id}
                              onSelect={() => selectSection(section.id)}
                              onMove={(dir) => handleMoveSection(section.id, dir)}
                              onDuplicate={() => handleDuplicateSection(section.id)}
                              onToggleVisible={() =>
                                handleUpdateSection(section.id, (prev) => ({
                                  ...prev,
                                  visible: !prev.visible,
                                }))
                              }
                              onDelete={() => handleDeleteSection(section.id)}
                              onPatchContent={(patch) =>
                                handleUpdateSection(section.id, (prev) => ({
                                  ...prev,
                                  content: { ...prev.content, ...patch },
                                }))
                              }
                            >
                              {node}
                            </CanvasSectionWrapper>
                            {visibleIndex === visibleSections.length - 1 && (
                              <CanvasDropZone
                                index={visibleSections.length}
                                isDraggingPalette={isDraggingPalette}
                                onQuickAddAt={(idx) => {
                                  setQuickInsertIndex(resolveInsertionIndex(idx))
                                  setLeftTab('modules')
                                  setMobileTab('panel')
                                }}
                              />
                            )}
                          </Fragment>
                        )
                  }
                />

                {!aiPreviewConfig && visibleSections.length === 0 && (
                  <div
                    onClick={(e) => e.stopPropagation()}
                    style={{
                      margin: '2rem auto',
                      maxWidth: '480px',
                      padding: '2rem',
                      border: `2px dashed ${STUDIO_COLORS.inputBorder}`,
                      borderRadius: '10px',
                      background: STUDIO_COLORS.surface,
                      textAlign: 'center',
                    }}
                  >
                    <p style={{ margin: '0 0 0.75rem', fontSize: '0.88rem', color: STUDIO_COLORS.muted }}>
                      Tu página no tiene secciones visibles. Arrastra un módulo o agrega uno desde el panel izquierdo.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setLeftTab('modules')
                        setMobileTab('panel')
                      }}
                      style={studioPrimaryBtn}
                    >
                      Explorar módulos
                    </button>
                  </div>
                )}
              </SortableContext>
            </CanvasRootDroppable>
          </main>

          {/* Right Contextual Inspector */}
          <aside className="studio-right">
            <SectionInspector
              config={config}
              artistSlug={artistSlug}
              editorToken={editorToken}
              works={works}
              selectedSection={selectedSection}
              selectedChrome={selectedChrome}
              onSelectChrome={selectChrome}
              onBackToSite={() => {
                setSelectedSectionId(null)
                setSelectedChrome(null)
              }}
              onChangeIdentity={(identity) => handlePatch({ identity })}
              onPatchConfig={handlePatch}
              onUpdateSection={handleUpdateSection}
              onDuplicateSection={handleDuplicateSection}
              onDeleteSection={handleDeleteSection}
              onOpenMediaPicker={openMediaPicker}
            />
          </aside>
        </div>

        <DragOverlay>
          {activeDragLabel ? (
            <div
              style={{
                padding: '0.45rem 0.75rem',
                background: STUDIO_COLORS.primary,
                color: '#ffffff',
                borderRadius: '6px',
                fontSize: '0.78rem',
                fontWeight: 600,
                boxShadow: '0 8px 20px rgba(15,23,42,0.25)',
              }}
            >
              {activeDragLabel}
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      <MediaPickerModal
        open={Boolean(mediaPicker?.open)}
        artistSlug={artistSlug}
        editorToken={editorToken}
        initialUrl={mediaPicker?.initialUrl ?? ''}
        onSelect={(url) => mediaPicker?.onSelect(url)}
        onClose={() => setMediaPicker(null)}
      />

      {pageModalMode && (
        <PageModal
          mode={pageModalMode}
          config={config}
          onClose={() => setPageModalMode(null)}
          onSubmit={(payload) => {
            try {
              if (pageModalMode === 'create') {
                setConfig((prev) => pageOps.addPage(prev, payload))
                setActivePageId(payload.slug)
              } else {
                setConfig((prev) =>
                  pageOps.renamePage(prev, pageModalMode.slug, {
                    title: payload.title,
                    slug: payload.slug,
                    showInNav: payload.showInNav,
                  })
                )
                if (pageModalMode.slug === activePageId) setActivePageId(payload.slug)
              }
              setPageModalMode(null)
            } catch (err) {
              setErrorMsg(err instanceof Error ? err.message : 'No se pudo guardar la página')
            }
          }}
        />
      )}
    </div>
  )
}

function CanvasRootDroppable({ children }: { children: React.ReactNode }) {
  const { setNodeRef } = useDroppable({
    id: 'canvas-root',
    data: { source: 'canvas-root' },
  })
  return (
    <div ref={setNodeRef} style={{ flex: 1, minHeight: '100%' }}>
      {children}
    </div>
  )
}
