import { scene } from './cards'
import { YETI } from './data'
import { calm, el } from './shared'

// The yeti of the lab, standing on the o of « labo »; now and then (every 3 to 8 s) it jumps, flaps its arms and
// lands. The poses are drawn at their height in the jump, with empty lines below: those are removed, so that its feet
// stay in place; the CSS animation (lab.css) moves it up and down, softly.

const yeti = el('<pre class="yeti mono" aria-hidden="true"></pre>')
const POSES = YETI.map((f) => {
  const lines = f.split('\n')
  while (lines.length && !lines[lines.length - 1].trim()) lines.pop()
  while (lines.length < 7) lines.unshift(' '.repeat(9))
  return lines.join('\n')
})
const STANDING = 4
const pose = (k: number) => {
  yeti.textContent = POSES[k]
}
let awake = false

// on the o: centred on the last letter, its feet on the top of the o (from the font's own metrics)
function place() {
  const name = scene.querySelector<HTMLElement>('.signature .name')!
  const text = name.firstChild as Text | null
  if (!awake || !text) return
  const range = document.createRange()
  range.setStart(text, text.length - 1)
  range.setEnd(text, text.length)
  const o = range.getBoundingClientRect()
  const s = scene.querySelector('.signature')!.getBoundingClientRect()
  const st = getComputedStyle(name)
  const context = document.createElement('canvas').getContext('2d')!
  context.font = `${st.fontWeight} ${st.fontSize} ${st.fontFamily}`
  const m = context.measureText('o')
  const topOfO = o.top + m.fontBoundingBoxAscent - m.actualBoundingBoxAscent
  const below = parseFloat(getComputedStyle(yeti).fontSize) * 0.3 // the bottom of its last line, under the characters
  yeti.style.left = `${o.left + o.width / 2 - s.left - yeti.offsetWidth / 2}px`
  yeti.style.top = `${topOfO - s.top - yeti.offsetHeight + below}px`
}

let jumpTimer = 0
let poseTimers: number[] = []
function stopJumping() {
  clearTimeout(jumpTimer)
  poseTimers.forEach(clearTimeout)
  yeti.classList.remove('jumping')
}
function jump() {
  stopJumping()
  if (!awake || calm) return
  void yeti.offsetWidth
  yeti.classList.add('jumping')
  // crouching, the take-off, then up there it flaps softly (arms up, flat); it comes down arms flat, lands crouching
  const steps = [[0, 0], [180, 1], [380, 2], [640, 3], [900, 2], [1160, 3], [1500, 0], [1700, STANDING]]
  poseTimers = steps.map(([t, k]) => window.setTimeout(() => pose(k), t))
  jumpTimer = window.setTimeout(jump, 3000 + Math.random() * 5000)
}

// entering the lab: standing on the o, then jumping now and then; leaving: still
export function wakeYeti() {
  awake = true
  pose(STANDING)
  place()
  document.fonts.ready.then(place)
  if (!calm) jumpTimer = window.setTimeout(jump, 1500)
}
export function sleepYeti() {
  awake = false
  stopJumping()
}

export function setupYeti() {
  scene.querySelector('.signature')!.append(yeti)
  addEventListener('resize', place)
}
