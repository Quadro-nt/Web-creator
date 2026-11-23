'use client'

import { useCallback, useReducer } from 'react'
import type { SectionConfig, SectionType, SiteConfig } from '@/lib/schemas/site-config.schema'
import { MODULE_CATALOG } from '@/app/editor/[token]/EditorConfig'

export const MAX_HISTORY_ENTRIES = 50

export type ConfigHistoryState = {
  past: SiteConfig[]
  present: SiteConfig
  future: SiteConfig[]
}

export type ConfigHistoryAction =
  | { type: 'SET'; next: SiteConfig | ((prev: SiteConfig) => SiteConfig) }
  | { type: 'RESET'; next: SiteConfig }
  | { type: 'UNDO' }
  | { type: 'REDO' }

export function configHistoryReducer(
  state: ConfigHistoryState,
  action: ConfigHistoryAction
): ConfigHistoryState {
  switch (action.type) {
    case 'SET': {
      const resolved =
        typeof action.next === 'function' ? action.next(state.present) : action.next
      if (resolved === state.present) return state
      const past = [...state.past, state.present].slice(-MAX_HISTORY_ENTRIES)
      return {
        past,
        present: resolved,
        future: [],
      }
    }
    case 'RESET':
      return {
        past: [],
        present: action.next,
        future: [],
      }
    case 'UNDO': {
      if (state.past.length === 0) return state
      const previous = state.past[state.past.length - 1]
      return {
        past: state.past.slice(0, -1),
        present: previous,
        future: [state.present, ...state.future].slice(0, MAX_HISTORY_ENTRIES),
      }
    }
    case 'REDO': {
      if (state.future.length === 0) return state
      const [nextPresent, ...restFuture] = state.future
      return {
        past: [...state.past, state.present].slice(-MAX_HISTORY_ENTRIES),
        present: nextPresent,
        future: restFuture,
      }
    }
    default:
      return state
  }
}

export function useConfigHistory(initial: SiteConfig) {
  const [state, dispatch] = useReducer(configHistoryReducer, {
    past: [],
    present: initial,
    future: [],
  })

  const setConfig = useCallback(
    (next: SiteConfig | ((prev: SiteConfig) => SiteConfig)) => {
      dispatch({ type: 'SET', next })
    },
    []
  )

  const resetHistory = useCallback((next: SiteConfig) => {
    dispatch({ type: 'RESET', next })
  }, [])

  const undo = useCallback(() => {
    dispatch({ type: 'UNDO' })
  }, [])

  const redo = useCallback(() => {
    dispatch({ type: 'REDO' })
  }, [])

  return {
    config: state.present,
    setConfig,
    resetHistory,
    undo,
    redo,
    canUndo: state.past.length > 0,
    canRedo: state.future.length > 0,
  }
}

let sectionCounter = 0

export function createUniqueSectionId(prefix: string): string {
  sectionCounter += 1
  return `${prefix}-${Date.now().toString(36)}-${sectionCounter}`
}

export function createSectionFromModule(type: SectionType): SectionConfig {
  const def = MODULE_CATALOG.find((m) => m.type === type)
  return {
    id: createUniqueSectionId(type),
    type,
    variant: def?.defaultVariant ?? 'default',
    visible: true,
    content: def ? def.createDefaultContent() : {},
  }
}
