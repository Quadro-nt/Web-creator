import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Quadro Sites — Crea tu portafolio de artista',
  description:
    'Crea tu sitio web y catálogo de obras con editor visual, asistente de IA y venta directa por WhatsApp en tu propio subdominio .quadro-nt.com.',
}

interface StepItem {
  number: string
  title: string
  description: string
}

interface TemplateItem {
  id: 'minimal-gallery' | 'editorial' | 'immersive'
  name: string
  subtitle: string
  description: string
  demoHref: string
  signupHref: string
  previewSurface: 'light' | 'warm' | 'dark'
  accentLabel: string
}

const STEPS: StepItem[] = [
  {
    number: '01',
    title: 'Crea tu cuenta y elige tu dirección .quadro-nt.com.',
    description:
      'Regístrate en segundos y reserva el subdominio con tu nombre artístico para que coleccionistas y galerías te encuentren fácilmente.',
  },
  {
    number: '02',
    title: 'Personaliza tu galería, sube tus obras y usa el asistente IA.',
    description:
      'Organiza tus piezas por serie, ajusta tipografía y paleta desde el editor visual y redacta textos curatoriales o biografías con apoyo de IA.',
  },
  {
    number: '03',
    title: 'Publica en un clic y recibe consultas directo en tu WhatsApp.',
    description:
      'Comparte tu portafolio al instante. Cada obra incluye un botón de consulta directa hacia tu WhatsApp sin intermediarios ni comisiones.',
  },
]

const TEMPLATES: TemplateItem[] = [
  {
    id: 'minimal-gallery',
    name: 'Minimal Gallery',
    subtitle: 'Luminosa y atemporal',
    description: 'Blanca, silenciosa, foco absoluto en cada obra.',
    demoHref: '/sites/luna-vega',
    signupHref: '/signup?template=minimal-gallery',
    previewSurface: 'light',
    accentLabel: 'luna-vega.quadro-nt.com',
  },
  {
    id: 'editorial',
    name: 'Editorial',
    subtitle: 'Ritmo de publicación',
    description: 'Narrativa curatorial y tipografía expresiva.',
    demoHref: '/sites/marco-torres',
    signupHref: '/signup?template=editorial',
    previewSurface: 'warm',
    accentLabel: 'marco-torres.quadro-nt.com',
  },
  {
    id: 'immersive',
    name: 'Immersive',
    subtitle: 'Atmósfera nocturna',
    description: 'Galería oscura de alto impacto visual.',
    demoHref: '/sites/sofia-rios',
    signupHref: '/signup?template=immersive',
    previewSurface: 'dark',
    accentLabel: 'sofia-rios.quadro-nt.com',
  },
]

function TemplateMiniPreview({ template }: { template: TemplateItem }) {
  if (template.previewSurface === 'dark') {
    return (
      <div className="relative overflow-hidden rounded-lg border border-[#2B2926] bg-[#161616] p-5 text-[#FAF8F5]">
        <div className="mb-4 flex items-center justify-between border-b border-white/10 pb-2.5 text-[10px] uppercase tracking-[0.2em] text-white/60">
          <span>{template.accentLabel}</span>
          <span className="h-1.5 w-1.5 rounded-full bg-[#B86B35]" />
        </div>
        <div className="grid grid-cols-12 gap-3">
          <div className="col-span-7 flex flex-col justify-between">
            <div className="font-serif text-lg leading-tight text-white">
              Luz y materia
            </div>
            <div className="mt-2 h-1.5 w-16 rounded-full bg-[#B86B35]" />
          </div>
          <div className="col-span-5 space-y-2">
            <div className="aspect-[4/5] rounded bg-gradient-to-br from-[#3A3530] via-[#26221F] to-[#B86B35]/40 p-2">
              <div className="h-full w-full rounded-sm border border-white/10" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (template.previewSurface === 'warm') {
    return (
      <div className="relative overflow-hidden rounded-lg border border-[#E6E1DA] bg-[#F5EFE6] p-5 text-[#161616]">
        <div className="mb-4 flex items-center justify-between border-b border-[#E6E1DA] pb-2.5 text-[10px] uppercase tracking-[0.2em] text-[#5C574F]">
          <span>{template.accentLabel}</span>
          <span className="font-serif italic text-[#9A5220]">N.º 02</span>
        </div>
        <div className="grid grid-cols-12 items-end gap-3">
          <div className="col-span-6 space-y-2">
            <div className="font-serif text-lg italic leading-tight text-[#161616]">
              Cuaderno de taller
            </div>
            <div className="space-y-1">
              <div className="h-1.5 w-full rounded-full bg-[#D8CFC2]" />
              <div className="h-1.5 w-4/5 rounded-full bg-[#D8CFC2]" />
            </div>
          </div>
          <div className="col-span-6">
            <div className="aspect-[4/3] rounded border border-[#E6E1DA] bg-gradient-to-tr from-[#E4D5C3] via-[#FAF8F5] to-[#B86B35]/30" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="relative overflow-hidden rounded-lg border border-[#E6E1DA] bg-[#FFFFFF] p-5 text-[#161616]">
      <div className="mb-4 flex items-center justify-between border-b border-[#E6E1DA] pb-2.5 text-[10px] uppercase tracking-[0.2em] text-[#5C574F]">
        <span>{template.accentLabel}</span>
        <span>03 obras</span>
      </div>
      <div className="grid grid-cols-3 gap-2.5">
        <div className="aspect-[3/4] rounded border border-[#E6E1DA] bg-[#FAF8F5] p-1.5">
          <div className="h-full w-full rounded-sm bg-gradient-to-b from-[#EDE7DD] to-[#D9CFC0]" />
        </div>
        <div className="aspect-[3/4] rounded border border-[#E6E1DA] bg-[#FAF8F5] p-1.5">
          <div className="h-full w-full rounded-sm bg-gradient-to-b from-[#E5DDD1] to-[#C8B9A6]" />
        </div>
        <div className="aspect-[3/4] rounded border border-[#E6E1DA] bg-[#FAF8F5] p-1.5">
          <div className="h-full w-full rounded-sm bg-gradient-to-b from-[#EFEAE2] to-[#B86B35]/25" />
        </div>
      </div>
    </div>
  )
}

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#FAF8F5] font-sans text-[#161616] antialiased selection:bg-[#9A5220]/20 selection:text-[#161616]">
      <a href="#main-content" className="qs-skip-link">
        Saltar al contenido principal
      </a>

      {/* Navbar fija/limpia */}
      <header className="sticky top-0 z-40 border-b border-[#E6E1DA] bg-[#FAF8F5]/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-4 sm:px-8">
          <Link
            href="/"
            className="text-xs font-semibold uppercase tracking-[0.24em] text-[#161616] transition-colors hover:text-[#9A5220] sm:text-sm"
          >
            Quadro Sites
          </Link>

          <nav
            aria-label="Navegación principal"
            className="hidden items-center gap-8 text-sm text-[#5C574F] md:flex"
          >
            <a
              href="#como-funciona"
              className="transition-colors hover:text-[#161616]"
            >
              Cómo funciona
            </a>
            <a
              href="#plantillas"
              className="transition-colors hover:text-[#161616]"
            >
              Plantillas
            </a>
          </nav>

          <div className="flex items-center gap-2.5 sm:gap-3">
            <Link
              href="/login"
              className="rounded-full border border-[#E6E1DA] bg-[#FFFFFF] px-3.5 py-2 text-xs font-medium text-[#161616] transition-colors hover:border-[#161616] sm:px-4 sm:text-sm"
            >
              Iniciar sesión
            </Link>
            <Link
              href="/signup"
              className="rounded-full bg-[#9A5220] px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-[#7E4118] sm:px-5 sm:text-sm"
            >
              Crear mi sitio
            </Link>
          </div>
        </div>
      </header>

      <main id="main-content">
        {/* Hero principal */}
        <section className="border-b border-[#E6E1DA]">
          <div className="mx-auto grid max-w-6xl gap-12 px-5 py-16 sm:px-8 sm:py-24 lg:grid-cols-12 lg:items-center lg:gap-14">
            <div className="lg:col-span-6">
              <p className="inline-flex items-center gap-2 rounded-full border border-[#E6E1DA] bg-[#FFFFFF] px-3.5 py-1.5 text-xs font-medium uppercase tracking-[0.16em] text-[#5C574F]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#9A5220]" />
                Portafolios para artistas de Quadro
              </p>

              <h1 className="mt-6 font-serif text-4xl font-normal leading-[1.12] tracking-tight text-[#161616] sm:text-5xl lg:text-[3.4rem]">
                Tu obra merece un espacio propio en internet.
              </h1>

              <p className="mt-6 max-w-xl text-base leading-relaxed text-[#5C574F] sm:text-lg">
                Crea tu web y catálogo de obras en minutos con un editor visual
                pensado para artistas, asistente de IA para tus textos
                curatoriales y venta directa por WhatsApp desde tu propio
                subdominio{' '}
                <span className="font-medium text-[#161616]">
                  tu-nombre.quadro-nt.com
                </span>
                .
              </p>

              <div className="mt-9 flex flex-col gap-3.5 sm:flex-row sm:items-center">
                <Link
                  href="/signup"
                  className="inline-flex items-center justify-center rounded-full bg-[#9A5220] px-7 py-3.5 text-sm font-medium text-white transition-colors hover:bg-[#7E4118]"
                >
                  Crear mi sitio gratis
                </Link>
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center rounded-full border border-[#E6E1DA] bg-[#FFFFFF] px-7 py-3.5 text-sm font-medium text-[#161616] transition-colors hover:border-[#161616]"
                >
                  Ya tengo cuenta
                </Link>
              </div>

              <div className="mt-10 grid grid-cols-3 gap-4 border-t border-[#E6E1DA] pt-6 text-xs text-[#5C574F] sm:text-sm">
                <div>
                  <p className="font-serif text-lg text-[#161616]">3 estilos</p>
                  <p className="mt-0.5">Plantillas curadas</p>
                </div>
                <div>
                  <p className="font-serif text-lg text-[#161616]">Con IA</p>
                  <p className="mt-0.5">Textos de obra y bio</p>
                </div>
                <div>
                  <p className="font-serif text-lg text-[#161616]">Sin comisiones</p>
                  <p className="mt-0.5">Directo a WhatsApp</p>
                </div>
              </div>
            </div>

            {/* Columna visual derecha: mockup estilizado del estudio */}
            <div className="lg:col-span-6">
              <div className="rounded-2xl border border-[#E6E1DA] bg-[#FFFFFF] p-5 shadow-[0_24px_60px_-32px_rgba(22,22,22,0.18)] sm:p-7">
                {/* Barra superior del navegador / subdominio */}
                <div className="flex items-center justify-between border-b border-[#E6E1DA] pb-4">
                  <div className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-[#E6E1DA]" />
                    <span className="h-2.5 w-2.5 rounded-full bg-[#E6E1DA]" />
                    <span className="h-2.5 w-2.5 rounded-full bg-[#E6E1DA]" />
                  </div>
                  <div className="rounded-full border border-[#E6E1DA] bg-[#FAF8F5] px-3.5 py-1 text-xs font-medium text-[#5C574F]">
                    https://tu-nombre.quadro-nt.com
                  </div>
                  <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-[#9A5220]">
                    Publicado
                  </span>
                </div>

                {/* Cuerpo del mockup de estudio */}
                <div className="mt-5 grid gap-5 sm:grid-cols-12">
                  {/* Panel izquierdo del editor */}
                  <div className="space-y-3 rounded-xl border border-[#E6E1DA] bg-[#FAF8F5] p-4 sm:col-span-5">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#5C574F]">
                      Estudio visual
                    </p>
                    <div className="space-y-2">
                      <div className="rounded-lg border border-[#E6E1DA] bg-[#FFFFFF] px-3 py-2">
                        <p className="text-xs font-medium text-[#161616]">
                          Editor visual en vivo
                        </p>
                        <p className="mt-0.5 text-[11px] text-[#5C574F]">
                          Tipografía, portada y catálogo
                        </p>
                      </div>
                      <div className="rounded-lg border border-[#E6E1DA] bg-[#FFFFFF] px-3 py-2">
                        <p className="text-xs font-medium text-[#161616]">
                          Asistente curatorial IA
                        </p>
                        <p className="mt-0.5 text-[11px] text-[#5C574F]">
                          Descripción y ficha técnica
                        </p>
                      </div>
                      <div className="rounded-lg border border-[#9A5220]/30 bg-[#9A5220]/5 px-3 py-2">
                        <p className="text-xs font-medium text-[#9A5220]">
                          Consulta por WhatsApp
                        </p>
                        <p className="mt-0.5 text-[11px] text-[#5C574F]">
                          Enlace directo en cada obra
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Vista previa de galería */}
                  <div className="flex flex-col justify-between rounded-xl border border-[#E6E1DA] bg-[#FFFFFF] p-4 sm:col-span-7">
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.2em] text-[#5C574F]">
                        Serie reciente · 2026
                      </p>
                      <h2 className="mt-1 font-serif text-2xl leading-snug text-[#161616]">
                        Atelier &amp; Archivo
                      </h2>
                      <p className="mt-1.5 text-xs leading-relaxed text-[#5C574F]">
                        Óleos sobre lino, piezas en papel y obra disponible para
                        colección privada.
                      </p>
                    </div>

                    <div className="mt-5 grid grid-cols-2 gap-3">
                      <div className="rounded-lg border border-[#E6E1DA] bg-[#FAF8F5] p-2.5">
                        <div className="aspect-[4/3] rounded bg-gradient-to-br from-[#EAE1D4] via-[#F7F3EC] to-[#B86B35]/35" />
                        <p className="mt-2 font-serif text-xs text-[#161616]">
                          Horizonte cálido
                        </p>
                        <p className="text-[11px] text-[#5C574F]">
                          120 × 90 cm · Disponible
                        </p>
                      </div>
                      <div className="rounded-lg border border-[#E6E1DA] bg-[#FAF8F5] p-2.5">
                        <div className="aspect-[4/3] rounded bg-gradient-to-tr from-[#262320] via-[#4C453E] to-[#B86B35]/50" />
                        <p className="mt-2 font-serif text-xs text-[#161616]">
                          Estudio en terracota
                        </p>
                        <p className="text-[11px] text-[#5C574F]">
                          80 × 60 cm · Consultar
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 flex items-center justify-between border-t border-[#E6E1DA] pt-3">
                      <span className="text-[11px] text-[#5C574F]">
                        Subdominio propio activo
                      </span>
                      <span className="rounded-full bg-[#161616] px-3 py-1 text-[11px] font-medium text-[#FAF8F5]">
                        Consultar por WhatsApp
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Sección #como-funciona */}
        <section
          id="como-funciona"
          className="border-b border-[#E6E1DA] py-16 sm:py-24"
        >
          <div className="mx-auto max-w-6xl px-5 sm:px-8">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#9A5220]">
                Cómo funciona
              </p>
              <h2 className="mt-3 font-serif text-3xl font-normal tracking-tight text-[#161616] sm:text-4xl">
                De tu taller a tu propia galería online en tres pasos.
              </h2>
            </div>

            <div className="mt-12 grid gap-6 md:grid-cols-3">
              {STEPS.map((step) => (
                <article
                  key={step.number}
                  className="flex flex-col justify-between rounded-2xl border border-[#E6E1DA] bg-[#FFFFFF] p-7"
                >
                  <div>
                    <span className="font-serif text-3xl text-[#9A5220]">
                      {step.number}
                    </span>
                    <h3 className="mt-4 font-serif text-xl leading-snug text-[#161616]">
                      {step.title}
                    </h3>
                    <p className="mt-3 text-sm leading-relaxed text-[#5C574F]">
                      {step.description}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* Sección #plantillas */}
        <section id="plantillas" className="border-b border-[#E6E1DA] py-16 sm:py-24">
          <div className="mx-auto max-w-6xl px-5 sm:px-8">
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
              <div className="max-w-2xl">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#9A5220]">
                  Plantillas curadas
                </p>
                <h2 className="mt-3 font-serif text-3xl font-normal tracking-tight text-[#161616] sm:text-4xl">
                  Elige una arquitectura editorial para tu obra.
                </h2>
              </div>
              <p className="max-w-md text-sm leading-relaxed text-[#5C574F]">
                Cada plantilla se adapta a tu catálogo y puedes personalizarla o
                cambiarla cuando quieras desde tu editor.
              </p>
            </div>

            <div className="mt-12 grid gap-7 lg:grid-cols-3">
              {TEMPLATES.map((template) => (
                <article
                  key={template.id}
                  className="flex flex-col justify-between rounded-2xl border border-[#E6E1DA] bg-[#FFFFFF] p-6 transition-shadow hover:shadow-[0_18px_45px_-28px_rgba(22,22,22,0.22)]"
                >
                  <div>
                    <TemplateMiniPreview template={template} />

                    <div className="mt-6">
                      <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-[#9A5220]">
                        {template.subtitle}
                      </p>
                      <h3 className="mt-1.5 font-serif text-2xl text-[#161616]">
                        {template.name}
                      </h3>
                      <p className="mt-2.5 text-sm leading-relaxed text-[#5C574F]">
                        {template.description}
                      </p>
                    </div>
                  </div>

                  <div className="mt-7 flex flex-wrap items-center gap-3 border-t border-[#E6E1DA] pt-5">
                    <Link
                      href={template.demoHref}
                      className="inline-flex flex-1 items-center justify-center rounded-full border border-[#E6E1DA] bg-[#FAF8F5] px-4 py-2.5 text-xs font-medium text-[#161616] transition-colors hover:border-[#161616] sm:text-sm"
                    >
                      Ver demo
                    </Link>
                    <Link
                      href={template.signupHref}
                      className="inline-flex flex-1 items-center justify-center rounded-full bg-[#9A5220] px-4 py-2.5 text-xs font-medium text-white transition-colors hover:bg-[#7E4118] sm:text-sm"
                    >
                      Usar esta plantilla
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* CTA final */}
        <section className="py-16 sm:py-24">
          <div className="mx-auto max-w-4xl px-5 text-center sm:px-8">
            <div className="rounded-3xl border border-[#E6E1DA] bg-[#FFFFFF] px-6 py-12 sm:px-12 sm:py-16">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#9A5220]">
                Tu galería independiente
              </p>
              <h2 className="mt-4 font-serif text-3xl font-normal tracking-tight text-[#161616] sm:text-4xl">
                Empieza hoy tu portafolio en Quadro Sites.
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-[#5C574F] sm:text-base">
                Crea tu cuenta gratuita, sube tus primeras obras y publica en tu
                propio subdominio <span className="text-[#161616]">.quadro-nt.com</span>.
              </p>
              <div className="mt-8 flex flex-col items-center justify-center gap-3.5 sm:flex-row">
                <Link
                  href="/signup"
                  className="inline-flex w-full items-center justify-center rounded-full bg-[#9A5220] px-8 py-3.5 text-sm font-medium text-white transition-colors hover:bg-[#7E4118] sm:w-auto"
                >
                  Crear mi cuenta gratis
                </Link>
                <Link
                  href="/login"
                  className="inline-flex w-full items-center justify-center rounded-full border border-[#E6E1DA] bg-[#FAF8F5] px-8 py-3.5 text-sm font-medium text-[#161616] transition-colors hover:border-[#161616] sm:w-auto"
                >
                  Iniciar sesión
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer limpio */}
      <footer className="border-t border-[#E6E1DA] bg-[#FAF8F5]">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 px-5 py-10 text-sm text-[#5C574F] sm:flex-row sm:items-center sm:px-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#161616]">
              Quadro Sites
            </p>
            <p className="mt-1 text-xs text-[#5C574F]">
              Portafolios editoriales y catálogos para artistas.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-6 text-xs sm:text-sm">
            <a href="#como-funciona" className="hover:text-[#161616]">
              Cómo funciona
            </a>
            <a href="#plantillas" className="hover:text-[#161616]">
              Plantillas
            </a>
            <Link href="/login" className="hover:text-[#161616]">
              Iniciar sesión
            </Link>
            <Link
              href="/signup"
              className="font-medium text-[#9A5220] hover:text-[#7E4118]"
            >
              Crear mi sitio
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
