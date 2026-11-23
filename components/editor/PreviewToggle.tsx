'use client'

import type { Viewport } from '@/app/editor/[token]/EditorConfig'

type Props = {
  viewport: Viewport
  onChange: (v: Viewport) => void
}

const btnStyle = (active: boolean): React.CSSProperties => ({
  display: 'inline-flex',
  alignItems: 'center',
  gap: '0.4rem',
  padding: '0.4rem 0.75rem',
  border: '1px solid #d4d4d8',
  borderRadius: '6px',
  background: active ? '#111827' : '#ffffff',
  color: active ? '#ffffff' : '#111827',
  cursor: 'pointer',
  fontSize: '0.8rem',
  fontFamily: 'inherit',
})

export default function PreviewToggle({ viewport, onChange }: Props) {
  return (
    <div style={{ display: 'inline-flex', gap: '0.5rem' }} role="group" aria-label="Viewport">
      <button
        type="button"
        aria-pressed={viewport === 'desktop'}
        aria-label="Vista escritorio"
        onClick={() => onChange('desktop')}
        style={btnStyle(viewport === 'desktop')}
      >
        <DesktopIcon />
        <span>Escritorio</span>
      </button>
      <button
        type="button"
        aria-pressed={viewport === 'tablet'}
        aria-label="Vista tablet"
        onClick={() => onChange('tablet')}
        style={btnStyle(viewport === 'tablet')}
      >
        <TabletIcon />
        <span>Tablet</span>
      </button>
      <button
        type="button"
        aria-pressed={viewport === 'mobile'}
        aria-label="Vista móvil"
        onClick={() => onChange('mobile')}
        style={btnStyle(viewport === 'mobile')}
      >
        <MobileIcon />
        <span>Móvil</span>
      </button>
    </div>
  )
}

function DesktopIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <rect x="2" y="3" width="20" height="14" rx="2" />
      <line x1="8" y1="21" x2="16" y2="21" />
      <line x1="12" y1="17" x2="12" y2="21" />
    </svg>
  )
}

function TabletIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <rect x="4" y="2" width="16" height="20" rx="2" />
      <line x1="11" y1="18" x2="13" y2="18" />
    </svg>
  )
}

function MobileIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <rect x="6" y="2" width="12" height="20" rx="2" />
      <line x1="11" y1="18" x2="13" y2="18" />
    </svg>
  )
}
