'use client'

import { useState } from 'react'
import type { SectionConfig, SiteConfig } from '@/lib/schemas/site-config.schema'
import { ContentWrapper } from '@/components/ContentWrapper'

type Props = {
  section: SectionConfig
  config: SiteConfig
  artistSlug: string
  inPreview?: boolean
}

export default function NewsletterSection({ section, config, artistSlug, inPreview = false }: Props) {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'duplicate' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  const heading = (section.content.heading as string) || 'ÚNETE AL CLUB DEL TALLER'
  const description = (section.content.description as string) || ''
  const placeholder = (section.content.placeholder as string) || 'Tu correo electrónico'
  const buttonText = (section.content.buttonText as string) || 'Suscribirme'
  const isFramed = section.variant !== 'minimal'

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const clean = email.trim()
    if (!clean) return
    if (inPreview) {
      setStatus('success')
      setEmail('')
      return
    }

    setStatus('loading')
    setErrorMsg('')
    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ artistSlug, email: clean }),
      })
      const data = (await res.json().catch(() => ({}))) as {
        alreadySubscribed?: boolean
        error?: string
      }
      if (!res.ok) {
        throw new Error(data.error ?? 'No se pudo completar la suscripción')
      }
      setStatus(data.alreadySubscribed ? 'duplicate' : 'success')
      setEmail('')
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Error enviando suscripción')
      setStatus('error')
    }
  }

  return (
    <section className="qs-section-pad" style={{ padding: '4rem 2rem' }}>
      <ContentWrapper width={config.sizes.contentWidth}>
        <div
          style={{
            maxWidth: '760px',
            margin: '0 auto',
            textAlign: 'center',
            padding: isFramed ? '3rem 2rem' : '1.5rem 1rem',
            border: isFramed ? '1px solid currentColor' : 'none',
            borderRadius: isFramed ? 'var(--radius-card)' : undefined,
          }}
        >
          <h2 style={{ margin: '0 0 0.75rem', fontSize: 'var(--text-3xl)', fontWeight: 700 }}>
            {heading}
          </h2>
          {description && (
            <p style={{ margin: '0 auto 1.75rem', maxWidth: '540px', opacity: 0.78, lineHeight: 1.65 }}>
              {description}
            </p>
          )}

          <form
            onSubmit={(e) => void handleSubmit(e)}
            style={{
              display: 'flex',
              maxWidth: '460px',
              margin: '0 auto',
              gap: '0.5rem',
              flexWrap: 'wrap',
              justifyContent: 'center',
            }}
          >
            <input
              type="email"
              required
              aria-label="Correo electrónico para newsletter"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={placeholder}
              style={{
                flex: '1 1 220px',
                padding: '0.75rem 1rem',
                border: '1px solid currentColor',
                borderRadius: 'var(--radius-card)',
                background: 'transparent',
                color: 'inherit',
                fontSize: 'var(--text-base)',
                fontFamily: 'inherit',
              }}
            />
            <button
              type="submit"
              disabled={status === 'loading'}
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: 'var(--color-accent)',
                color: 'var(--color-bg)',
                border: '1px solid var(--color-accent)',
                borderRadius: 'var(--radius-card)',
                fontSize: 'var(--text-sm)',
                fontWeight: 700,
                cursor: status === 'loading' ? 'wait' : 'pointer',
                fontFamily: 'inherit',
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
              }}
            >
              {status === 'loading' ? 'Enviando…' : `${buttonText} →`}
            </button>
          </form>

          {status === 'success' && (
            <p style={{ margin: '1rem 0 0', fontSize: 'var(--text-sm)', color: 'var(--color-accent)', fontWeight: 600 }}>
              {inPreview
                ? 'Vista previa: suscripción simulada correctamente.'
                : '¡Gracias por sumarte! Ya estás en la lista del taller.'}
            </p>
          )}
          {status === 'duplicate' && (
            <p style={{ margin: '1rem 0 0', fontSize: 'var(--text-sm)', opacity: 0.8 }}>
              Este correo ya estaba suscrito.
            </p>
          )}
          {status === 'error' && (
            <p role="alert" style={{ margin: '1rem 0 0', fontSize: 'var(--text-sm)', color: '#dc2626' }}>
              {errorMsg}
            </p>
          )}
        </div>
      </ContentWrapper>
    </section>
  )
}
