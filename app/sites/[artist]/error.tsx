'use client'

import { useEffect } from 'react'

export default function ArtistSiteError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[sites/[artist]] render error:', error)
  }, [error])

  return (
    <main
      style={{
        padding: '4rem 2rem',
        textAlign: 'center',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        color: '#1a1a1a',
        background: '#faf7f2',
        minHeight: '60vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.75rem',
      }}
    >
      <h1 style={{ fontSize: '1.5rem', margin: 0 }}>No pudimos mostrar este sitio</h1>
      <p style={{ margin: 0, maxWidth: '36rem', color: '#52525b' }}>
        Hubo un problema al cargar el sitio del artista. Si acabás de publicar cambios,
        probá recargar en unos segundos.
      </p>
      {error.digest ? (
        <p style={{ margin: 0, fontSize: '0.75rem', color: '#a1a1aa' }}>
          Referencia: {error.digest}
        </p>
      ) : null}
      <button
        type="button"
        onClick={() => reset()}
        style={{
          marginTop: '0.75rem',
          padding: '0.5rem 1rem',
          background: '#1a1a1a',
          color: '#fff',
          border: 'none',
          borderRadius: '6px',
          cursor: 'pointer',
          fontSize: '0.875rem',
        }}
      >
        Reintentar
      </button>
    </main>
  )
}
