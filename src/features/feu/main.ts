import './feu.css'
import { mount } from '@/features/carnet/carnet'
import { createFluid, type Fluid } from '@/features/fireworks/fluid'
import { HALO, NEAR, SMOKE, STARS, rhythm } from '@/features/fireworks/rhythm'
import { around, type Planes } from '@/features/fireworks/salvos'
import { createShow } from '@/features/fireworks/show'
import { starField } from '@/features/fireworks/stars'
import { palette, settings, settingsGear } from './settings'

// Feu d'artifice: the show from the home's fireworks mode (features/fireworks), alone on its page, on a night
// sky, and never ending. The same rhythm (rockets alone or in pairs, a finale, a silence), the same two planes:
// distant bursts, small, with their smoke piling up, and near bursts, huge; each one makes its halo of liquid
// colour bloom. A click sets off a burst where you click. The cog wheel sets the pace, the size of the bursts
// and their colours (settings.ts).

const main = document.querySelector<HTMLElement>('.fe')!
// the sky: its stars, in two groups each twinkling at its own rhythm
const [a, b] = starField(STARS)
const [one, two] = main.querySelectorAll<HTMLElement>('.fe-sky i')
one.style.boxShadow = a
two.style.boxShadow = b

// the canvases, from back to front: smoke, far plane (halo, sparks), near plane (halo, sparks)
const [smokeCanvas, farHaloCanvas, farCanvas, nearHaloCanvas, nearCanvas] = main.querySelectorAll('canvas')
// (on a small screen, a phone: no smoke, and coarser halos, to stay smooth)
const small = innerWidth < 700
const halo = small ? { ...HALO, dye: 320 } : HALO
const smoke = small ? null : createFluid(smokeCanvas, SMOKE)
const farHalo = createFluid(farHaloCanvas, halo)
const nearHalo = createFluid(nearHaloCanvas, halo)
const fluids = [smoke, farHalo, nearHalo].filter((f): f is Fluid => !!f)
const far = createShow(
  farCanvas,
  (x, y, size, colors) => {
    farHalo?.burst(x, y, size, colors)
    smoke?.burst(x, y, size * 1.4)
  },
  palette,
)
const near = createShow(nearCanvas, (x, y, size, colors) => nearHalo?.burst(x, y, size, colors), palette)

if (far && near) {
  // a burst, a rocket: in the plane that suits their size
  const planes: Planes = {
    burst: (x, y, size, close = size >= NEAR) => (close ? near : far).burst(x, y, size),
    launch: (x, y, size, trail, close = size >= NEAR) => (close ? near : far).launch(x, y, size, trail),
  }
  // a rocket, somewhere in the sky, of varied size (the depth), at the chosen scale; a near burst stays near
  // (it keeps its depth, see NEAR)
  const rocket = () => {
    const size = around(0.5, 2.3)
    planes.launch(
      innerWidth * around(0.04, 0.96),
      innerHeight * around(0.08, 0.6),
      size * settings.size,
      undefined,
      size >= NEAR,
    )
  }

  let last = performance.now()
  const frame = (now: number) => {
    const dt = Math.min(0.033, (now - last) / 1000)
    last = now
    for (const f of fluids) f.step(dt)
    far.step(dt)
    near.step(dt)
    requestAnimationFrame(frame)
  }
  requestAnimationFrame(frame)

  // the opening: a rocket in the middle, then the show, endless
  near.launch(innerWidth / 2, innerHeight * 0.36, 2, 0)
  rhythm(rocket, undefined, () => settings.pace)

  // a click: a burst at that spot (near: it is the visitor's gesture)
  main.addEventListener('pointerdown', (e) => planes.burst(e.clientX, e.clientY, 1.3 * settings.size, true))
  addEventListener('resize', () => {
    far.resize()
    near.resize()
    for (const f of fluids) f.resize()
  })
}

// the page in the notebook (see features/carnet), and its cog wheel
const slot = mount()
if (slot) settingsGear(slot)
