import { describe, it, expect } from '@jest/globals'
import { defaultSiteConfig, type SiteConfig } from '@/lib/schemas/site-config.schema'
import {
  MAX_HISTORY_ENTRIES,
  configHistoryReducer,
  type ConfigHistoryState,
} from '../useConfigHistory'

function withTitle(title: string): SiteConfig {
  return {
    ...defaultSiteConfig,
    identity: { ...defaultSiteConfig.identity, siteTitle: title },
  }
}

describe('configHistoryReducer', () => {
  it('aplica cambios, deshace y rehace en orden', () => {
    let state: ConfigHistoryState = {
      past: [],
      present: withTitle('Paso 0'),
      future: [],
    }

    state = configHistoryReducer(state, { type: 'SET', next: withTitle('Paso 1') })
    state = configHistoryReducer(state, { type: 'SET', next: withTitle('Paso 2') })

    expect(state.present.identity.siteTitle).toBe('Paso 2')
    expect(state.past).toHaveLength(2)

    state = configHistoryReducer(state, { type: 'UNDO' })
    expect(state.present.identity.siteTitle).toBe('Paso 1')
    expect(state.future).toHaveLength(1)

    state = configHistoryReducer(state, { type: 'REDO' })
    expect(state.present.identity.siteTitle).toBe('Paso 2')
    expect(state.future).toHaveLength(0)
  })

  it('limpia el historial futuro al hacer un cambio tras deshacer', () => {
    let state: ConfigHistoryState = {
      past: [],
      present: withTitle('A'),
      future: [],
    }

    state = configHistoryReducer(state, { type: 'SET', next: withTitle('B') })
    state = configHistoryReducer(state, { type: 'UNDO' })
    expect(state.future).toHaveLength(1)

    state = configHistoryReducer(state, { type: 'SET', next: withTitle('C') })
    expect(state.present.identity.siteTitle).toBe('C')
    expect(state.future).toHaveLength(0)
  })

  it('limita el historial pasado al máximo configurado', () => {
    let state: ConfigHistoryState = {
      past: [],
      present: withTitle('Inicial'),
      future: [],
    }

    for (let i = 1; i <= MAX_HISTORY_ENTRIES + 15; i += 1) {
      state = configHistoryReducer(state, { type: 'SET', next: withTitle(`Paso ${i}`) })
    }

    expect(state.past).toHaveLength(MAX_HISTORY_ENTRIES)
    expect(state.present.identity.siteTitle).toBe(`Paso ${MAX_HISTORY_ENTRIES + 15}`)
  })
})
