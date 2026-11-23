'use client'

import type { ReactNode } from 'react'

type Target = 'announcement' | 'header' | 'footer'

type Props = {
  target: Target
  onSelectChrome?: (target: Target) => void
  title?: string
  children: ReactNode
}

export default function ChromeRegion({ target, onSelectChrome, title, children }: Props) {
  if (!onSelectChrome) {
    return <>{children}</>
  }

  return (
    <div
      onClick={(e) => {
        e.stopPropagation()
        onSelectChrome(target)
      }}
      onClickCapture={(e) => {
        if ((e.target as HTMLElement | null)?.closest('a')) {
          e.preventDefault()
        }
      }}
      title={title}
      style={{ cursor: 'pointer', position: 'relative' }}
    >
      {children}
    </div>
  )
}
