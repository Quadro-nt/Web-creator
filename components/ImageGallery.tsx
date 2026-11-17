'use client'

import Image from 'next/image'
import { useState } from 'react'

type Props = {
  images: string[]
  alt: string
}

export function ImageGallery({ images, alt }: Props) {
  const [activeIndex, setActiveIndex] = useState(0)

  if (images.length === 0) return null

  const mainImage = images[activeIndex] ?? images[0]

  if (images.length === 1) {
    return (
      <div style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
        <Image
          src={mainImage}
          alt={alt}
          width={500}
          height={600}
          unoptimized
          style={{ maxWidth: '100%', height: 'auto', objectFit: 'contain' }}
        />
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center' }}>
      <Image
        src={mainImage}
        alt={alt}
        width={500}
        height={600}
        unoptimized
        style={{ maxWidth: '100%', height: 'auto', objectFit: 'contain' }}
      />
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
    </div>
  )
}
