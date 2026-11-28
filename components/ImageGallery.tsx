'use client'

import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'

type Props = {
  images: string[]
  alt: string
  dimensions?: string
}

const REFERENCE_WALL_WIDTH_CM = 260
const REFERENCE_WALL_HEIGHT_CM = 185

export type ParsedDimensionsCm = {
  widthCm: number
  heightCm: number
}

/** Parses an artwork dimensions string (e.g. "120 x 90 cm" or "80 × 60 cm") into centimeters. */
export function parseDimensionsCm(dimensions?: string): ParsedDimensionsCm | null {
  if (!dimensions || typeof dimensions !== 'string') return null
  const normalized = dimensions.trim().toLowerCase()
  const match = normalized.match(
    /(\d+(?:[.,]\d+)?)\s*[x×*]\s*(\d+(?:[.,]\d+)?)(?:\s*[x×*]\s*\d+(?:[.,]\d+)?)?\s*(mm|cm|m)?/i
  )
  if (!match) return null

  const rawWidth = Number.parseFloat(match[1].replace(',', '.'))
  const rawHeight = Number.parseFloat(match[2].replace(',', '.'))
  if (!Number.isFinite(rawWidth) || !Number.isFinite(rawHeight) || rawWidth <= 0 || rawHeight <= 0) {
    return null
  }

  const unit = (match[3] ?? 'cm').toLowerCase()
  const multiplier = unit === 'mm' ? 0.1 : unit === 'm' ? 100 : 1
  return {
    widthCm: rawWidth * multiplier,
    heightCm: rawHeight * multiplier,
  }
}

export function ImageGallery({ images, alt, dimensions }: Props) {
  const [activeIndex, setActiveIndex] = useState(0)
  const [viewMode, setViewMode] = useState<'gallery' | 'room'>('gallery')
  const [lightboxOpen, setLightboxOpen] = useState(false)

  const zoomBtnRef = useRef<HTMLButtonElement | null>(null)
  const imageTriggerRef = useRef<HTMLButtonElement | null>(null)
  const lastTriggerRef = useRef<HTMLElement | null>(null)
  const closeBtnRef = useRef<HTMLButtonElement | null>(null)
  const wasOpenRef = useRef(false)

  useEffect(() => {
    if (lightboxOpen) {
      wasOpenRef.current = true
      closeBtnRef.current?.focus()
      const prevOverflow = document.body.style.overflow
      document.body.style.overflow = 'hidden'

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          e.preventDefault()
          setLightboxOpen(false)
        } else if (e.key === 'ArrowLeft' && images.length > 1) {
          e.preventDefault()
          setActiveIndex((prev) => (prev - 1 + images.length) % images.length)
        } else if (e.key === 'ArrowRight' && images.length > 1) {
          e.preventDefault()
          setActiveIndex((prev) => (prev + 1) % images.length)
        }
      }

      window.addEventListener('keydown', handleKeyDown)
      return () => {
        document.body.style.overflow = prevOverflow
        window.removeEventListener('keydown', handleKeyDown)
      }
    } else if (wasOpenRef.current) {
      wasOpenRef.current = false
      lastTriggerRef.current?.focus()
    }
  }, [lightboxOpen, images.length])

  if (images.length === 0) return null

  const mainImage = images[activeIndex] ?? images[0]
  const parsedDims = parseDimensionsCm(dimensions)

  const openLightbox = (trigger: HTMLElement | null) => {
    lastTriggerRef.current = trigger ?? (document.activeElement as HTMLElement | null) ?? zoomBtnRef.current
    setLightboxOpen(true)
  }

  const fitScale = parsedDims
    ? Math.min(1, 215 / parsedDims.widthCm, 130 / parsedDims.heightCm)
    : 1
  const wallSpanCm = Math.round(REFERENCE_WALL_WIDTH_CM / fitScale)
  const artWidthPct = parsedDims ? (parsedDims.widthCm / wallSpanCm) * 100 : 40

  const controlButtonStyle = (active = false): React.CSSProperties => ({
    padding: '0.45rem 0.9rem',
    border: '1px solid currentColor',
    borderRadius: 'var(--radius-card, 4px)',
    backgroundColor: active ? 'var(--color-text, #1a1a1a)' : 'transparent',
    color: active ? 'var(--color-bg, #ffffff)' : 'inherit',
    fontSize: '0.8rem',
    fontWeight: 500,
    letterSpacing: '0.04em',
    cursor: 'pointer',
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center', width: '100%' }}>
      {viewMode === 'room' && parsedDims ? (
        <figure style={{ margin: 0, width: '100%' }}>
          <div
            aria-label={`Vista en sala de ${alt} (${dimensions})`}
            style={{
              position: 'relative',
              width: '100%',
              aspectRatio: `${REFERENCE_WALL_WIDTH_CM} / ${REFERENCE_WALL_HEIGHT_CM}`,
              background: 'radial-gradient(circle at 50% 25%, #f9f7f2 0%, #eae5da 72%, #ded8cb 100%)',
              borderRadius: 'var(--radius-media, 4px)',
              border: '1px solid rgba(128,128,128,0.25)',
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              paddingBottom: '7%',
              boxSizing: 'border-box',
            }}
          >
            <div
              style={{
                width: `${artWidthPct}%`,
                aspectRatio: `${parsedDims.widthCm} / ${parsedDims.heightCm}`,
                border: '3px solid #1e1e1e',
                padding: '4px',
                backgroundColor: '#ffffff',
                boxShadow: '0 14px 30px rgba(0,0,0,0.22), 0 3px 8px rgba(0,0,0,0.12)',
                boxSizing: 'border-box',
                position: 'relative',
              }}
            >
              <img
                src={mainImage}
                alt={alt}
                style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
              />
            </div>

            <div
              aria-hidden="true"
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                bottom: 0,
                height: '8%',
                background: 'linear-gradient(180deg, #e2dcd0 0%, #d4cdbf 100%)',
                borderTop: '1px solid rgba(0,0,0,0.12)',
              }}
            />
          </div>
          <figcaption
            style={{
              marginTop: '0.6rem',
              textAlign: 'center',
              fontSize: '0.8rem',
              opacity: 0.78,
            }}
          >
            {dimensions} · Pared de referencia: {wallSpanCm} cm
          </figcaption>
        </figure>
      ) : (
        <div
          style={{
            width: '100%',
            display: 'flex',
            justifyContent: 'center',
            backgroundColor: 'var(--color-surface, rgba(128,128,128,0.06))',
            borderRadius: 'var(--radius-media, 4px)',
            padding: '1rem',
            boxSizing: 'border-box',
          }}
        >
          <button
            ref={imageTriggerRef}
            type="button"
            onClick={() => openLightbox(imageTriggerRef.current)}
            aria-label={`Ampliar ${alt}`}
            style={{
              padding: 0,
              border: 'none',
              background: 'transparent',
              cursor: 'zoom-in',
              display: 'block',
              maxWidth: '100%',
              lineHeight: 0,
            }}
          >
            <Image
              src={mainImage}
              alt={alt}
              width={500}
              height={600}
              unoptimized
              style={{ maxWidth: '100%', height: 'auto', objectFit: 'contain', display: 'block' }}
            />
          </button>
        </div>
      )}

      <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', justifyContent: 'center' }}>
        <button
          ref={zoomBtnRef}
          type="button"
          onClick={() => openLightbox(zoomBtnRef.current)}
          style={controlButtonStyle(false)}
        >
          Ampliar obra
        </button>
        {parsedDims && (
          <button
            type="button"
            aria-pressed={viewMode === 'room'}
            onClick={() => setViewMode((prev) => (prev === 'room' ? 'gallery' : 'room'))}
            style={controlButtonStyle(viewMode === 'room')}
          >
            Ver en sala
          </button>
        )}
      </div>

      {images.length > 1 && (
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'center' }}>
          {images.map((src, idx) => (
            <button
              key={src}
              type="button"
              onClick={() => setActiveIndex(idx)}
              aria-label={`Ver imagen ${idx + 1}`}
              style={{
                padding: 0,
                border: idx === activeIndex ? '2px solid var(--color-accent)' : '2px solid transparent',
                background: 'transparent',
                cursor: 'pointer',
                lineHeight: 0,
              }}
            >
              <Image
                src={src}
                alt={`${alt} - miniatura ${idx + 1}`}
                width={80}
                height={80}
                unoptimized
                style={{ objectFit: 'cover', display: 'block' }}
              />
            </button>
          ))}
        </div>
      )}

      {lightboxOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Vista ampliada de ${alt}`}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setLightboxOpen(false)
            }
          }}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            backgroundColor: 'rgba(10, 10, 10, 0.92)',
            color: '#f5f5f5',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.5rem',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: '1rem',
              right: '1.25rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
            }}
          >
            {images.length > 1 && (
              <span style={{ fontSize: '0.85rem', opacity: 0.85 }}>
                {activeIndex + 1} / {images.length}
              </span>
            )}
            <button
              ref={closeBtnRef}
              type="button"
              aria-label="Cerrar vista ampliada"
              onClick={() => setLightboxOpen(false)}
              style={{
                background: 'rgba(255,255,255,0.12)',
                color: '#ffffff',
                border: '1px solid rgba(255,255,255,0.3)',
                borderRadius: '9999px',
                width: '2.25rem',
                height: '2.25rem',
                fontSize: '1rem',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              ✕
            </button>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '1rem',
              maxWidth: '94vw',
              maxHeight: '84vh',
            }}
          >
            {images.length > 1 && (
              <button
                type="button"
                aria-label="Imagen anterior"
                onClick={() => setActiveIndex((prev) => (prev - 1 + images.length) % images.length)}
                style={{
                  background: 'rgba(255,255,255,0.12)',
                  color: '#ffffff',
                  border: '1px solid rgba(255,255,255,0.3)',
                  borderRadius: '9999px',
                  width: '2.5rem',
                  height: '2.5rem',
                  fontSize: '1.2rem',
                  cursor: 'pointer',
                  flexShrink: 0,
                }}
              >
                ‹
              </button>
            )}

            <img
              src={mainImage}
              alt={alt}
              style={{
                maxWidth: images.length > 1 ? '80vw' : '90vw',
                maxHeight: '82vh',
                objectFit: 'contain',
                display: 'block',
              }}
            />

            {images.length > 1 && (
              <button
                type="button"
                aria-label="Imagen siguiente"
                onClick={() => setActiveIndex((prev) => (prev + 1) % images.length)}
                style={{
                  background: 'rgba(255,255,255,0.12)',
                  color: '#ffffff',
                  border: '1px solid rgba(255,255,255,0.3)',
                  borderRadius: '9999px',
                  width: '2.5rem',
                  height: '2.5rem',
                  fontSize: '1.2rem',
                  cursor: 'pointer',
                  flexShrink: 0,
                }}
              >
                ›
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
