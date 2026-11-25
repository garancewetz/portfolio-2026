// The path of the visit, for the lab's Abyme page (see src/shared/trail.ts, same storage, same format): the pages seen,
// in order, kept for the time of the tab (sessionStorage: nothing is sent). Here a page is the home page or the lab
// (?labo): it changes the address and the title without reloading, so the title is watched.
// Shown at the bottom of Abyme, in an iframe: not a page of the visit, and its links open in the whole window.

type Step = { path: string; title: string }
const KEY = 'gw-trail'

function read(): Step[] {
  try {
    return JSON.parse(sessionStorage.getItem(KEY) || '[]')
  } catch {
    return []
  }
}

function add() {
  // (only what makes a page: ?labo; not ?hour=… nor tracking parameters)
  const step = { path: new URLSearchParams(location.search).has('labo') ? '/?labo' : '/', title: document.title }
  const steps = read()
  if (steps.at(-1)?.path === step.path) steps.pop() // the same page, again: once
  steps.push(step)
  try {
    sessionStorage.setItem(KEY, JSON.stringify(steps.slice(-40)))
  } catch {
    // (storage refused: no path, never mind)
  }
}

export function setupTrail() {
  if (window !== window.top) {
    document.head.append(Object.assign(document.createElement('base'), { target: '_top' }))
    return
  }
  add()
  const title = document.querySelector('title')
  if (title) new MutationObserver(() => setTimeout(add)).observe(title, { childList: true, characterData: true, subtree: true })
}
