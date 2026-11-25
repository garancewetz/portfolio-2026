import { BACKDROP, scrollDriven } from './backdrop'
import { PROJECTS_MODE, activate, aim, layCards, scene, type Mode } from './cards'
import { SHOTS } from './data'
import { homeLink } from './header'
import { approach, transition } from './motion'
import { RELIEF_SETTINGS } from './relief-shader'
import { placeWeights } from './reliefs'
import { LAB_URL, QUERY, calm } from './shared'
import { setupYeti, sleepYeti, wakeYeti } from './yeti'

// The lab (the notebook of experiments), in the home page itself: « labo → » turns the badges into experiments, the
// page changes shape (« labo » large at the top, the yeti standing on its o, see yeti.ts; the experiments as badges,
// on the line of « hello, world. »; no scrolling), and the backdrop goes to Arles: from Trinquetaille, across the
// Rhône, the rock of the old town and the Roquette at its feet (the bare ground, from IGN's laser), reflected in the
// river. It arrives at night; each experiment sets another hour, from dawn to the starry night: the light (the sun's
// angle and height) and the blue. Clicking an experiment: the camera moves into the backdrop (see approach,
// motion.ts), then it opens. « hello, world. » brings the home page back. The address follows (?labo): the lab opens
// directly, and the browser's back button works (route(), below, for the whole page).

// the experiments, their own pages on this site, in the order of the day (their hours: HOURS, below)
const LAB_PAGES = [
  { id: 'ruban', title: 'ruban', href: '/ruban/' },
  { id: 'toupies', title: 'toupies', href: '/toupies/' },
  { id: 'kit', title: 'kit', href: '/kit/' },
  { id: 'abyme', title: 'abyme', href: '/abyme/' },
  { id: 'murmuration', title: 'murmuration', href: '/murmuration/' },
  { id: 'creatures', title: 'créatures', href: '/creatures/' },
]
// the hours over Arles: the blue (more or less dark), the sun (angle, height), the stars. The gaze dips a little: the
// Rhône and the rock above the badges.
const ARLES = { ...RELIEF_SETTINGS.rest, ...placeWeights('arles'), gaze: 0.18, rise: 1, center: [0, 0] }
const hourSetting = (tint: string, sky: string, light: number, sun: number, stars = 0) => ({ ...ARLES, tint, sky, light, sun, stars })
const HOURS: Record<string, ReturnType<typeof hourSetting>> = {
  rest: hourSetting('#151a92', '#3c48cc', -1.6, 0.3, 0.7), // arriving: the blue night, a few stars
  toupies: hourSetting('#2b46ea', '#c3c8ff', -3.0, 0.12), // dawn: the sun skimming the water
  kit: hourSetting('#2f4cf2', '#b4beff', -2.6, 0.5), // mid-morning, bright
  abyme: hourSetting('#1414e6', '#9a9aff', -2.2, 0.9), // noon: the blue of the home page
  murmuration: hourSetting('#2a1690', '#6a4fd6', -0.3, 0.1, 0.25), // indigo dusk
  creatures: hourSetting('#0d1266', '#26308f', -1.6, 0.3, 0.85), // the starry night, under the moon
  ruban: hourSetting('#070a3c', '#151c5e', -4.6, 0.25, 1), // the dark night
}

// leaving for an experiment: the camera moves in, then the page goes; cancelled if we leave the lab meanwhile.
// (top: the whole window, also from inside Abyme)
let departure = 0
function cancelDeparture() {
  clearTimeout(departure)
  document.documentElement.classList.remove('leaving')
}
const LAB_MODE: Mode = {
  items: LAB_PAGES.map((x) => ({ id: x.id, title: x.title, src: `${SHOTS}${x.id}.webp`, href: x.href })),
  signature: 'labo',
  aim: (id) => ({ ...HOURS[id], ...scrollDriven(), rise: 1 }),
  open: (id) => {
    const href = LAB_PAGES.find((p) => p.id === id)!.href
    const go = () => {
      window.top!.location.href = href
    }
    if (calm) return go()
    cancelDeparture()
    document.documentElement.classList.add('leaving')
    approach(1)
    departure = window.setTimeout(go, 900)
  },
}

// the active badge (and its place), to find it again on the way back
let inLab = false
let homeActive: string | null = null
export function enterLab({ history: push = true, instant = false } = {}) {
  if (inLab) return
  inLab = true
  homeActive = scene.querySelector<HTMLElement>('.row a.active')?.dataset.id || null
  if (push) history.pushState({ lab: true }, '', LAB_URL)
  document.title = 'Labo — Garance Wetzel'
  BACKDROP.goTo(LAB_MODE.aim('rest'))
  const update = () => {
    layCards(LAB_MODE)
    document.documentElement.classList.add('in-lab')
    scrollTo(0, 0)
    wakeYeti()
  }
  if (instant) update()
  else transition(update)
}
function leaveLab({ history: push = true } = {}) {
  if (!inLab) return
  inLab = false
  sleepYeti()
  cancelDeparture()
  approach(0, true)
  if (push) history.pushState({}, '', location.pathname)
  document.title = 'Garance Wetzel'
  transition(() => {
    layCards(PROJECTS_MODE)
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
  setupYeti()
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
  // back from an experiment with the back button (the page kept in memory): out of the backdrop again
  addEventListener('pageshow', (e) => {
    if (!e.persisted) return
    cancelDeparture()
    approach(0, true)
  })
  if (QUERY.has('labo')) enterLab({ history: false, instant: true })
}
