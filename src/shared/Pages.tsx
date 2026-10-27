import type { Page } from '@/content/types'
import './Pages.css'

// Les pages d'un projet qui en a plusieurs (le carnet), dans sa fiche : une mosaïque de leurs captures, deux par
// ligne, à la place d'une capture seule ; chaque capture mène à sa page. L'élément du dehors (.shot-frame) est celui
// où arrive la capture de la carte, comme une capture seule (voir Shot).

export default function Pages({ pages }: { pages: Page[] }) {
  return (
    <span className="pages shot-frame">
      {pages.map((p) => (
        <a className="shot" href={p.href} key={p.href} aria-label={`Ouvrir ${p.name}`}>
          <img src={p.src} alt={p.alt} width="1200" height="750" decoding="async" />
        </a>
      ))}
    </span>
  )
}
