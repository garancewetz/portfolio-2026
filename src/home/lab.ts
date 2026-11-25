import { carnet } from '@/content/content'
import { BACKDROP } from './backdrop'
import { activate, aim, scene } from './cards'
import { homeLink } from './header'
import { transition } from './motion'
import { LAB_URL, QUERY, el } from './shared'

// The lab (the notebook of experiments), in the home page itself: « labo → » (behind its riddle, lab-gate.ts) turns
// the page into a mosaic of the experiments over the sea of clouds of the hour (the arrival's poster): small cards,
// their screenshot and their name; a click opens it. « hello, world. » brings the home page back. The address follows (?labo): the lab
// opens directly, and the browser's back button works (route(), below, for the whole page).

// the experiments, in their order in the mosaic
const TILES = ['/ruban/', '/mascottes/', '/toupies/', '/kit/', '/murmuration/', '/creatures/', '/abyme/']
const mosaic = el(`<main class="lab-mosaic" aria-label="Le labo"></main>`)
for (const href of TILES) {
  const page = carnet.pages.find((p) => p.href === href)!
  const tile = el(`<a class="lab-tile" href="${href}"><img alt="" loading="lazy" /><span class="mono"></span></a>`)
  Object.assign(tile.querySelector('img')!, { src: page.src, alt: page.alt })
  tile.querySelector('span')!.textContent = page.name
  mosaic.append(tile)
}

// the active badge of the home page, to find it again on the way back
let inLab = false
let homeActive: string | null = null
export function enterLab({ history: push = true, instant = false } = {}) {
  if (inLab) return
  inLab = true
  homeActive = scene.querySelector<HTMLElement>('.row a.active')?.dataset.id || null
  if (push) history.pushState({ lab: true }, '', LAB_URL)
  document.title = 'Labo — Garance Wetzel'
  const update = () => {
    document.documentElement.classList.add('in-lab')
    scrollTo(0, 0)
  }
  if (instant) update()
  else transition(update)
}
function leaveLab({ history: push = true } = {}) {
  if (!inLab) return
  inLab = false
  if (push) history.pushState({}, '', location.pathname)
  document.title = 'Garance Wetzel'
  transition(() => {
    document.documentElement.classList.remove('in-lab')
    // back home, it is ready: everything in place (the badges stuck, the name, the whole relief), never the arrival
    // in the clouds, even when the lab was the first page (?labo, or from an experiment)
    scrollTo(0, document.documentElement.scrollHeight)
    if (homeActive) activate(homeActive)
    BACKDROP.goTo(aim(homeActive || 'rest'))
  })
}

// the browser's back and forward buttons: the lab, or the home page
function route() {
  if (new URLSearchParams(location.search).has('labo')) enterLab({ history: false })
  else leaveLab({ history: false })
}

export function setupLab() {
  document.body.append(mosaic)
  // « hello, world. », in the lab, goes home (the « labo → » badge opens the lab: cards.ts, lab-gate.ts)
  homeLink().addEventListener(
    'click',
    (e) => {
      if (!inLab) return
      e.preventDefault()
      e.stopImmediatePropagation()
      leaveLab()
    },
    true,
  )
  addEventListener('popstate', route)
  if (QUERY.has('labo')) enterLab({ history: false, instant: true })
}
