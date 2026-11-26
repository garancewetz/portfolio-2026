import { carnet } from '@/content/content'
import { BACKDROP } from './backdrop'
import { activate, aim, scene } from './cards'
import { homeLink } from './header'
import { transition } from './motion'
import { LAB_URL, atLab, el } from './shared'

// The lab (the notebook of experiments), in the home page itself: « labo → » turns
// the page into a mosaic of the experiments over the sea of clouds of the hour (the arrival's poster): small cards,
// their screenshot and their name; a click opens it. The small « Garance Wetzel » brings the home page back. The address follows (/lab/): the lab
// opens directly, and the browser's back button works (route(), below, for the whole page).

// the experiments, in their order in the mosaic
const TILES = ['/lab/ribbon/', '/lab/mascots/', '/lab/spinning-tops/', '/lab/murmuration/', '/lab/creatures/', '/lab/abyme/']
const mosaic = el(`<main class="lab-mosaic" tabindex="-1"><h1 class="sr">Le labo, mes expériences</h1></main>`)
for (const href of TILES) {
  const page = carnet.pages.find((p) => p.href === href)!
  const tile = el(`<a class="lab-tile" href="${href}"><img alt="" loading="lazy" /><span class="mono"></span></a>`)
  // (the image says nothing more than the name beside it, for a screen reader: the link is the name)
  Object.assign(tile.querySelector('img')!, { src: page.src, alt: '' })
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
  // (the « labo » badge that had the focus is gone: the focus goes to the lab itself)
  const focus = () => mosaic.focus({ preventScroll: true })
  if (instant) update()
  else transition(update).then(focus)
}
function leaveLab({ history: push = true } = {}) {
  if (!inLab) return
  inLab = false
  if (push) history.pushState({}, '', '/')
  document.title = 'Garance Wetzel'
  transition(() => {
    document.documentElement.classList.remove('in-lab')
    // back home, it is ready: everything in place (the badges stuck, the whole relief), never the arrival in the
    // clouds, even when the lab was the first page (/lab/, or from an experiment)
    scrollTo(0, document.documentElement.scrollHeight)
    if (homeActive) activate(homeActive)
    BACKDROP.goTo(aim(homeActive || 'rest'))
  }).then(() => scene.querySelector<HTMLElement>('.row a[data-id="labo"]')?.focus({ preventScroll: true }))
}

// the browser's back and forward buttons: the lab, or the home page
function route() {
  if (atLab()) enterLab({ history: false })
  else leaveLab({ history: false })
}

export function setupLab() {
  document.body.append(mosaic)
  // the small « Garance Wetzel », in the lab, goes home (the « labo → » badge opens the lab: cards.ts)
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
  if (atLab()) {
    // (the old address, ?labo, becomes the new one)
    if (location.pathname === '/') history.replaceState({ lab: true }, '', LAB_URL)
    enterLab({ history: false, instant: true })
  }
}
