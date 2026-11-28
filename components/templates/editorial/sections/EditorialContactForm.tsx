'use client'

import { useState, type FormEvent } from 'react'

type Props = {
  email: string
  siteTitle?: string
}

export default function EditorialContactForm({ email, siteTitle }: Props) {
  const [name, setName] = useState('')
  const [senderEmail, setSenderEmail] = useState('')
  const [message, setMessage] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const [mailtoHref, setMailtoHref] = useState('')

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const cleanName = name.trim()
    const cleanSender = senderEmail.trim()
    const cleanMessage = message.trim()

    if (!cleanName || !cleanMessage) {
      setErrorMsg('Por favor ingresa tu nombre y mensaje.')
      return
    }

    setErrorMsg('')
    const subject = `Consulta desde ${siteTitle || 'tu portafolio'} — ${cleanName}`
    const bodyLines = [
      `Nombre: ${cleanName}`,
      ...(cleanSender ? [`Correo: ${cleanSender}`] : []),
      '',
      cleanMessage,
    ]
    const href = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(bodyLines.join('\n'))}`
    setMailtoHref(href)

    if (typeof window !== 'undefined' && !/jsdom/i.test(navigator.userAgent)) {
      window.location.href = href
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div style={{ marginBottom: '2rem' }}>
        <label
          htmlFor="ed-contact-name"
          style={{
            display: 'block',
            marginBottom: '0.5rem',
            fontSize: '0.75rem',
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            opacity: 0.9,
          }}
        >
          Nombre
        </label>
        <input
          id="ed-contact-name"
          name="nombre"
          type="text"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={{
            width: '100%',
            padding: '0.75rem 0',
            border: 'none',
            borderBottom: '1px solid currentColor',
            background: 'transparent',
            color: 'var(--color-bg)',
            fontSize: 'var(--text-base)',
          }}
        />
      </div>

      <div style={{ marginBottom: '2rem' }}>
        <label
          htmlFor="ed-contact-email"
          style={{
            display: 'block',
            marginBottom: '0.5rem',
            fontSize: '0.75rem',
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            opacity: 0.9,
          }}
        >
          Tu correo (opcional)
        </label>
        <input
          id="ed-contact-email"
          name="correo"
          type="email"
          value={senderEmail}
          onChange={(e) => setSenderEmail(e.target.value)}
          style={{
            width: '100%',
            padding: '0.75rem 0',
            border: 'none',
            borderBottom: '1px solid currentColor',
            background: 'transparent',
            color: 'var(--color-bg)',
            fontSize: 'var(--text-base)',
          }}
        />
      </div>

      <div style={{ marginBottom: '2rem' }}>
        <label
          htmlFor="ed-contact-message"
          style={{
            display: 'block',
            marginBottom: '0.5rem',
            fontSize: '0.75rem',
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            opacity: 0.9,
          }}
        >
          Mensaje
        </label>
        <textarea
          id="ed-contact-message"
          name="mensaje"
          rows={4}
          required
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          style={{
            width: '100%',
            padding: '0.75rem 0',
            border: 'none',
            borderBottom: '1px solid currentColor',
            background: 'transparent',
            color: 'var(--color-bg)',
            fontSize: 'var(--text-base)',
            resize: 'none',
          }}
        />
      </div>

      <button
        type="submit"
        style={{
          padding: '0.9rem 3rem',
          backgroundColor: 'var(--color-accent)',
          color: 'var(--color-on-accent, #ffffff)',
          border: 'none',
          cursor: 'pointer',
          fontSize: '0.8rem',
          letterSpacing: '0.15em',
          textTransform: 'uppercase',
          fontWeight: 600,
        }}
      >
        Enviar
      </button>

      {errorMsg && (
        <p role="alert" style={{ margin: '1rem 0 0', fontSize: '0.875rem', opacity: 0.95 }}>
          {errorMsg}
        </p>
      )}

      {mailtoHref && (
        <p role="status" aria-live="polite" style={{ margin: '1rem 0 0', fontSize: '0.875rem', lineHeight: 1.5, opacity: 0.92 }}>
          Mensaje preparado para <strong>{email}</strong>.{' '}
          <a
            href={mailtoHref}
            style={{ color: 'inherit', textDecoration: 'underline', fontWeight: 600 }}
          >
            Abrir en tu cliente de correo
          </a>
        </p>
      )}
    </form>
  )
}
