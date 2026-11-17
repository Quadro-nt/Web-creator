import { useRef, useState, useEffect, type RefObject } from 'react'

function checkReducedMotion(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export function getScrollRevealClasses(variant: 'none' | 'soft' | 'bold'): string {
  if (variant === 'none') return ''
  if (checkReducedMotion()) return ''
  return variant === 'soft' ? 'qs-scroll-reveal-soft' : 'qs-scroll-reveal-bold'
}

export function useScrollReveal(variant: 'none' | 'soft' | 'bold'): {
  ref: RefObject<HTMLDivElement>
  className: string
} {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)
  const baseClass = getScrollRevealClasses(variant)

  useEffect(() => {
    if (!ref.current || !baseClass) return
    const el = ref.current
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          observer.disconnect()
        }
      },
      { threshold: 0.1 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [baseClass])

  return {
    ref,
    className: visible ? `${baseClass} qs-scroll-reveal-visible` : baseClass,
  }
}
