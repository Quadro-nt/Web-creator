import React from 'react'

type ContentWidth = 'narrow' | 'mid' | 'full'

interface ContentWrapperProps {
  width: ContentWidth
  children: React.ReactNode
  className?: string
}

const widthStyles: Record<ContentWidth, React.CSSProperties> = {
  narrow: { maxWidth: '640px', margin: 'auto' },
  mid: { maxWidth: '960px', margin: 'auto' },
  full: { width: '100%' },
}

export function ContentWrapper({ width, children, className }: ContentWrapperProps) {
  return (
    <div style={widthStyles[width]} className={className} data-width={width}>
      {children}
    </div>
  )
}
