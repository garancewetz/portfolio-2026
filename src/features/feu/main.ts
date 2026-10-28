import './feu.css'
import { mount } from '@/features/carnet/carnet'
import { createFluid, type Fluid } from '@/features/fireworks/fluid'
import { HALO, NEAR, SMOKE, STARS, rhythm } from '@/features/fireworks/rhythm'
import { around, type Planes } from '@/features/fireworks/salvos'
import { createShow } from '@/features/fireworks/show'
import { starField } from '@/features/fireworks/stars'
import { palette, settings, settingsGear } from './settings'

// Feu d'artifice : le spectacle du mode feu d'artifice de l'accueil (features/fireworks), seul sur sa page, sur un
// ciel de nuit, et qui ne finit pas. Le même rythme (fusées seules ou par deux, un bouquet, un silence), les mêmes
// deux plans : des gerbes lointaines, petites, avec leur fumée qui s'accumule, et des gerbes proches, immenses ;
// chacune fait fleurir son halo de couleur liquide. Un clic fait éclater une gerbe là où l'on clique. La roue
// crantée règle la cadence, la taille des gerbes et leurs couleurs (settings.ts).

const main = document.querySelector<HTMLElement>('.fe')!
// le ciel : ses étoiles, en deux groupes qui scintillent chacun à son rythme
const [a, b] = starField(STARS)
const [one, two] = main.querySelectorAll<HTMLElement>('.fe-sky i')
one.style.boxShadow = a
two.style.boxShadow = b

// les toiles, du fond vers l'avant : fumée, plan lointain (halo, étincelles), plan proche (halo, étincelles)
const [smokeCanvas, farHaloCanvas, farCanvas, nearHaloCanvas, nearCanvas] = main.querySelectorAll('canvas')
// (sur un petit écran, un téléphone : pas de fumée, et des halos moins fins, pour rester fluide)
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
  // une gerbe, une fusée : dans le plan qui convient à leur taille
  const planes: Planes = {
    burst: (x, y, size, close = size >= NEAR) => (close ? near : far).burst(x, y, size),
    launch: (x, y, size, trail, close = size >= NEAR) => (close ? near : far).launch(x, y, size, trail),
  }
  // une fusée, quelque part dans le ciel, de taille variée (la profondeur), à l'échelle choisie ; une gerbe proche
  // le reste (elle garde sa profondeur, voir NEAR)
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

  // l'ouverture : une fusée au milieu, puis le spectacle, sans fin
  near.launch(innerWidth / 2, innerHeight * 0.36, 2, 0)
  rhythm(rocket, undefined, () => settings.pace)

  // un clic : une gerbe à cet endroit (proche : c'est le geste du visiteur)
  main.addEventListener('pointerdown', (e) => planes.burst(e.clientX, e.clientY, 1.3 * settings.size, true))
  addEventListener('resize', () => {
    far.resize()
    near.resize()
    for (const f of fluids) f.resize()
  })
}

// la page dans le carnet (voir features/carnet), et sa roue crantée
const slot = mount()
if (slot) settingsGear(slot)
