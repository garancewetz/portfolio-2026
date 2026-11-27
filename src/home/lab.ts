import { carnet } from '@/content/content'
import { BACKDROP } from './backdrop'
import { activate, aim, scene } from './cards'
import { homeLink } from './header'
import { transition } from './motion'
import { LAB_URL, atLab, el } from './shared'

// The lab (the notebook of experiments), in the home page itself: the small snow globe at the end of the badges turns
// the page into the lab, on black: a small square card for each experiment, a short silent film of it (public/lab-clips:
// still until hovered, then playing; on a phone, playing while on screen), its name; a click
// opens it. The small « Garance Wetzel » brings the home page back. The address follows (/lab/): the lab opens
// directly, and the browser's back button works (route(), below, for the whole page).

// the experiments, in their order (what surprises and plays at once first, the creatures freed on Mascottes then
// follow the whole visit; then the contemplative and the personal; Abyme last: it climbs back up the visit. Same order
// as the notebook, carnet.ts)
const TILES: [href: string, clip: string][] = [
  ['/lab/mascots/', 'mascottes'],
  ['/lab/spinning-tops/', 'toupies'],
  ['/lab/murmuration/', 'murmuration'],
  ['/lab/ribbon/', 'ruban'],
  ['/lab/creatures/', 'creatures'],
  ['/lab/games/', 'jeux'],
  ['/lab/abyme/', 'abyme'],
]
const still = matchMedia('(prefers-reduced-motion: reduce)').matches
const touch = matchMedia('(hover: none)').matches
const mosaic = el(`<main class="lab-mosaic" tabindex="-1"><h1 class="sr">Le labo, mes expériences</h1><div class="lab-grid"></div></main>`)
const grid = mosaic.querySelector<HTMLElement>('.lab-grid')!
// (on a phone, no hover: the films play while their card is on the screen)
const seen = new IntersectionObserver((entries) => entries.forEach((e) => {
  const v = e.target as HTMLVideoElement
  if (e.isIntersecting) void v.play().catch(() => {})
  else v.pause()
}), { threshold: 0.5 })
for (const [href, clip] of TILES) {
  const page = carnet.pages.find((p) => p.href === href)!
  const tile = el(`<a class="lab-tile" href="${href}">
    <video muted loop playsinline preload="none" aria-hidden="true"></video>
    <b class="lab-name mono"></b>
  </a>`)
  const video = tile.querySelector('video')!
  Object.assign(video, { src: `/lab-clips/${clip}.mp4`, poster: `/lab-clips/${clip}.jpg`, muted: true })
  tile.querySelector('b')!.textContent = page.name
  if (!still) {
    if (touch) seen.observe(video)
    else {
      const play = () => void video.play().catch(() => {})
      const stop = () => { video.pause() }
      tile.addEventListener('pointerenter', play)
      tile.addEventListener('focus', play)
      tile.addEventListener('pointerleave', stop)
      tile.addEventListener('blur', stop)
    }
  }
  grid.append(tile)
}

// the page's canonical address follows: the lab, or the home page
const canonical = (path: string) => document.querySelector('link[rel="canonical"]')?.setAttribute('href', `https://garancewetz.dev${path}`)

// the active badge of the home page, to find it again on the way back
let inLab = false
let homeActive: string | null = null
export function enterLab({ history: push = true, instant = false } = {}) {
  if (inLab) return
  inLab = true
  homeActive = scene.querySelector<HTMLElement>('.row a.active')?.dataset.id || null
  if (push) history.pushState({ lab: true }, '', LAB_URL)
  document.title = 'Labo — Garance Wetzel'
  canonical('/lab/')
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
  canonical('/')
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
