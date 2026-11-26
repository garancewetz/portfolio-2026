import { carnet, me, projects } from '@/content/content'
import { trail, type Step } from '@/shared/trail'

// The path to climb back: the last pages seen during the visit (see shared/trail), from most recent to
// oldest, each one once, without Abyme itself; at the very bottom, always the home (the site's front door,
// even if you arrived through another page). Arriving here directly, with no path: the notebook's, backwards,
// down to the home.

// the notebook pages (see content.ts): their address, their name, their screenshot
const PAGES = carnet.pages
const HOME: Step = { path: '/', title: me.name }
const CARNET: Step[] = [
  ...PAGES.filter((p) => p.href !== '/lab/abyme/')
    .reverse()
    .map((p) => ({ path: p.href, title: `${p.name[0].toUpperCase()}${p.name.slice(1)} — ${me.name}` })),
  HOME,
]

// (no more than MAX pages before the home, each in its window)
const MAX = 4

export function path(): Step[] {
  const seen = new Set<string>()
  const steps = trail()
    .reverse()
    // (each page only once, at its latest visit; neither Abyme nor the home, which is always at the bottom)
    .filter((s) => !s.path.startsWith('/lab/abyme') && s.path !== '/' && !seen.has(s.path) && seen.add(s.path))
    .slice(0, MAX)
  return steps.length || trail().some((s) => s.path === '/') ? [...steps, HOME] : CARNET
}

// (a project on the home page that content.ts does not list: its screenshot, from src/home/data.ts)
const NOT_LISTED: Record<string, string> = { 'paris-forest': '/shots/paris-forest.jpg' }

// a page's screenshot: the notebook page's, the project's whose sheet was open, or the home's
export function picture(path: string) {
  const page = PAGES.find((p) => path.startsWith(p.href))
  if (page) return page.src
  // (the lab, on the home page: its own screenshot; a project page, ?p=id: the project's)
  if (/^\/lab\/?$/.test(path) || /[?&]labo\b/.test(path)) return '/shots/labo.webp'
  const sheet = path.match(/[?&]p=([^&#]+)/)
  const project = sheet && projects.find((p) => p.id === sheet[1])
  return project?.image ?? (sheet && NOT_LISTED[sheet[1]]) ?? '/shots/accueil.webp'
}
