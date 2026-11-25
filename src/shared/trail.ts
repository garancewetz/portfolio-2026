// The path of the visit: the pages seen, in order, kept by the site itself for the life of the tab
// (sessionStorage: nothing is sent, everything is cleared when the tab closes). The Abyme page climbs back up
// it (see features/abyme). A page: its address (with the open sheet, #id) and its title.

export type Step = { path: string; title: string }
const KEY = 'gw-trail'

export function trail(): Step[] {
  try {
    return JSON.parse(sessionStorage.getItem(KEY) ?? '[]')
  } catch {
    return []
  }
}

function add() {
  const step = { path: location.pathname + location.hash, title: document.title }
  const steps = trail()
  // (a sheet being closed: you come back to the page, it is not one more page)
  if (!location.hash && steps.at(-1)?.path.startsWith(`${location.pathname}#`)) return
  // (the same page, reloaded: only once)
  if (steps.at(-1)?.path === step.path) steps.pop()
  steps.push(step)
  try {
    sessionStorage.setItem(KEY, JSON.stringify(steps.slice(-40)))
  } catch {
    // (storage refused: no path, too bad)
  }
}

// record this page, and each sheet opened on it: a sheet changes the address (#id) without reloading the page,
// and changes the title; it is the title we watch for
export function remember() {
  // (the home page shown at the bottom of Abyme, in an iframe: it is not a page of the visit)
  if (window !== window.top) return
  add()
  const title = document.querySelector('title')
  if (title) new MutationObserver(() => setTimeout(add)).observe(title, { childList: true, characterData: true, subtree: true })
}
