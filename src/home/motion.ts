import { BACKDROP } from './backdrop'
import { calm, smooth } from './shared'

// Two moves shared by the page: moving into the backdrop (leaving for an experiment of the lab: the camera moves
// towards the heart of the place, turning a little, then drifts), and the changes of page within the page (home ↔
// lab), as View Transitions.

// moving in: `near` (and the drift, which follows it) glides softly to its target, from wherever it is
let nearFrom = 0
let nearTo = 0
let nearNow = 0
let nearT0 = 0
let nearRunning = false
const APPROACH_MS = 1100
export function approach(v: number, instant = false) {
  if (calm || instant) {
    nearNow = nearTo = v
    BACKDROP.set('near', v)
    BACKDROP.set('drift', calm ? 0 : v)
    BACKDROP.animate(!calm && v > 0)
    return
  }
  nearFrom = nearNow
  nearTo = v
  nearT0 = performance.now()
  BACKDROP.animate(true)
  if (!nearRunning) {
    nearRunning = true
    requestAnimationFrame(approachStep)
  }
}
function approachStep() {
  const k = smooth(Math.min(1, (performance.now() - nearT0) / APPROACH_MS))
  nearNow = nearFrom + (nearTo - nearFrom) * k
  BACKDROP.set('near', nearNow)
  BACKDROP.set('drift', nearNow)
  if (k < 1) requestAnimationFrame(approachStep)
  else {
    nearRunning = false
    if (!nearTo) BACKDROP.animate(false)
  }
}

// a change of page within the page (if the browser can, and less motion was not asked for); the backdrop stays out
// of it (cards.css)
export function transition(update: () => void): Promise<void> {
  if (!document.startViewTransition || calm) {
    update()
    return Promise.resolve()
  }
  const t = document.startViewTransition(update)
  // (a transition can interrupt another: no harm)
  t.ready.catch(() => {})
  t.updateCallbackDone.catch(() => {})
  return t.finished.catch(() => {})
}
