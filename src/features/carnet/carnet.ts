import './carnet.css'
import './sheet'
import { remember } from '@/shared/trail'
import { roam } from '@/features/mascots/roam'

// The lab notebook: the experiments, each on its own page (its own address), leafed through like a notebook. At
// the top of each page, discreetly: « labo » and the page number on the left; the previous and next pages, by
// name, on the right. Each page takes the whole screen (see sheet.ts); you go from one to the other simply,
// without animation.
// (the lab itself, its table of contents, is on the home page: /?labo, see src/home/lab.ts)
const LAB = '/?labo'

// the pages, in notebook order (to add one: a line here, and `mount()` in its main.ts)
const PAGES = [
  // (in an order that alternates light and dark screenshots: the two-tone table of contents breathes)
  { path: '/toupies/', name: 'toupies' },
  { path: '/murmuration/', name: 'murmuration' },
  { path: '/creatures/', name: 'créatures' },
  { path: '/ruban/', name: 'ruban' },
  { path: '/kit/', name: 'kit' },
  { path: '/mascottes/', name: 'mascottes' },
  // (Abyme last: it climbs back up the visit)
  { path: '/abyme/', name: 'abyme' },
  // (hidden for now, their pages still exist, unlinked: Yaya, at /yaya/; Escalade, at /escalade/, whose idea
  // Créatures picks up; Morse, at /morse/; Feu d'artifice, at /feu/, on the home in secret mode)
]

const indexOf = (url: string) => PAGES.findIndex((p) => new URL(url, location.href).pathname.startsWith(p.path))

export function mount() {
  // (the path of the visit, for the Abyme page)
  remember()
  // the mascots freed on the Mascottes page fly over every page
  void roam()
  // (shown in an Abyme window, in an iframe: its links open in the whole window)
  if (window !== window.top) document.head.append(Object.assign(document.createElement('base'), { target: '_top' }))
  const here = indexOf(location.href)
  if (here < 0) return
  const prev = PAGES[here - 1]
  const next = PAGES[here + 1]

  const nav = document.createElement('nav')
  nav.className = 'carnet'
  nav.setAttribute('aria-label', 'Carnet')
  nav.innerHTML = `
    <span class="carnet-left"><a href="${LAB}">labo</a> <span class="carnet-page">${here + 1}/${PAGES.length}</span></span>
    <span class="carnet-turn">
      ${prev ? `<a href="${prev.path}" rel="prev">← ${prev.name}</a>` : ''}
      ${next ? `<a href="${next.path}" rel="next">${next.name} →</a>` : ''}
    </span>`
  // (the pages listen to clicks, keys and the wheel on the whole window — a click makes the birds fly off, Enter
  // too: what happens on the notebook, or on what a page adds to it, is none of their business)
  for (const type of ['pointerdown', 'pointerup', 'click', 'keydown', 'wheel'])
    nav.addEventListener(type, (e) => e.stopPropagation())
  document.body.append(nav)

  // (a page may add its own tools there, on the left, after the page number)
  return nav.querySelector<HTMLElement>('.carnet-left')
}
