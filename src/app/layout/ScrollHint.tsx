import type { Ref } from 'react'
import './ScrollHint.css'

// L'indication « scroll ↓ », en bas de la colonne la plus haute. Elle s'efface dès qu'on a commencé à faire
// défiler (classe is-off, écrite par useStickyLayout).
export default function ScrollHint({ ref }: { ref: Ref<HTMLParagraphElement> }) {
  return (
    <p className="rg-hint" aria-hidden ref={ref}>
      scroll ↓
    </p>
  )
}
