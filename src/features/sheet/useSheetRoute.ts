import { useEffect, useLayoutEffect, useRef, useState, type Dispatch, type RefObject, type SetStateAction } from 'react'
import { flushSync } from 'react-dom'
import type { Project } from '@/content/types'
import { morph } from './morph'

// La fiche ouverte a sa propre adresse (#synapso…) : on peut l'envoyer, et le retour du navigateur la ferme.
// (La page ne bouge pas au retour : sinon le navigateur remettrait une position de défilement notée pendant que
// la fiche bloquait le défilement.)
history.scrollRestoration = 'manual'

// Le projet dont l'adresse est ouverte (#synapso → son index), ou null
const fromHash = (projects: Project[]): number | null => {
  const i = projects.findIndex((p) => `#${p.id}` === location.hash)
  return i < 0 ? null : i
}
// la carte d'un projet sur la page, et sa capture (départ et arrivée de la transition)
type Root = RefObject<HTMLElement | null>
const cardOf = (root: Root, i: number) => root.current?.querySelector<HTMLElement>(`.rg-card[data-i="${i}"]`)
const shotOf = (root: Root, i: number) => cardOf(root, i)?.querySelector<HTMLElement>('.shot-frame')

// L'état de la fiche : quel projet est ouvert (son index, ou null), et comment l'ouvrir, la fermer, passer au
// précédent ou au suivant. projects : la liste ; root : la page (pour retrouver la carte de chaque projet).
export interface SheetRoute {
  /** le projet ouvert (son index), ou null */
  sheet: number | null
  open: (index: number) => void
  close: () => void
  step: (dir: -1 | 1) => void
}

export function useSheetRoute(projects: Project[], root: Root): SheetRoute {
  const [sheet, setSheet] = useState<number | null>(() => fromHash(projects))
  const sheetNow = useRef(sheet) // (la même, pour les gestionnaires d'événements)
  useLayoutEffect(() => {
    sheetNow.current = sheet
  }, [sheet])

  // ouvrir : la fiche prend l'adresse du projet (une étape dans l'historique : le retour la ferme)
  const open = (i: number) => {
    morph(shotOf(root, i), () => setSheet(i), true)
    history.pushState({ sheet: true }, '', `#${projects[i].id}`)
  }
  // « Fermer », Échap, le fil d'Ariane : comme le retour du navigateur, si la fiche a été ouverte depuis la
  // page ; sinon (arrivée directe sur l'adresse d'une fiche), on ferme et on retire l'adresse
  const close = () => {
    if (history.state?.sheet) return history.back()
    history.replaceState(null, '', location.pathname + location.search)
    shut(root, sheetNow.current, setSheet)
  }
  // projet précédent ou suivant (une coupe nette ; l'adresse suit, sans ajouter d'étape à l'historique)
  const step = (dir: -1 | 1) => {
    if (sheetNow.current === null) return
    const i = (sheetNow.current + dir + projects.length) % projects.length
    setSheet(i)
    history.replaceState(history.state, '', `#${projects[i].id}`)
  }
  // retour (ou avance) du navigateur : la fiche suit l'adresse
  useEffect(() => {
    const onPop = () => {
      const i = fromHash(projects)
      const now = sheetNow.current
      if (i === now) return
      if (i === null) shut(root, now, setSheet)
      else if (now === null) morph(shotOf(root, i), () => setSheet(i), true)
      else flushSync(() => setSheet(i))
    }
    addEventListener('popstate', onPop)
    return () => removeEventListener('popstate', onPop)
  }, [projects, root])

  return { sheet, open, close, step }
}

// fermer la fiche du projet i (et rendre le focus à sa carte)
function shut(root: Root, i: number | null, setSheet: Dispatch<SetStateAction<number | null>>) {
  if (i === null) return
  morph(shotOf(root, i), () => setSheet(null), false, () =>
    cardOf(root, i)?.querySelector<HTMLButtonElement>('.rg-link')?.focus({ preventScroll: true }),
  )
}
