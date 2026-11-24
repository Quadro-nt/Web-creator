'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export type StudioTopBarProps = {
  artistSlug: string
  displayName?: string | null
  userEmail: string
}

/** Compact authenticated studio top bar with site badge, public link, and logout action. */
export default function StudioTopBar({
  artistSlug,
  displayName,
  userEmail,
}: StudioTopBarProps) {
  const router = useRouter()
  const [loggingOut, setLoggingOut] = useState(false)

  const trimmedName = displayName?.trim()
  const subdomainLabel = `${artistSlug}.quadro-nt.com`

  async function handleLogout() {
    if (loggingOut) return
    setLoggingOut(true)
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
    } finally {
      setLoggingOut(false)
      router.push('/login')
      router.refresh()
    }
  }

  return (
    <nav
      aria-label="Quadro Studio"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '0.75rem',
        minHeight: '44px',
        padding: '0.35rem 1rem',
        backgroundColor: '#121214',
        color: '#F4F4F5',
        borderBottom: '1px solid #27272A',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        boxSizing: 'border-box',
        flexWrap: 'wrap',
      }}
    >
      <style>{`
        .studio-topbar-email {
          display: inline;
        }
        @media (max-width: 768px) {
          .studio-topbar-email {
            display: none;
          }
        }
      `}</style>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0 }}>
        <Link
          href="/"
          style={{
            color: '#F4F4F5',
            textDecoration: 'none',
            fontSize: '0.78rem',
            fontWeight: 700,
            letterSpacing: '0.08em',
            whiteSpace: 'nowrap',
          }}
        >
          QUADRO STUDIO
        </Link>

        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.35rem',
            backgroundColor: '#1E1E22',
            border: '1px solid #27272A',
            color: '#D4D4D8',
            borderRadius: '9999px',
            padding: '0.16rem 0.65rem',
            fontSize: '0.74rem',
            whiteSpace: 'nowrap',
          }}
        >
          {trimmedName ? (
            <>
              <span style={{ color: '#F4F4F5', fontWeight: 500 }}>{trimmedName}</span>
              <span aria-hidden="true" style={{ color: '#71717A' }}>
                ·
              </span>
            </>
          ) : null}
          <span>{subdomainLabel}</span>
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
        <a
          href={`/sites/${artistSlug}`}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            color: '#F4F4F5',
            textDecoration: 'none',
            fontSize: '0.76rem',
            fontWeight: 500,
            padding: '0.26rem 0.65rem',
            borderRadius: '6px',
            border: '1px solid #3F3F46',
            backgroundColor: 'transparent',
            whiteSpace: 'nowrap',
          }}
        >
          Ver sitio público ↗
        </a>

        <span
          className="studio-topbar-email"
          style={{
            fontSize: '0.76rem',
            color: '#A1A1AA',
            whiteSpace: 'nowrap',
          }}
        >
          {userEmail}
        </span>

        <button
          type="button"
          onClick={() => void handleLogout()}
          disabled={loggingOut}
          style={{
            backgroundColor: '#27272A',
            color: '#F4F4F5',
            border: '1px solid #3F3F46',
            borderRadius: '6px',
            padding: '0.26rem 0.65rem',
            fontSize: '0.76rem',
            fontWeight: 500,
            cursor: loggingOut ? 'wait' : 'pointer',
            opacity: loggingOut ? 0.7 : 1,
            fontFamily: 'inherit',
            whiteSpace: 'nowrap',
          }}
        >
          Cerrar sesión
        </button>
      </div>
    </nav>
  )
}
