import './toupies.css'
import { mount } from '@/features/carnet/carnet'
import { bump } from './bump'
import { controls } from './input'
import { settingsGear } from './settings'
import { spinner, type Spinner } from './spin'
import { stage } from './stage'
import { tilt } from './tilt'
import { traces } from './trace'

// Toupies: seven children's pump tops, in tinplate printed with different colours and patterns (see motifs.ts),
// standing on the page. You launch one (see input.ts): its plunger goes down, it spins, its colours blend as they
// do for the eye, then it slows down, wobbles, rattles and falls on its side (see spin.ts). You can push it (only
// if it spins), tilt the phone (see tilt.ts); they bump into each other and the edges, and rub (see bump.ts);
// their tip draws on the page (see trace.ts). The cog wheel changes the view (see settings.ts). Two are in
// front; the other five wait at the back: to see them well, you have to go and fetch them.

const canvas = document.querySelector<HTMLCanvasElement>('.tp-scene')!
const view = stage(canvas)
const { renderer, scene, camera } = view

// the tops, laid out as an arena: two in front (the quarters and the black and white stripes), the other five
// farther away, on an arc facing us (Benham in the middle), 16° apart
const ARC = ['pois', 'bicolore', 'benham', 'oiseau', 'lampes'] as const
const tops: Spinner[] = [
  spinner('quartiers', -1.8, 0),
  spinner('rayures', 1.8, 0),
  ...ARC.map((v, k) => {
    const a = ((k - (ARC.length - 1) / 2) * 16 * Math.PI) / 180
    return spinner(v, 16 * Math.sin(a), 4 - 16 * Math.cos(a))
  }),
]
for (const t of tops) {
  scene.add(t.wobble)
  if (t.pool) scene.add(t.pool)
}

controls(canvas, camera, tops)
const draw = traces(scene, tops)
const phone = tilt()
canvas.addEventListener('pointerdown', phone.start)

// the page in the notebook; the settings are added to it, after the page number
const slot = mount()
if (slot) settingsGear(slot, view.look)

let last = performance.now()
function frame(now: number) {
  requestAnimationFrame(frame)
  const dt = Math.min(0.05, (now - last) / 1000)
  last = now
  for (const t of tops) t.step(dt, phone.slope)
  bump(tops, camera, dt)
  view.step(dt)
  draw.step()
  renderer.render(scene, camera)
}
requestAnimationFrame(frame)
