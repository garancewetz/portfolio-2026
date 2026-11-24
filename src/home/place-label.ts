import type { Backdrop } from './gl-background'
import { PLACE_NAMES, PLACES } from './reliefs'
import { el } from './shared'

// The name of the place shown by the backdrop, bottom right: it shows when the relief changes (a card hovered), then
// fades after a few seconds.
// Wraps the backdrop: placeLabel(backdrop, start) keeps its methods, and follows settings.here (see reliefs.ts).
// A place whose relief has not arrived yet: the backdrop goes there as soon as it has (unless another place was
// asked for meanwhile).
export function placeLabel(backdrop: Backdrop, start: { here: number }): Backdrop {
  const label = el(`<p class="place-label"><b></b><span></span></p>`)
  document.body.append(label)
  let here = -1, swap = 0, rest = 0
  function show(n: number) {
    if (n === here) return
    const first = here === -1
    here = n
    label.classList.add('changing')
    clearTimeout(swap); clearTimeout(rest)   // hovering fast: only the last place shows, still with its fade
    swap = window.setTimeout(() => {
      const [name, detail] = PLACE_NAMES[PLACES[n]]
      label.querySelector('b')!.textContent = name
      label.querySelector('span')!.textContent = detail
      label.classList.remove('changing', 'resting')
      rest = window.setTimeout(() => label.classList.add('resting'), 4000)   // read, then it steps aside
    }, first ? 0 : 400)
  }
  show(start.here)
  let asked = 0
  return {
    ...backdrop,
    goTo: (settings) => {
      const n = ++asked
      const here = settings.here as number
      backdrop.loaded(PLACES[here] + 'T').then(() => {
        if (n !== asked) return
        backdrop.goTo(settings)
        show(here)
      })
    },
  }
}
