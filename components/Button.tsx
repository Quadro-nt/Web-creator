import React from 'react'

type ButtonShape = 'square' | 'rounded' | 'pill'
type ButtonStyle = 'filled' | 'outlined' | 'text'

interface ButtonProps {
  shape: ButtonShape
  style: ButtonStyle
  children: React.ReactNode
  onClick?: () => void
  href?: string
  className?: string
  disabled?: boolean
}

const shapeStyles: Record<ButtonShape, React.CSSProperties> = {
  square: { borderRadius: 0 },
  rounded: { borderRadius: '4px' },
  pill: { borderRadius: '9999px' },
}

const styleStyles: Record<ButtonStyle, React.CSSProperties> = {
  filled: {
    background: 'var(--color-accent)',
    color: 'var(--color-on-accent, var(--color-bg))',
    border: 'none',
  },
  outlined: {
    background: 'transparent',
    color: 'var(--color-accent)',
    border: '2px solid var(--color-accent)',
  },
  text: {
    background: 'transparent',
    color: 'var(--color-accent)',
    border: 'none',
  },
}

const baseStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '0.62em 1.35em',
  cursor: 'pointer',
  fontFamily: 'var(--font-body)',
  fontSize: 'var(--text-base)',
  fontWeight: 500,
  textDecoration: 'none',
  lineHeight: 1,
}

export function Button({
  shape,
  style,
  children,
  onClick,
  href,
  className,
  disabled,
}: ButtonProps) {
  const combinedStyle: React.CSSProperties = {
    ...baseStyle,
    ...shapeStyles[shape],
    ...styleStyles[style],
    ...(disabled ? { opacity: 0.5, cursor: 'not-allowed' } : {}),
  }

  const dataAttrs = {
    'data-shape': shape,
    'data-style': style,
  }

  if (href) {
    return (
      <a href={href} style={combinedStyle} className={className} {...dataAttrs}>
        {children}
      </a>
    )
  }

  return (
    <button
      onClick={disabled ? undefined : onClick}
      style={combinedStyle}
      className={className}
      disabled={disabled}
      {...dataAttrs}
    >
      {children}
    </button>
  )
}
