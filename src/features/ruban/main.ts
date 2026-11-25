import './ruban.css'
import { mount } from '@/features/carnet/carnet'
import { gear, slider } from '@/features/carnet/gear'
import { local, sheet } from '@/features/carnet/sheet'
import { controls } from './controls'
import { intro } from './intro'
import { hue, noteName, toHz, toMidi } from './pitch'
import { ribbons } from './ribbon'
import { rider } from './rider'
import { scale } from './scale'
import { listen, MicError, type Heard, type Voice } from './voice'

// Ruban: a black background, and the voice drawing a ribbon of light on it. Nothing is explained (the arrival
// only has the title and two buttons): you discover that the note sets the height (high pitch at the top) and
// the colour (one turn of the colour wheel per octave), that the volume sets the thickness and the glow, that
// the ribbon runs to the left and stays, and that a silence cuts it (ribbon.ts). On it, a little yeti walks,
// slides down the slopes, climbs when it is steep, and jumps from one ribbon to another (rider.ts). On the left
// edge, the scale, at the same height and in the same colour (scale.ts). At the bottom, a button (controls.ts):
// save the drawing as an image. Without a mic, you draw with a finger (press: higher, higher pitch). The cog
// wheel sets the register (the middle note), the range, the speed, and the sensitivity.

const main = document.querySelector<HTMLElement>('.ru')!
const canvas = main.querySelector<HTMLCanvasElement>('.ru-canvas')!
const g = canvas.getContext('2d')!
const readout = main.querySelector<HTMLElement>('.ru-note')!

let W = 0
let H = 0
function resize() {
  ;({ w: W, h: H } = sheet())
  const dpr = Math.min(2, devicePixelRatio || 1)
  canvas.width = Math.round(W * dpr)
  canvas.height = Math.round(H * dpr)
  g.setTransform(dpr, 0, 0, dpr, 0, 0)
}
resize()
// (in development, the stylesheet arrives after the script: measure again when the page gets its size)
new ResizeObserver(resize).observe(main)

// the settings: the note in the middle of the page (MIDI; by default, between 90 and 750 Hz, enough to sing low
// or high), the range (in octaves, from the bottom to the top of the page), the ribbon's speed (in pixels per
// second, and the little man's stride) and the mic's sensitivity
const settings = { centre: Math.round(toMidi(Math.sqrt(90 * 750))), span: 3, pace: 100, sensitivity: 1 }
const lo = () => settings.centre - settings.span * 6
const hi = () => settings.centre + settings.span * 6
// the band where the ribbon runs: under the notebook line, above the bottom of the page
const yOf = (midi: number) => H - 40 - ((midi - lo()) / (hi() - lo())) * (H - 96)
const midiOf = (y: number) => lo() + ((H - 40 - y) / (H - 96)) * (hi() - lo())
// the ribbon's head on the page, how far the scrolling has gone (in world pixels), and where a world point
// lands on the page
const headX = () => W * 0.72
let scroll = 0
const screenX = (x: number) => headX() - (scroll - x)

// ——— what sings ———

let voice: Voice | null = null
let playing = false
// the finger (or the mouse) pressed: its height sets the note, at a soft volume
let finger: number | null = null
main.addEventListener('pointerdown', (e) => {
  if (!playing) return
  finger = local(e).y
  try {
    main.setPointerCapture(e.pointerId)
  } catch {
    // (a press already released)
  }
})
main.addEventListener('pointermove', (e) => finger !== null && (finger = local(e).y))
for (const type of ['pointerup', 'pointercancel'] as const) main.addEventListener(type, () => (finger = null))

const door = intro(main, {
  async mic() {
    door.asking(true)
    try {
      voice = await listen()
      play()
    } catch (e) {
      door.fail(e instanceof MicError ? e.why : 'unsupported')
    } finally {
      door.asking(false)
    }
  },
  finger: () => play(),
})
let since = 0
function play() {
  // (only once)
  if (playing) return
  playing = true
  since = performance.now() / 1000
  door.close()
  main.classList.add('is-playing')
  // the button appears
  button = controls(main, { save })
  settingsUp()
}

// ——— saving ———

let button: ReturnType<typeof controls> | null = null
function save() {
  canvas.toBlob((blob) => {
    if (!blob) return
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = 'ruban.png'
    a.click()
    setTimeout(() => URL.revokeObjectURL(a.href), 1000)
  })
}

// the notebook line (the lab, the page, its neighbours), and the cog wheel, once you sing
const slot = mount()
function settingsUp() {
  if (!slot) return
  gear(
    slot,
    'Réglages de Ruban',
    [
      slider(
        'registre',
        { min: 40, max: 76, step: 1, value: settings.centre, show: (n) => `${noteName(n)} au milieu` },
        (n) => (settings.centre = n),
      ),
      slider(
        'étendue',
        { min: 1, max: 4, step: 0.5, value: settings.span, show: (n) => `${n} oct.` },
        (n) => (settings.span = n),
      ),
      slider(
        'vitesse',
        { min: 40, max: 220, step: 10, value: settings.pace, show: (n) => `${n} px/s` },
        (n) => (settings.pace = n),
      ),
      slider(
        'sensibilité',
        { min: 0.5, max: 2.5, step: 0.25, value: settings.sensitivity, show: (n) => `×${n}` },
        (n) => (settings.sensitivity = n),
      ),
    ],
    { keep: true },
  )
}

// ——— the frame ———

const ribbon = ribbons()
const man = rider()
let heardOnce = false
let last = performance.now()
let shown = ''
function frame(now: number) {
  const dt = Math.max(0, Math.min(0.05, (now - last) / 1000))
  last = now
  const t = now / 1000

  // what is heard: the finger first, otherwise the voice
  const heard: Heard | null =
    finger !== null ? { midi: midiOf(finger), level: 0.3 } : voice ? voice.read(dt, settings.sensitivity) : null
  if (heard) heardOnce = true
  // the ribbon scrolls, and what goes out on the left is forgotten
  if (playing) {
    scroll += settings.pace * dt
    ribbon.add(scroll, heard)
    ribbon.prune(scroll - headX() - 60)
  }
  man.step(dt, ribbon, settings.pace, screenX, headX(), yOf, H)
  button?.set(ribbon.empty)

  g.fillStyle = '#000'
  g.fillRect(0, 0, W, H)
  scale(g, W, lo(), hi(), yOf, heard?.midi ?? null)
  ribbon.draw(g, scroll, headX(), yOf)
  man.draw(g, screenX)
  // the head: a white dot, and the name of the note, in its colour
  if (heard) {
    const y = yOf(heard.midi)
    g.fillStyle = '#fff'
    g.beginPath()
    g.arc(headX(), y, 1.5 + heard.level * 3, 0, Math.PI * 2)
    g.fill()
    g.font = `13px 'JetBrains Mono', ui-monospace, monospace`
    g.textAlign = 'left'
    g.textBaseline = 'middle'
    g.fillStyle = `hsl(${hue(heard.midi)} 85% 70%)`
    g.fillText(noteName(heard.midi), headX() + 22, y)
  }

  // at the bottom right: the note heard, in hertz, and the volume; or, if the mic has heard nothing yet, a hint
  const text = heard
    ? `${noteName(heard.midi)} · ${Math.round(toHz(heard.midi))} Hz · volume ${Math.round(heard.level * 100)} %`
    : voice && !heardOnce && t - since > 6
      ? 'le micro n’entend rien ? le cadenas, à côté de l’adresse, permet d’en choisir un autre'
      : playing
        ? 'silence'
        : ''
  if (text !== shown) readout.textContent = shown = text
  requestAnimationFrame(frame)
}
requestAnimationFrame(frame)
