import { useState, useEffect } from 'react'

function checkReducedMotion(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export function getPageTransitionClass(variant: 'none' | 'fade'): string {
  if (variant === 'none') return ''
  if (checkReducedMotion()) return ''
  return 'qs-page-transition-fade'
}

export function usePageTransition(variant: 'none' | 'fade'): string {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (variant === 'none' || checkReducedMotion()) return ''
  return mounted ? 'qs-page-transition-visible' : 'qs-page-transition-fade'
}
