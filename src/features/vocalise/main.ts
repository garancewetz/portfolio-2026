import './vocalise.css'
import { mount } from '@/features/carnet/carnet'
import { gear, slider } from '@/features/carnet/gear'
import { local, sheet } from '@/features/carnet/sheet'
import { frontHill, hills, keys, light, note, path, sky } from './draw'
import { intro } from './intro'
import { MELODIES } from './melodies'
import { noteName, toHz, toMidi } from './pitch'
import { listen, MicError, type Heard, type Voice } from './voice'

// Vocalise : une petite lueur traverse la nuit, au-dessus des collines. Elle avance seule (le paysage défile) ; la
// voix, au micro, la fait monter et descendre : plus la note est aiguë, plus elle monte. En silence, elle se pose.
// Sur son chemin flottent des notes à attraper ; elles ne sont pas là au hasard : ce sont des chansons (voir
// melodies.ts), dont le nom n'apparaît qu'une fois passées. Sur le bord gauche, un petit clavier de piano, debout,
// montre la note qu'on chante. À l'arrivée, le principe et la demande du micro, puis un court réglage sur la voix
// (intro.ts) ; sans micro, on joue au doigt (appuyer : plus haut, plus aigu). La roue crantée règle l'étendue
// (combien d'octaves, du bas au haut de la page) et la note du milieu.

const main = document.querySelector<HTMLElement>('.vo')!
const canvas = main.querySelector<HTMLCanvasElement>('.vo-sky')!
const g = canvas.getContext('2d')!
const hud = main.querySelector<HTMLElement>('.vo-note')!
const score = main.querySelector<HTMLElement>('.vo-score')!
const caption = main.querySelector<HTMLElement>('.vo-caption')!

// la voix, de bas en haut de la page : la note du milieu (en demi-tons, MIDI) et l'étendue (en octaves). Par
// défaut, de 80 à 600 Hz (de quoi chanter, voix graves comme aiguës) ; le réglage resserre autour de la voix
const DEFAULT = { centre: toMidi(Math.sqrt(80 * 600)), span: Math.log2(600 / 80) }
const range = { ...DEFAULT }
const lo = () => range.centre - range.span * 6
const hi = () => range.centre + range.span * 6

let W = 0
let H = 0
// la bande où la lueur vole : sous la ligne du carnet, au-dessus des collines
const top = () => 56
const bottom = () => H * 0.78
const yOf = (midi: number) => bottom() - ((midi - lo()) / (hi() - lo())) * (bottom() - top())
const midiOf = (y: number) => lo() + ((bottom() - y) / (bottom() - top())) * (hi() - lo())
// la lueur : son abscisse (fixe : c'est le paysage qui défile), le pas d'un temps de musique, et la vitesse
const lightX = () => Math.max(70, W * 0.28)
const beat = () => Math.min(130, Math.max(70, W * 0.11))
const speed = () => beat() * 1.4

function resize() {
  ;({ w: W, h: H } = sheet())
  const dpr = Math.min(2, devicePixelRatio || 1)
  canvas.width = Math.round(W * dpr)
  canvas.height = Math.round(H * dpr)
  g.setTransform(dpr, 0, 0, dpr, 0, 0)
}
resize()
// (en développement, la feuille de style arrive après le script : on remesure quand la page prend sa taille)
new ResizeObserver(resize).observe(main)

// ——— ce qui joue ———

let voice: Voice | null = null
let playing = false
// le doigt (ou la souris) appuyé sur la page : sa hauteur fait la note, comme une voix
let finger: number | null = null
main.addEventListener('pointerdown', (e) => {
  if (!playing) return
  finger = local(e).y
  // (le doigt peut sortir de la page sans la lâcher)
  try {
    main.setPointerCapture(e.pointerId)
  } catch {
    // (un appui déjà relâché)
  }
})
main.addEventListener('pointermove', (e) => {
  if (finger !== null) finger = local(e).y
})
for (const type of ['pointerup', 'pointercancel'] as const) main.addEventListener(type, () => (finger = null))

let travelled = 0
let y = 0
let glow = 0
let caught = 0
// le chemin de la voix (en coordonnées du paysage : il défile avec lui)
const trail: { x: number; y: number }[] = []

// la chanson en cours : ses notes, posées dans le paysage (x), à leur hauteur (midi), et attrapées ou pas (at :
// quand) ; puis, une fois passée, son nom
type Note = { x: number; midi: number; at: number | null }
let song: { name: string; notes: Note[]; end: number; told: boolean } | null = null
let next = 0
function sing() {
  const m = MELODIES[next++ % MELODIES.length]
  // (la tonique un peu sous le milieu : les chansons montent plus qu'elles ne descendent)
  const tonic = Math.round(range.centre) - 4
  let x = travelled + W + beat()
  const notes = m.notes.map(([degree, length]) => {
    const n = { x, midi: tonic + degree, at: null }
    x += length * beat()
    return n
  })
  song = { name: m.name, notes, end: x, told: false }
}
function tell(name: string, got: number, of: number) {
  caption.innerHTML = `c’était <em>${name}</em> <span>${got}/${of}</span>`
  caption.classList.add('is-on')
  setTimeout(() => caption.classList.remove('is-on'), 3600)
}

// ——— l'arrivée, et le réglage sur la voix ———

let tuning: { notes: number[]; held: number } | null = null
const door = intro(main, {
  async mic() {
    door.asking(true)
    try {
      voice = await listen()
      tuning = { notes: [], held: 0 }
      door.tune(null, 0)
    } catch (e) {
      door.fail(e instanceof MicError ? e.why : 'unsupported')
    } finally {
      door.asking(false)
    }
  },
  finger() {
    voice?.stop()
    voice = null
    play()
  },
  // (pas de réglage : la plage par défaut)
  skip: () => play(),
})
// on a tenu la note assez longtemps : le milieu de la page un peu au-dessus (une note confortable est plutôt dans
// le bas de la voix), et deux octaves de haut en bas
function tuned(notes: number[]) {
  const sorted = [...notes].sort((a, b) => a - b)
  range.centre = sorted[sorted.length >> 1] + 3
  range.span = 2
  play()
}
function play() {
  tuning = null
  playing = true
  door.close()
  main.classList.add('is-playing')
  settings()
}

// la roue crantée (dans la ligne du carnet) : l'étendue et la note du milieu, une fois la voix réglée
const slot = mount()
let geared = false
function settings() {
  if (!slot || geared) return
  geared = true
  gear(
    slot,
    'Réglages de Vocalise',
    [
      slider(
        'étendue',
        { min: 1, max: 3.5, step: 0.25, value: range.span, show: (n) => `${n} oct.` },
        (n) => (range.span = n),
      ),
      slider(
        'milieu',
        { min: 40, max: 80, step: 1, value: Math.round(range.centre), show: (n) => noteName(n) },
        (n) => (range.centre = n),
      ),
    ],
    { keep: true },
  )
}

// ——— l'image ———

let last = performance.now()
let shown = ''
function frame(now: number) {
  const dt = Math.max(0, Math.min(0.05, (now - last) / 1000))
  last = now
  const t = now / 1000

  // ce qu'on entend : le doigt d'abord, sinon la voix
  const heard: Heard | null =
    finger !== null ? { midi: midiOf(finger), level: 0.6 } : voice ? voice.read(dt) : null

  if (tuning) {
    // le réglage : une note tenue (à un demi-ton près), une seconde en tout
    const prev = tuning.notes[tuning.notes.length - 1]
    if (heard && (prev === undefined || Math.abs(heard.midi - prev) < 1)) {
      tuning.notes.push(heard.midi)
      tuning.held += dt
    } else if (heard) tuning = { notes: [heard.midi], held: 0 }
    door.tune(heard ? noteName(heard.midi) : null, Math.min(1, tuning.held / 1.2))
    if (tuning.held >= 1.2) tuned(tuning.notes)
  }

  // la lueur : elle file vers la note chantée ; en silence, elle descend lentement se poser sur la colline
  const lx = lightX()
  const rest = frontHill(lx, H, travelled) - 16
  if (!y) y = rest
  if (heard && playing) {
    const target = Math.min(rest, Math.max(top(), yOf(heard.midi)))
    y += (target - y) * (1 - Math.exp(-dt * 10))
  } else y += (rest - y) * (1 - Math.exp(-dt * 0.9))
  y = Math.min(y, rest)
  glow += ((heard && playing ? 0.35 + heard.level * 0.65 : 0) - glow) * (1 - Math.exp(-dt * 6))

  travelled += speed() * dt * (playing ? 1 : 0.25)
  const tip = trail[trail.length - 1]
  if (!tip || travelled + lx - tip.x > 3) trail.push({ x: travelled + lx, y })
  while (trail.length && trail[0].x - travelled < -10) trail.shift()

  // les notes : attrapées quand la lueur passe dessus (à un demi-ton et demi près)
  if (playing && !song) sing()
  if (song) {
    const near = Math.max(14, ((bottom() - top()) / (hi() - lo())) * 1.5)
    for (const n of song.notes) {
      if (n.at !== null) continue
      if (Math.abs(n.x - travelled - lx) < beat() * 0.35 && Math.abs(yOf(n.midi) - y) < near && glow > 0.2) {
        n.at = t
        score.textContent = `♪ ${++caught}`
      }
    }
    // la chanson est passée : son nom ; puis, un peu plus loin, la suivante
    if (!song.told && song.end - travelled < lx - beat()) {
      song.told = true
      tell(song.name, song.notes.filter((n) => n.at !== null).length, song.notes.length)
    }
    if (song.end - travelled < -beat() * 2) song = null
  }

  // le dessin
  g.clearRect(0, 0, W, H)
  sky(g, W, H, travelled, t)
  keys(g, W, lo(), hi(), yOf, heard && playing ? heard.midi : null)
  hills(g, W, H, travelled)
  path(
    g,
    trail.map((p) => ({ x: p.x - travelled, y: p.y })),
    lx,
  )
  if (song)
    for (const n of song.notes) {
      const x = n.x - travelled
      if (x < -40 || x > W + 40) continue
      if (n.at !== null && t - n.at > 0.9) continue
      note(g, x, yOf(n.midi), t, n.at === null ? null : t - n.at)
    }
  light(g, lx, y, glow, t)

  // la note entendue, en bas à gauche (en toutes lettres, et en hertz)
  const text = heard && playing ? `${noteName(heard.midi)} · ${Math.round(toHz(heard.midi))} Hz` : '—'
  if (text !== shown) hud.textContent = shown = text
  requestAnimationFrame(frame)
}
requestAnimationFrame(frame)
