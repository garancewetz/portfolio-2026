import './creatures.css'
import { mount } from '@/features/carnet/carnet'
import type { Creature } from './art'
import { C1 } from './bestiary-1'
import { C2 } from './bestiary-2'
import { C3 } from './bestiary-3'
import { C4 } from './bestiary-4'
import { C7 } from './bestiary-7'
import { bouncer, step } from './bounce'
import { lines } from './lines'
import { trace } from './trace'

// Créatures : les créatures en caractères dorment, chacune sur son bout de ficelle, comme sur des cordes à linge
// (voir lines.ts). Au survol, celle qu'on approche se réveille et fait du trampoline sur sa ficelle, de plus en
// plus haut, et laisse derrière elle un trait de sa couleur, la forme de ses sauts, qui s'efface (voir trace.ts) ;
// laissée, elle se calme, se pose, et se rendort (voir bounce.ts). Endormies, rien ne bouge.

// la ligne du carnet (le labo, la page, les voisines)
mount()

const CREATURES: Creature[] = [...C1, ...C2, ...C3, ...C4, ...C7]
const room = document.querySelector<HTMLElement>('.cr')!
const bouncers = CREATURES.map(bouncer)
// (sans animation, si on l'a demandé au système : réveillée, elle ouvre les yeux, sans sauter)
const still = matchMedia('(prefers-reduced-motion: reduce)').matches
const { draw } = lines(room, bouncers, wake)
const marks = trace(room, bouncers.length)

// l'animation ne tourne que si l'une est réveillée, ou bouge encore
let raf = 0
let last = 0
function frame(now: number) {
  const dt = Math.min(0.033, (now - last) / 1000)
  last = now
  let busy = false
  for (const b of bouncers) {
    if (still) {
      b.awake = b.hover
      continue
    }
    // (deux demi-pas : la ficelle est raide, un pas entier la ferait vibrer de travers)
    busy = step(b, dt / 2) || busy
    busy = step(b, dt / 2) || busy
  }
  const t = now / 1000
  // (la trace : tant qu'elle n'est pas tout à fait effacée, on continue ; sans animation, pas de trace)
  draw(still ? undefined : (i, x, y) => marks.add(i, x, y, t))
  if (!still) busy = marks.paint(t) || busy
  raf = busy ? requestAnimationFrame(frame) : 0
}
function wake() {
  if (raf) return
  last = performance.now()
  raf = requestAnimationFrame(frame)
}
draw()
