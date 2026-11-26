import { glBackground } from './gl-background'
import { placeLabel } from './place-label'
import { RELIEF_FS, RELIEF_SETTINGS, PROJECT_PLACES } from './relief-shader'
import { texturesStartingWith } from './reliefs'
import { QUERY, calm } from './shared'
import { snowGlobe } from './snow-globe'
import { atThisHour } from './time-of-day'

// The backdrop of the home page: Garance's places in relief (relief-shader.ts), in the light of the hour it is in
// Paris (time-of-day.ts), with the name of the place shown (place-label.ts) and the snow globe (snow-globe.ts).

export const SETTINGS = atThisHour(RELIEF_SETTINGS)
// an old link to a project (?p=id, see cards.ts): the backdrop starts from its place
const asked = QUERY.get('p')
const START = asked && SETTINGS[asked] ? asked : 'rest'

export const inLabNow = () => document.documentElement.classList.contains('in-lab')
// on arrival the backdrop is flat (the sea of clouds) and nothing else shows but an arrow; the first stretch of
// scrolling (--lead in cards.css: 1.7 screens, 1.5 on a phone) raises the Canigou out of the clouds: it answers the
// very first move of the wheel (eased out: quick at first, slowing down as it comes up), so that scrolling is never
// in vain
const lead = () => innerHeight * (innerWidth <= 820 ? 1.5 : 1.7)
// the settings following the scroll (they stay as they are while hovering); in the lab: the whole relief
export const SCROLL_DRIVEN: Record<string, () => number> = {
  rise: () => {
    if (inLabNow()) return 1
    const x = Math.min(1, Math.max(0, scrollY / lead()))
    return 1 - (1 - x) * (1 - x)
  },
}
export const scrollDriven = () => Object.fromEntries(Object.entries(SCROLL_DRIVEN).map(([k, f]) => [k, f()]))

// hovering a badge works as soon as the badges are on the screen (not on arrival, while only the clouds show)
export function hoverAllowed() {
  if (inLabNow()) return true
  const first = document.querySelector('.row a')
  return !!first && first.getBoundingClientRect().top < innerHeight - 40
}


// smaller on a phone; shorter for whoever asked for less motion
const canvas = document.querySelector<HTMLCanvasElement>('#backdrop')!
export const BACKDROP = placeLabel(
  glBackground(canvas, RELIEF_FS, SETTINGS[START], {
    scale: matchMedia('(pointer: coarse)').matches || innerWidth < 820 ? 0.35 : 0.75,
    textures: texturesStartingWith(PROJECT_PLACES[START]),
    duration: calm ? 500 : 1600,
    ready: () => document.documentElement.classList.add('backdrop-ready'),
  }),
  SETTINGS[START] as { here: number },
)

export function setupBackdrop() {
  snowGlobe(BACKDROP)
  // the other reliefs: at the first gesture, or as soon as the page is idle after arriving (4 s at the latest)
  const loadTheRest = () => BACKDROP.loadAll()
  addEventListener('pointerdown', loadTheRest, { once: true })
  setTimeout(() => ('requestIdleCallback' in window ? requestIdleCallback(loadTheRest, { timeout: 3000 }) : loadTheRest()), 1200)
}
