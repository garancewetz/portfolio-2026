import './kit.css'
import './kit-pousse.css'
import './kit-small.css'
import { mount } from '@/features/carnet/carnet'
import { LOOKS, type LookName } from './looks'
import { QUIET, SAID, SPEAKING, WALK } from './said'
import { route } from './window'
import { stage } from './stage'

// Kit, one of Garance's projects: the problem it solves (which session waits for you?), what it does (a ticket's way,
// Pousse at each stop, then the ticket in Kit's window: a click on a step shows it), then Pousse, its mascot, the real one in 3D (looks.ts, stage.ts): in a scene where it speaks, hops,
// changes outfit and says something else every few seconds (a click on a line of the thread calls that message), then
// all its outfits.

// (Kit is a project, not a page of the lab: no notebook line; mount() still records the visit, for Abyme)
mount()

const still = matchMedia('(prefers-reduced-motion: reduce)').matches
const $ = <T extends Element = HTMLElement>(selector: string) => document.querySelector<T>(selector)!
const look = (name: LookName) => LOOKS[name]()
// (the scene's and the row's canvases are 1.6 times their place: see kit-pousse.css)
const ROOM = 1.6

// the Pousses drawn in the page itself: the hero's pile, the one beside « Avec Kit »
document.querySelectorAll<HTMLCanvasElement>('canvas[data-look]').forEach((canvas) => stage(canvas, look(canvas.dataset.look as LookName), still))

// one ticket's way through the steps, Pousse in the outfit of each stop
for (const stop of WALK) {
  const item = document.createElement('li')
  item.innerHTML = '<canvas aria-hidden="true"></canvas><small></small><b></b>'
  item.querySelector('small')!.textContent = stop.step
  item.querySelector('b')!.textContent = stop.line
  $('.kit-walk').append(item)
  stage(item.querySelector('canvas')!, look(stop.look), still, ROOM)
}

// Kit's window: a click on a step shows the ticket there (window.ts)
route(still)

// all its outfits, when it speaks and when it stays quiet
for (const [list, outfits] of [['.kit-speaking', SPEAKING], ['.kit-quiet', QUIET]] as const) {
  for (const [name, line] of outfits) {
    const item = document.createElement('li')
    item.innerHTML = '<canvas aria-hidden="true"></canvas><b></b>'
    item.querySelector('b')!.textContent = line
    $(list).append(item)
    stage(item.querySelector('canvas')!, look(name), still, ROOM)
  }
}

// the scene: Pousse speaks one message after another; the thread on the left follows
// (each outfit built once, then worn again and again)
const outfits = SAID.map((said) => look(said.look))
const speaker = stage($<HTMLCanvasElement>('.kit-pousse'), outfits[0], still, ROOM)
const card = $('.kit-card')
const lines = SAID.map((said, i) => {
  const item = document.createElement('li')
  const button = document.createElement('button')
  button.textContent = said.line
  button.addEventListener('click', () => say(i, true))
  item.append(button)
  $('.kit-said').append(item)
  return item
})
// it goes on by itself only while the scene is on screen, the tab seen, nobody's pointer or focus on it, and not
// paused (its « pause » button; never, for whoever asked for less motion)
const scene = $('.kit-scene')
const pause = $<HTMLButtonElement>('.kit-pause')
let now = -1
let timer = 0
let swap = 0
let paused = still
let held = false
let seen = false
function next(delay: number) {
  clearTimeout(timer)
  if (!paused && !held && seen && !document.hidden) timer = window.setTimeout(() => say((now + 1) % SAID.length), delay)
}
function say(i: number, chosen = false) {
  if (i === now) return
  const said = SAID[i]
  // (the first one it already wears)
  if (now >= 0) speaker.wear(outfits[i])
  now = i
  lines.forEach((item, j) => item.classList.toggle('now', j === i))
  // (a screen reader hears the card only when a line was chosen, not every few seconds)
  card.setAttribute('aria-live', chosen ? 'polite' : 'off')
  // the card changes with the hop: it leaves, and comes back with the new line
  card.classList.remove('in')
  clearTimeout(swap)
  swap = window.setTimeout(() => {
    $('.kit-card-line').textContent = said.line
    $('.kit-card-actions .kit-button').textContent = said.action
    card.querySelectorAll('.kit-card-steps i').forEach((bar, j) => (bar.className = j + 1 < said.step ? 'done' : j + 1 === said.step ? 'now' : ''))
    card.classList.add('in')
  }, still ? 0 : 240)
  // the next one in a few seconds (a chosen line holds a little longer)
  next(chosen ? 7000 : 4200)
}
for (const [type, hold] of [['pointerenter', true], ['pointerleave', false], ['focusin', true], ['focusout', false]] as const) {
  scene.addEventListener(type, () => {
    held = hold
    next(4200)
  })
}
new IntersectionObserver(([entry]) => {
  seen = entry.isIntersecting
  next(4200)
}).observe(scene)
addEventListener('visibilitychange', () => next(4200))
pause.hidden = still
pause.addEventListener('click', () => {
  paused = !paused
  pause.textContent = paused ? 'lecture' : 'pause'
  pause.setAttribute('aria-pressed', String(paused))
  next(1200)
})
say(0)
