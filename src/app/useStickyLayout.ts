import { useEffect, useRef, useState } from 'react'

// Ce que le CSS ne sait pas faire seul, à chaque défilement : mesurer la hauteur de la rangée de cartes
// (--row-h : elle place la signature et la fin de page), savoir quelles cartes sont
// rangées (classe is-docked) et si toutes le sont (étape 'scroll' → 'done'), remonter l'intitulé avec la grille
// à la fin (écran pas assez haut), et effacer « scroll ↓ » dès qu'on a commencé à défiler.
// Renvoie les références à poser sur la page (root), l'intitulé (top) et « scroll ↓ » (hint), et l'étape.
export type Phase = 'scroll' | 'done'

export function useStickyLayout() {
  const root = useRef<HTMLElement>(null)
  const top = useRef<HTMLHeadingElement>(null)
  const hint = useRef<HTMLParagraphElement>(null)
  const [phase, setPhase] = useState<Phase>('scroll')

  useEffect(() => {
    let rowH = ''
    let phaseNow: Phase | '' = ''
    let liftNow = 0
    // Rangée : arrivée à sa place collée… ou déjà au-dessus (quand, à la fin, la grille remonte d'un bloc)
    const isDocked = (c: HTMLElement) => c.getBoundingClientRect().top - parseFloat(getComputedStyle(c).top) < 4
    const check = () => {
      const r = root.current
      if (!r) return
      const cards = [...r.querySelectorAll<HTMLElement>('.rg-card')]
      if (!cards.length || getComputedStyle(cards[0]).position !== 'sticky') return setPhase('done')
      const h = `${Math.round(Math.max(...cards.map((c) => c.offsetHeight)))}px`
      // (n'écrire que si elle change : sinon toute la page recalcule ses styles à chaque scroll)
      if (h !== rowH) r.style.setProperty('--row-h', (rowH = h))
      const docked = cards.map(isDocked)
      cards.forEach((c, k) => c.classList.toggle('is-docked', docked[k]))
      const p: Phase = docked.every(Boolean) ? 'done' : 'scroll'
      if (p !== phaseNow) setPhase((phaseNow = p))
      const lift = Math.max(
        0,
        Math.round(parseFloat(getComputedStyle(cards[0]).top) - cards[0].getBoundingClientRect().top),
      )
      if (lift !== liftNow && top.current) {
        liftNow = lift
        top.current.style.transform = lift ? `translateY(${-lift}px)` : ''
        // (le lien du labo, sur la même ligne, remonte avec lui)
        const labo = r.querySelector<HTMLElement>('.rg-labo')
        if (labo) labo.style.transform = top.current.style.transform
      }
      // (sur l'élément lui-même : la classe de <main> est réécrite par React à chaque étape)
      hint.current?.classList.toggle('is-off', scrollY > 40)
    }
    check()
    addEventListener('scroll', check, { passive: true })
    addEventListener('resize', check)
    return () => {
      removeEventListener('scroll', check)
      removeEventListener('resize', check)
    }
  }, [])

  return { root, top, hint, phase }
}
