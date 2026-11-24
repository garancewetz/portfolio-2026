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

// Créatures: the creatures made of characters sleep, each on its bit of string, as if on clotheslines
// (see lines.ts). On hover, the one you approach wakes up and bounces on its string, higher and higher,
// leaving behind a line in its colour, the shape of its jumps, which fades (see trace.ts); left alone, it calms
// down, settles, and falls asleep again (see bounce.ts). While they sleep, nothing moves.

// the notebook line (the lab, the page, its neighbours)
mount()

const CREATURES: Creature[] = [...C1, ...C2, ...C3, ...C4, ...C7]
const room = document.querySelector<HTMLElement>('.cr')!
const bouncers = CREATURES.map(bouncer)
// (without animation, if the system asks for it: awake, it opens its eyes, without jumping)
const still = matchMedia('(prefers-reduced-motion: reduce)').matches
const { draw } = lines(room, bouncers, wake)
const marks = trace(room, bouncers.length)

// the animation only runs while one is awake, or still moving
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
    // (two half-steps: the string is stiff, a whole step would make it quiver wrongly)
    busy = step(b, dt / 2) || busy
    busy = step(b, dt / 2) || busy
  }
  const t = now / 1000
  // (the trace: as long as it is not fully faded, keep going; without animation, no trace)
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
