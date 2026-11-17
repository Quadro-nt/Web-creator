function checkReducedMotion(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export interface HoverClasses {
  container: string
  overlay?: string
}

export function getHoverClasses(variant: 'zoom' | 'info' | 'none'): HoverClasses {
  if (variant === 'none') return { container: '' }

  if (checkReducedMotion()) {
    return {
      container: 'qs-hover-reduced',
      overlay: variant === 'info' ? 'qs-hover-info-overlay' : undefined,
    }
  }

  if (variant === 'zoom') {
    return { container: 'qs-hover-zoom' }
  }

  return { container: 'qs-hover-info', overlay: 'qs-hover-info-overlay' }
}
