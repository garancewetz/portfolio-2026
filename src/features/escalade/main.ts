import './escalade.css'
import { mount } from '@/features/carnet/carnet'
import { sheet } from '@/features/carnet/sheet'
import { createBody } from './body'
import { input } from './input'
import { intro } from './intro'
import { createShake } from './shake'
import { sleepInTab } from './tab'
import { createTrail } from './trail'
import { createDoor } from './door'
import { screenRect, windows } from './windows'
import {
  CARRIED,
  CLIMB,
  CROUCH,
  FALL,
  HANG,
  PUSHED,
  RISE,
  SLEEP,
  STAND,
  WALK,
  WAVE,
  mirror,
  type Sprite,
} from './sprites'

// Escalade: a little man made of characters having fun with the browser window. On arrival, his characters lie
// scattered; at the first move, he comes together and picks up his head (intro.ts). He walks along the bottom,
// climbs the sides, moves along hanging from the top edge, jumps (body.ts); you can grab him with the mouse
// (input.ts). The window is his box: resizing it pushes him, makes him fall, crushes him; moving it fast
// jostles him (shake.ts). Wherever he goes, he leaves a trail (trail.ts). When you switch to another tab, he
// falls asleep (tab.ts). And between windows laid side by side, he crosses over (windows.ts).

const main = document.querySelector<HTMLElement>('.es')!
const man = main.querySelector<HTMLElement>('.es-man')!
const hint = main.querySelector<HTMLElement>('.es-hint')!

// the size of the page, and of the little man (his box: 3 characters by 4 lines)
const size = () => {
  const { w: W, h: H } = sheet()
  return { W, H, w: man.offsetWidth, h: man.offsetHeight }
}
// (drawn first: his box has its size before he is placed in the middle)
man.textContent = STAND.join('\n')
const trail = createTrail(main.querySelector<HTMLCanvasElement>('.es-trail')!)
const { body, step, start, fall, drag } = createBody(size, trail)
const shake = createShake()

// the door, and its sill (a line that stays); when the window changes size, it moves
const door = createDoor(main, size)
const placeDoor = () => {
  door.move()
  trail.clear()
}
placeDoor()
addEventListener('resize', placeDoor)
// arrived in front of the door: a wave, the door opens, he goes in, it closes; then a new level (the page
// empties, he comes back at the bottom, the door is elsewhere)
let entering = false
function enter() {
  entering = true
  body.where = 'door'
  body.face = 1
  // (in front of the door, feet on the bottom of the door)
  Object.assign(body, door.front(man.offsetWidth, man.offsetHeight))
  const later = (ms: number, f: () => void) => setTimeout(f, ms)
  later(1400, () => door.open())
  later(1800, () => (body.x = door.middle() - man.offsetWidth / 2))
  later(2100, () => (body.where = 'away'))
  later(2500, () => door.shut())
  later(3400, () => {
    placeDoor()
    start()
    entering = false
  })
}

// the arrival: his scattered characters, which come together at the first move
const loose = intro(main, man, STAND, () => ({ x: body.x, y: body.y }))

const { steer } = input(main, {
  body,
  size,
  onGesture: () => {
    hint.classList.add('is-off')
    // (not formed yet: the first move brings him together)
    if (!loose.formed) loose.start()
  },
  drop: (vx, vy) => body.where === 'carried' && fall(vx, vy),
  drag,
})

// he falls asleep when you switch to another tab; he starts on your return
let wakeTab: (() => void) | null = null
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    if (!loose.formed || body.where === 'away') return
    body.where = 'sleep'
    body.y = size().H - size().h
    wakeTab = sleepInTab()
  } else if (body.where === 'sleep') {
    wakeTab?.()
    fall(0, -480)
  }
})

// from one window to another
const link = windows({
  has: () => body.where !== 'away',
  leave: () => {
    body.where = 'away'
    loose.dismiss()
  },
  enter: (side, y, floor) => {
    const { W, H, w, h } = size()
    loose.dismiss()
    Object.assign(body, { x: side === -1 ? 0 : W - w, y: Math.min(H - h, Math.max(0, y)), face: -side, vx: 0, vy: 0 })
    body.where = floor ? 'floor' : 'air'
    if (floor) body.y = H - h
  },
  adopt: () => {
    loose.dismiss()
    start()
  },
})
// walking (or jumping) against an edge that touches another window: he crosses into it
function crossing(dx: number) {
  if (!dx || (body.where !== 'floor' && body.where !== 'air')) return
  const { W, w, h } = size()
  const side = dx > 0 ? 1 : -1
  if (side === 1 ? body.x < W - w - 0.5 : body.x > 0.5) return
  const screenY = screenRect().top + body.y + h / 2
  const to = link.neighbour(side, screenY)
  if (!to) return
  link.send(to, side, screenRect().top + body.y, body.where === 'floor')
  body.where = 'away'
}

// the posture: the frame that goes with what he is doing, and the distance covered (one frame every STRIDE px)
const STRIDE = 13
function sprite(now: number): Sprite {
  const n = Math.floor(body.trip / STRIDE)
  const pick = (list: Sprite[]) => list[n % list.length]
  const tick = (list: Sprite[], ms: number) => list[Math.floor(now / ms) % list.length]
  const w = body.where
  const s =
    w === 'door'
      ? tick(WAVE, 240)
      : w === 'sleep'
        ? tick(SLEEP, 900)
        : w === 'carried'
          ? tick(CARRIED, 300)
          : w === 'air'
            ? body.vy < 0
              ? RISE
              : FALL
            : w === 'wall' || (w === 'line' && body.steep)
              ? pick(CLIMB)
              : w === 'ceiling' || w === 'line'
                ? pick(HANG)
                : body.squashed
                  ? CROUCH
                  : body.pushed > 0
                    ? PUSHED
                    : body.moving
                      ? pick(WALK)
                      : STAND
  return body.face === -1 ? mirror(s) : s
}

let last = performance.now()
let drawn = man.textContent
let was = body.where // (where he was, on the previous frame)
function frame(now: number) {
  const dt = Math.max(0, Math.min(0.05, (now - last) / 1000))
  last = now
  const { ax, ay } = shake(dt)
  if (loose.formed) {
    const k = steer()
    step(dt, k, ax, ay)
    // (the jump is a press: consumed)
    k.jump = false
    // in front of the door (hanging on a line, jumping, falling; not dragged by the mouse): he has won
    const free = body.where === 'line' || body.where === 'air' || body.where === 'wall' || body.where === 'ceiling'
    if (!entering && free && door.reached(body.x, body.y, man.offsetWidth, man.offsetHeight)) enter()
    crossing((k.right ? 1 : 0) - (k.left ? 1 : 0))
  }
  const text = sprite(now).join('\n')
  if (text !== drawn) man.textContent = drawn = text
  man.style.transform = `translate(${body.x}px, ${body.y}px)`
  // the trail starts from his back foot (behind him, on the side he comes from); elsewhere or asleep, it
  // breaks off
  // (just grabbed: he jumped up to the cursor, the trail picks up from there)
  if (body.where === 'carried' && was !== 'carried') trail.lift()
  was = body.where
  if (loose.formed && body.where !== 'away' && body.where !== 'sleep' && body.where !== 'door')
    trail.to(body.face === 1 ? body.x + 5 : body.x + man.offsetWidth - 5, body.y + man.offsetHeight)
  else trail.lift()
  man.style.visibility = loose.formed && body.where !== 'away' ? '' : 'hidden'
  requestAnimationFrame(frame)
}
requestAnimationFrame(frame)

// the page in the notebook (see features/carnet), and its cog wheel (the trail)
const slot = mount()
if (slot) trail.settings(slot)
