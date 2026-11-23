import type { CSSProperties } from 'react'

export const STUDIO_COLORS = {
  chrome: '#f8fafc',
  surface: '#ffffff',
  border: '#e2e8f0',
  inputBorder: '#cbd5e1',
  primary: '#0f172a',
  accent: '#4f46e5',
  accentSoft: '#eef2ff',
  text: '#0f172a',
  muted: '#64748b',
  danger: '#b91c1c',
  dangerSoft: '#fef2f2',
  success: '#047857',
  successSoft: '#ecfdf5',
} as const

export const studioCardStyle: CSSProperties = {
  border: `1px solid ${STUDIO_COLORS.border}`,
  borderRadius: '8px',
  background: STUDIO_COLORS.surface,
  padding: '0.75rem',
}

export const studioLabelStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.25rem',
  fontSize: '0.75rem',
  fontWeight: 500,
  color: '#334155',
}

export const studioInputStyle: CSSProperties = {
  width: '100%',
  boxSizing: 'border-box',
  padding: '0.45rem 0.55rem',
  border: `1px solid ${STUDIO_COLORS.inputBorder}`,
  borderRadius: '6px',
  fontSize: '0.82rem',
  background: STUDIO_COLORS.surface,
  color: STUDIO_COLORS.text,
  fontFamily: 'inherit',
}

export const studioSelectStyle: CSSProperties = {
  ...studioInputStyle,
  cursor: 'pointer',
}

export const studioTextareaStyle: CSSProperties = {
  ...studioInputStyle,
  resize: 'vertical',
  lineHeight: 1.5,
}

export const studioPrimaryBtn: CSSProperties = {
  padding: '0.45rem 0.85rem',
  background: STUDIO_COLORS.primary,
  color: '#ffffff',
  border: `1px solid ${STUDIO_COLORS.primary}`,
  borderRadius: '6px',
  fontSize: '0.8rem',
  fontWeight: 500,
  cursor: 'pointer',
  fontFamily: 'inherit',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '0.35rem',
}

export const studioSecondaryBtn: CSSProperties = {
  padding: '0.45rem 0.85rem',
  background: STUDIO_COLORS.surface,
  color: STUDIO_COLORS.text,
  border: `1px solid ${STUDIO_COLORS.inputBorder}`,
  borderRadius: '6px',
  fontSize: '0.8rem',
  fontWeight: 500,
  cursor: 'pointer',
  fontFamily: 'inherit',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '0.35rem',
}

export function studioIconBtn(disabled = false): CSSProperties {
  return {
    width: '26px',
    height: '26px',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: `1px solid ${STUDIO_COLORS.inputBorder}`,
    borderRadius: '5px',
    background: disabled ? '#f1f5f9' : STUDIO_COLORS.surface,
    color: disabled ? '#94a3b8' : STUDIO_COLORS.text,
    cursor: disabled ? 'not-allowed' : 'pointer',
    fontSize: '0.78rem',
    lineHeight: 1,
    padding: 0,
    fontFamily: 'inherit',
  }
}
