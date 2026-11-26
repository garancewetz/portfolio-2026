// A few tools shared by the home page's modules: the address on arrival, `calm` (for whoever asked for less motion),
// the soft easing curve, and el(), an element from its HTML.

export const QUERY = new URLSearchParams(location.search) // the address on arrival (?p=id…)
// the lab: /lab/, opened in the home page itself (see lab.ts; the server gives this page for /lab/); ?labo, its old
// address, still opens it
export const LAB_URL = '/lab/'
export const atLab = () => /^\/lab\/?$/.test(location.pathname) || new URLSearchParams(location.search).has('labo')
export const calm = matchMedia('(prefers-reduced-motion: reduce)').matches
// from 0 to 1, starting and ending softly
export const smooth = (x: number) => x * x * x * (x * (x * 6 - 15) + 10)

export function el<T extends HTMLElement = HTMLElement>(html: string) {
  const t = document.createElement('template')
  t.innerHTML = html.trim()
  return t.content.firstElementChild as T
}

// a modified click (⌘, Ctrl, Shift, Alt) keeps the browser's behaviour: a new tab, a new window
export const modified = (e: MouseEvent | KeyboardEvent) => e.metaKey || e.ctrlKey || e.shiftKey || e.altKey
