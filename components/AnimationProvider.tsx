'use client'

import type { SiteConfig } from '@/lib/schemas/site-config.schema'

const ANIMATION_STYLES = `
@keyframes qs-fadein-soft {
  from { opacity: 0; transform: translateY(20px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes qs-fadein-bold {
  from { opacity: 0; transform: translateY(60px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes qs-page-fadein {
  from { opacity: 0; }
  to   { opacity: 1; }
}
.qs-scroll-reveal-soft { opacity: 0; transform: translateY(20px); }
.qs-scroll-reveal-soft.qs-scroll-reveal-visible {
  animation: qs-fadein-soft 400ms ease forwards;
}
.qs-scroll-reveal-bold { opacity: 0; transform: translateY(60px); }
.qs-scroll-reveal-bold.qs-scroll-reveal-visible {
  animation: qs-fadein-bold 700ms ease forwards;
}
.qs-hover-zoom { overflow: hidden; }
.qs-hover-zoom img,
.qs-hover-zoom [data-artwork-image] {
  transition: transform 300ms ease;
}
.qs-hover-zoom:hover img,
.qs-hover-zoom:hover [data-artwork-image] { transform: scale(1.05); }
.qs-hover-info { position: relative; overflow: hidden; }
.qs-hover-info-overlay {
  position: absolute; inset: 0;
  background: rgba(0,0,0,0.5);
  color: #fff;
  display: flex; flex-direction: column;
  align-items: center; justify-content: flex-end;
  padding: 1rem;
  opacity: 0;
  transition: opacity 250ms ease;
}
.qs-hover-info:hover .qs-hover-info-overlay { opacity: 1; }
.qs-hover-info:focus-within .qs-hover-info-overlay { opacity: 1; }
a:focus-visible .qs-hover-info .qs-hover-info-overlay { opacity: 1; }
.qs-hover-reduced:hover { opacity: 0.85; }
.qs-page-transition-fade { opacity: 0; }
.qs-page-transition-visible { animation: qs-page-fadein 300ms ease forwards; }
@media (prefers-reduced-motion: reduce) {
  .qs-scroll-reveal-soft,
  .qs-scroll-reveal-bold { opacity: 1 !important; transform: none !important; }
  .qs-scroll-reveal-soft.qs-scroll-reveal-visible,
  .qs-scroll-reveal-bold.qs-scroll-reveal-visible { animation: none !important; }
  .qs-hover-zoom img,
  .qs-hover-zoom [data-artwork-image] { transition: none; }
  .qs-hover-info-overlay { transition: none; }
  .qs-page-transition-fade { opacity: 1; }
  .qs-page-transition-visible { animation: none; }
}
`

interface AnimationProviderProps {
  config: SiteConfig
  children: React.ReactNode
}

export function AnimationProvider({ config, children }: AnimationProviderProps) {
  const { scrollReveal, hoverEffect, pageTransition } = config.animations
  const hasAnimations =
    scrollReveal !== 'none' || hoverEffect !== 'none' || pageTransition !== 'none'

  return (
    <>
      {hasAnimations && (
        <style dangerouslySetInnerHTML={{ __html: ANIMATION_STYLES }} />
      )}
      <div
        data-scroll-reveal={scrollReveal}
        data-hover-effect={hoverEffect}
        data-page-transition={pageTransition}
      >
        {children}
      </div>
    </>
  )
}
