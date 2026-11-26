import './kit.css'
import './kit-pousse.css'
import './kit-small.css'
import { mount } from '@/features/carnet/carnet'
import { LOOKS, type LookName } from './looks'
import { QUIET, SAID, SPEAKING } from './said'
import { route } from './window'
import { stage } from './stage'

// Kit, one of Garance's projects: what it does (a ticket, from the plan to the merge, in Kit's window: a click on a step
// shows it), then Pousse, its mascot, the real one in 3D (looks.ts, stage.ts): in a scene where it speaks, hops,
// changes outfit and says something else every few seconds (a click on a line of the thread calls that message), then
// all its outfits.

// (Kit is a project, not a page of the lab: no notebook line; mount() still records the visit, for Abyme)
mount()

const still = matchMedia('(prefers-reduced-motion: reduce)').matches
const $ = <T extends Element = HTMLElement>(selector: string) => document.querySelector<T>(selector)!
const look = (name: LookName) => LOOKS[name]()
// (the scene's and the row's canvases are 1.6 times their place: see kit-pousse.css)
const ROOM = 1.6

// the Pousse of the hero
document.querySelectorAll<HTMLCanvasElement>('canvas[data-look]').forEach((canvas) => stage(canvas, look(canvas.dataset.look as LookName), still))

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
let now = -1
let timer = 0
function say(i: number, chosen = false) {
  if (i === now) return
  const said = SAID[i]
  // (the first one it already wears)
  if (now >= 0) speaker.wear(outfits[i])
  now = i
  lines.forEach((item, j) => item.classList.toggle('now', j === i))
  // the card changes with the hop: it leaves, and comes back with the new line
  card.classList.remove('in')
  setTimeout(() => {
    $('.kit-card-line').textContent = said.line
    $('.kit-card-actions .kit-button').textContent = said.action
    card.querySelectorAll('.kit-card-steps i').forEach((bar, j) => (bar.className = j + 1 < said.step ? 'done' : j + 1 === said.step ? 'now' : ''))
    card.classList.add('in')
  }, still ? 0 : 240)
  // the next one in a few seconds (a chosen line holds a little longer)
  clearTimeout(timer)
  if (!still) timer = window.setTimeout(() => say((now + 1) % SAID.length), chosen ? 7000 : 4200)
}
say(0)
