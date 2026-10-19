import type { Ref } from 'react'
import './Grid.css'

// L'indication « scroll ↓ », en bas de la 1re colonne, dans le style des étiquettes de la grille. Elle s'efface
// dès qu'on a commencé à faire défiler (classe is-off, écrite par useStickyLayout).
export default function ScrollHint({ ref }: { ref: Ref<HTMLParagraphElement> }) {
  return (
    <p className="rg-hint" aria-hidden ref={ref}>
      scroll ↓
    </p>
  )
}
