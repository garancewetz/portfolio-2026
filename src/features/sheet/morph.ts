import { flushSync } from 'react-dom'

// Passage de la carte à sa fiche (et retour) : la capture de la carte glisse et s'agrandit jusqu'à sa place
// dans la fiche, le reste apparaît en fondu (View Transitions). Sans elles, ou si l'on a demandé moins
// d'animations : la fiche apparaît simplement en fondu.
// shot : la capture de la carte ; update : le changement d'état ; opening : on ouvre (sinon on ferme) ;
// after : ce qui suit le changement (le focus).
const canMorph = () =>
  'startViewTransition' in document && !matchMedia('(prefers-reduced-motion: reduce)').matches

export function morph(
  shot: HTMLElement | null | undefined,
  update: () => void,
  opening: boolean,
  after?: () => void,
): void {
  const done = () => {
    flushSync(update)
    after?.()
  }
  if (!canMorph() || !shot) return done()
  const html = document.documentElement
  html.classList.add('is-morph')
  // un seul élément porte le nom à la fois : la capture de la carte avant, celle de la fiche après (et l'inverse)
  if (opening) shot.style.viewTransitionName = 'rg-shot'
  const t = document.startViewTransition(async () => {
    if (opening) shot.style.viewTransitionName = ''
    done()
    if (!opening) shot.style.viewTransitionName = 'rg-shot'
    // (les images de la fiche prêtes avant la photo d'arrivée)
    else {
      const imgs = [...document.querySelectorAll<HTMLImageElement>('.rg-sheet-shot img')]
      await Promise.all(imgs.map((i) => i.decode().catch(() => {})))
    }
  })
  // (une transition interrompue, par ex. onglet en arrière-plan : le changement a lieu quand même)
  t.ready.catch(() => {})
  t.finished.finally(() => {
    shot.style.viewTransitionName = ''
    html.classList.remove('is-morph')
  })
}
