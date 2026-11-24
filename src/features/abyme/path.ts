import { carnet, me, projects } from '@/content/content'
import { trail, type Step } from '@/shared/trail'

// Le chemin à remonter : les dernières pages vues pendant la visite (voir shared/trail), de la plus récente à la
// plus ancienne, chacune une fois, sans Abyme elle-même ; tout au fond, toujours l'accueil (la porte d'entrée du
// site, même si l'on est arrivé par une autre page). Arrivé directement ici, sans chemin : celui du carnet, à
// rebours, jusqu'à l'accueil.

// les pages du carnet (voir content.ts) : leur adresse, leur nom, leur capture
const PAGES = carnet.pages
const HOME: Step = { path: '/', title: me.name }
const CARNET: Step[] = [
  ...PAGES.filter((p) => p.href !== '/abyme/')
    .reverse()
    .map((p) => ({ path: p.href, title: `${p.name[0].toUpperCase()}${p.name.slice(1)} — ${me.name}` })),
  HOME,
]

// (pas plus de MAX pages avant l'accueil, chacune dans sa fenêtre)
const MAX = 4

export function path(): Step[] {
  const seen = new Set<string>()
  const steps = trail()
    .reverse()
    // (chaque page une seule fois, à sa dernière visite ; ni Abyme, ni l'accueil, qui est toujours au fond)
    .filter((s) => !s.path.startsWith('/abyme') && s.path !== '/' && !seen.has(s.path) && seen.add(s.path))
    .slice(0, MAX)
  return steps.length || trail().some((s) => s.path === '/') ? [...steps, HOME] : CARNET
}

// (a project on the home page that content.ts does not list: its screenshot, from public/accueil/data.js)
const NOT_LISTED: Record<string, string> = { 'paris-forest': '/shots/paris-forest.jpg' }

// la capture d'une page : celle de la page du carnet, celle du projet dont la fiche était ouverte, ou l'accueil
export function picture(path: string) {
  const page = PAGES.find((p) => path.startsWith(p.href))
  if (page) return page.src
  // (the lab, on the home page: its own screenshot; a project page, ?p=id: the project's)
  if (/[?&]labo\b/.test(path)) return '/shots/labo.webp'
  const sheet = path.match(/[?&]p=([^&#]+)/)
  const project = sheet && projects.find((p) => p.id === sheet[1])
  return project?.image ?? (sheet && NOT_LISTED[sheet[1]]) ?? '/shots/accueil.webp'
}
