import './toupies.css'
import { mount } from '@/features/carnet/carnet'
import { bump } from './bump'
import { controls } from './input'
import { settingsGear } from './settings'
import { spinner, type Spinner } from './spin'
import { stage } from './stage'
import { tilt } from './tilt'
import { traces } from './trace'

// Toupies : sept toupies d'enfant à pompe, en tôle imprimée de couleurs et de décors différents (voir motifs.ts),
// posées sur la page. On en lance une (voir input.ts) : sa pompe s'enfonce, elle tourne, ses couleurs se fondent comme
// pour l'œil, puis elle ralentit, vacille, grelotte et tombe sur le côté (voir spin.ts). On peut la pousser (seulement
// si elle tourne), pencher le téléphone (voir tilt.ts) ; elles se cognent entre elles et contre les bords, et se
// frottent (voir bump.ts) ; leur pointe dessine sur la page (voir trace.ts). La roue crantée change la vue (voir
// settings.ts). Deux sont devant ; les cinq autres attendent au fond : pour bien les voir, il faut aller les chercher.

const canvas = document.querySelector<HTMLCanvasElement>('.tp-scene')!
const view = stage(canvas)
const { renderer, scene, camera } = view

// les toupies, disposées en arène : deux devant (les quartiers et les rayures noir et blanc), les cinq autres plus
// loin, sur un arc de cercle tourné vers nous (au milieu, Benham), à 16° l'une de l'autre
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

// la page dans le carnet ; les réglages s'y ajoutent, après le numéro de page
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
