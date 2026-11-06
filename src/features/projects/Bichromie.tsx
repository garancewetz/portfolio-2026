import { useEffect, useRef } from 'react'
import Shot from '@/shared/Shot'
import type { Project } from '@/content/types'
import './Bichromie.css'

// La capture d'une carte, en bichromie : en bleu du site sur blanc, pour que des captures très différentes
// tiennent ensemble. La vraie capture revient au survol (avec l'ondulation, voir shared/CardFX) ou au focus du
// clavier ; sur un écran sans survol, quand la carte passe au milieu de l'écran (classe is-lit).
export default function Bichromie({ project }: { project: Project }) {
  const ref = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el || !matchMedia('(hover: none)').matches) return
    // (une bande au milieu de l'écran, haute d'un quart : une carte à la fois, en gros, s'y allume)
    const io = new IntersectionObserver(([e]) => el.classList.toggle('is-lit', e.isIntersecting), {
      rootMargin: '-37% 0px -37% 0px',
    })
    io.observe(el)
    return () => io.disconnect()
  }, [])

  return (
    <span className="bichromie" ref={ref}>
      {/* (chargée tout de suite : la carte est là dès l'arrivée, même si elle part hors de l'écran) */}
      <Shot project={project} eager />
    </span>
  )
}
