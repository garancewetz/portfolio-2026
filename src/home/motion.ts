import { calm } from './shared'

// The changes of page within the page (home ↔ lab), as View Transitions: a change of page within the page (if the browser can, and less motion was not asked for); the backdrop stays out
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
