import './murmuration.css'
import { mount } from '@/features/carnet/carnet'
import { local, sheet } from '@/features/carnet/sheet'
import { land, landed, landing, lift, settings } from './flock'
import { VILLAGE_W, grid, resize } from './grid'
import { perchCol, perchRow, perches } from './perches'
import { startle, startled, startledSpan } from './startle'
import { draw, mouse } from './draw'
import { settingsGear } from './settings'

// Murmuration: a flock of starlings, drawn in characters over the whole page, above a hilltop village.
// At first, the birds are perched on the village roofs and along the bottom of the page. A click anywhere makes
// them take off: they do their murmuration, then, after twenty-five seconds, the cloud lowers above the village,
// tightens, and the birds dive down to land in streams. A click mid-flight makes them land at once; perched,
// another click sends them off again, and so on.
// Perched, they take off when the mouse passes over them, make a little loop and come back to their place; and
// now and then, one or two take off on their own.
// Mid-flight, the mouse acts like a falcon: the cloud parts on each side of its path, a wave of agitation crosses
// it, then it closes up.
// You can also watch it frame by frame: by scrolling (two fingers on the trackpad, or the wheel), time moves
// forward or back; with the ← → arrows, one frame at a time.
//
// Seen from afar, a flock of starlings is a large three-dimensional sheet of birds: where it folds, or when seen
// edge-on, the birds overlap and the cloud darkens; when it opens, it lightens. Here, each bird has its place in
// a sheet that ripples, twists and slowly turns as it drifts across the sky. The movement starts from the front
// and spreads: each bird follows with a little delay, and floats at its own rhythm around its place. Now and
// then, a falcon passes and a wave crosses the cloud.
// The sky is a grid of characters: the more birds in a cell, the denser the sign.
//
// The pieces: grid.ts (the sky grid), flock.ts (the birds and the flight sequence), perches.ts (where they land),
// startle.ts (startled take-offs), pose.ts (the shape of the sheet), draw.ts (drawing each frame).

// flying (the animation loop is running) or not (perched, or flight frozen); the loop and its last time
let flying = false
let frame = 0
let last = 0
// how many are in the air right now after being disturbed (as long as there are some, keep drawing)
let startledNow = 0

addEventListener('pointermove', (e) => {
  ;({ x: mouse.x, y: mouse.y } = local(e))
  wake()
})
document.documentElement.addEventListener('pointerleave', () => {
  mouse.x = mouse.y = -1e5
})
// (with a finger: when it lifts, it is no longer on the page; otherwise, the birds back in their place under the
// last spot touched would take off endlessly)
// a press (mouse or finger) released without sliding: it is a click (with a finger, on a phone, the browser's
// « click » does not always reach a page with no link or button)
let downX = 0
let downY = 0
addEventListener('pointerdown', (e) => {
  downX = e.clientX
  downY = e.clientY
})
addEventListener('pointerup', (e) => {
  if (Math.hypot(e.clientX - downX, e.clientY - downY) < 12) {
    const { x, y } = local(e)
    press(x, y)
  }
  if (e.pointerType !== 'mouse') mouse.x = mouse.y = -1e5
})

// ——— Flying, staying frozen, or stepping frame by frame ———
// clock: flight time, in seconds (it only moves forward while the birds fly, or while scrolling); the sheet
// starts from a moment when it looks good
let clock = 0
const show = () => (startledNow = draw(14 + clock, clock, flying))
// with the flight stopped (perched, or frozen), keep drawing as long as the mouse moves or disturbed birds are
// in the air
let idle = 0
let lastMove = 0
function wake() {
  lastMove = performance.now()
  if (!flying && !idle) idle = requestAnimationFrame(idleFrame)
}
// birds that cannot keep still: now and then, when all are perched, one or two take off from a roof on their
// own, make their little loop and land again (as in a real starling roost; and it says, without a word, that
// they can fly)
function restless() {
  if (!flying && landed(clock) && grid.cols) {
    const seconds = performance.now() / 1000
    const n = Math.random() < 0.4 ? 2 : 1
    for (let k = 0, tries = 0; k < n && tries < 50; tries++) {
      const i = Math.floor(Math.random() * settings.count)
      // (on a roof, not on the bottom of the page; and not already in the air)
      if (perchRow[i] >= grid.rows - 1 || seconds - startled[i] < startledSpan[i] + 0.5) continue
      startle(
        i,
        (perchCol[i] + 0.5) * grid.cellW,
        grid.skyTop + (perchRow[i] + 0.5) * grid.cellH,
        seconds + k * 0.2,
        Math.random() < 0.5 ? 1 : -1,
      )
      k++
    }
    if (!idle) idle = requestAnimationFrame(idleFrame)
  }
  setTimeout(restless, 4000 + Math.random() * 6000)
}
setTimeout(restless, 3000)
function idleFrame() {
  idle = 0
  if (flying) return
  show()
  if (startledNow > 0 || performance.now() - lastMove < 200) idle = requestAnimationFrame(idleFrame)
}
function loop(now: number) {
  // (the real elapsed time, but no more than a tenth of a second at once: after a background tab, the flight
  // picks up where it was)
  if (last) clock += Math.min(0.1, (now - last) / 1000) * settings.speed
  last = now
  show()
  // (all landed again: nothing moves any more, stop until the next click)
  if (landed(clock)) return toggle()
  frame = requestAnimationFrame(loop)
}
function toggle() {
  flying = !flying
  if (flying) {
    last = 0
    frame = requestAnimationFrame(loop)
  } else cancelAnimationFrame(frame)
}
// moving time forward or back by hand (the flight freezes first, if it was flying)
function scrub(seconds: number) {
  if (flying) toggle()
  clock = Math.max(0, clock + seconds)
  show()
}
// a click: perched (all of them, or landing), make them take off; mid-flight, make them land again (if the
// flight was frozen by scrolling, it restarts it)
function press(x = (grid.villageCol + VILLAGE_W / 2) * grid.cellW, y = sheet().h) {
  if (landed(clock) || landing(clock)) {
    lift(clock, x, y)
    if (!flying) toggle()
  } else if (!flying) toggle()
  else land(clock)
}
addEventListener('keydown', (e) => {
  // Space or Enter: like a click
  if (e.key === ' ' || e.key === 'Enter') {
    e.preventDefault()
    press()
  }
  // ← →: one frame back or forward (with Shift: half a second)
  if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
    e.preventDefault()
    scrub((e.key === 'ArrowRight' ? 1 : -1) * (e.shiftKey ? 0.5 : 1 / 60))
  }
})
// scrolling (two fingers on the trackpad, or the wheel): time follows the fingers, down or right it moves
// forward, up or left it goes back (four pixels of scrolling: one frame)
addEventListener(
  'wheel',
  (e) => {
    // (not the pinch to zoom: the browser keeps it)
    if (e.ctrlKey) return
    e.preventDefault()
    const px = e.deltaMode === 1 ? (e.deltaX + e.deltaY) * 16 : e.deltaX + e.deltaY
    scrub(px / 4 / 60)
  },
  { passive: false },
)
addEventListener('resize', () => {
  resize()
  perches()
  show()
})

document.fonts.ready.then(() => {
  resize()
  perches()
  show()
})

// the page in the notebook (see features/carnet), with its cog wheel (see settings.ts)
const nav = mount()
if (nav) settingsGear(nav, show)
