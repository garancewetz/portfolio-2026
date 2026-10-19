import { lazy, Suspense, useState, type RefObject } from 'react'

// L'effet three.js au survol des captures (voir CardFX) : chargé à la demande, et seulement avec une souris
// (rien sur un écran tactile). root : le conteneur à surveiller ; item : le sélecteur des captures.
const CardFX = lazy(() => import('./CardFX'))
const hasMouse = () => matchMedia('(hover: hover) and (pointer: fine)').matches

export interface RippleProps {
  /** le conteneur à surveiller */
  root: RefObject<HTMLElement | null>
  /** le sélecteur des captures survolables (une .shot, ou un élément qui en contient une) */
  item: string
}

export default function Ripple({ root, item }: RippleProps) {
  const [on] = useState(hasMouse)
  if (!on) return null
  return (
    <Suspense fallback={null}>
      <CardFX root={root} item={item} />
    </Suspense>
  )
}
