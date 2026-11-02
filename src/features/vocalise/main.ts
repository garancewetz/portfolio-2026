import './vocalise.css'
import { mount } from '@/features/carnet/carnet'
import { gear, slider } from '@/features/carnet/gear'
import { local, sheet } from '@/features/carnet/sheet'
import { controls } from './controls'
import { intro } from './intro'
import { hue, noteName, toHz, toMidi } from './pitch'
import { ribbons } from './ribbon'
import { rider } from './rider'
import { RULES } from './rules'
import { scale } from './scale'
import { listen, MicError, type Heard, type Voice } from './voice'

// Vocalise : un fond noir, et la voix qui y dessine un ruban de lumière. Les règles sont simples, et écrites dans le
// coin de la page (rules.ts) : la note fait la hauteur (aigu en haut) et la couleur (un tour du cercle des couleurs
// par octave), le volume fait l'épaisseur et l'éclat ; le ruban file vers la gauche et reste, et un silence le coupe
// (ribbon.ts). Dessus, un petit bonhomme marche, glisse dans les descentes, et saute d'un ruban à l'autre
// (rider.ts). Sur le bord gauche, la gamme, à la même hauteur et de la même couleur (scale.ts). En bas, deux boutons
// (controls.ts) : figer le dessin, et l'enregistrer en image. Sans micro, on dessine au doigt (appuyer : plus haut,
// plus aigu). La roue crantée règle le registre (la note du milieu), l'étendue, la vitesse, et la sensibilité.

const main = document.querySelector<HTMLElement>('.vo')!
const canvas = main.querySelector<HTMLCanvasElement>('.vo-canvas')!
const g = canvas.getContext('2d')!
const readout = main.querySelector<HTMLElement>('.vo-note')!

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
// (en développement, la feuille de style arrive après le script : on remesure quand la page prend sa taille)
new ResizeObserver(resize).observe(main)

// les réglages : la note du milieu de la page (MIDI ; par défaut, entre 90 et 750 Hz, de quoi chanter grave ou
// aigu), l'étendue (en octaves, du bas au haut de la page), la vitesse du ruban (en pixels par seconde, et le pas du
// bonhomme) et la sensibilité du micro
const settings = { centre: Math.round(toMidi(Math.sqrt(90 * 750))), span: 3, pace: 100, sensitivity: 1 }
const lo = () => settings.centre - settings.span * 6
const hi = () => settings.centre + settings.span * 6
// la bande où passe le ruban : sous la ligne du carnet, au-dessus du bas de la page
const yOf = (midi: number) => H - 40 - ((midi - lo()) / (hi() - lo())) * (H - 96)
const midiOf = (y: number) => lo() + ((H - 40 - y) / (H - 96)) * (hi() - lo())
// la tête du ruban sur la page, où en est le défilement (en pixels du monde), et où tombe un point du monde sur la page
const headX = () => W * 0.72
let scroll = 0
const screenX = (x: number) => headX() - (scroll - x)

// ——— ce qui chante ———

let voice: Voice | null = null
let playing = false
// le doigt (ou la souris) appuyé : sa hauteur fait la note, à volume doux
let finger: number | null = null
main.addEventListener('pointerdown', (e) => {
  if (!playing) return
  finger = local(e).y
  try {
    main.setPointerCapture(e.pointerId)
  } catch {
    // (un appui déjà relâché)
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
  // (une seule fois)
  if (playing) return
  playing = true
  since = performance.now() / 1000
  door.close()
  main.classList.add('is-playing')
  // les règles restent, dans le coin ; les boutons apparaissent
  main.insertAdjacentHTML('beforeend', RULES)
  buttons = controls(main, { freeze: () => freeze(frozenAt === null), save })
  settingsUp()
}

// ——— figer, enregistrer ———

// l'heure à laquelle le ruban s'est arrêté (null : il file)
let frozenAt: number | null = null
let buttons: ReturnType<typeof controls> | null = null
function freeze(on: boolean) {
  frozenAt = on ? performance.now() / 1000 : null
  // (figé, le ruban qu'on chantait se termine : le bonhomme peut aller jusqu'au bout)
  if (on) ribbon.add(scroll, null)
}
function save() {
  canvas.toBlob((blob) => {
    if (!blob) return
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = 'vocalise.png'
    a.click()
    setTimeout(() => URL.revokeObjectURL(a.href), 1000)
  })
}
addEventListener('keydown', (e) => {
  // (sur un bouton ou une réglette, l'espace reste à eux)
  if (e.code !== 'Space' || !playing || (e.target instanceof Element && e.target.closest('button, input'))) return
  e.preventDefault()
  freeze(frozenAt === null)
})

// la ligne du carnet (le labo, la page, les voisines), et la roue crantée, une fois qu'on chante
const slot = mount()
function settingsUp() {
  if (!slot) return
  gear(
    slot,
    'Réglages de Vocalise',
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

// ——— l'image ———

const ribbon = ribbons()
const man = rider()
let heardOnce = false
let last = performance.now()
let shown = ''
function frame(now: number) {
  const dt = Math.max(0, Math.min(0.05, (now - last) / 1000))
  last = now
  const t = now / 1000

  // ce qu'on entend : le doigt d'abord, sinon la voix ; figé, plus rien ne dessine
  const read: Heard | null =
    finger !== null ? { midi: midiOf(finger), level: 0.3 } : voice ? voice.read(dt, settings.sensitivity) : null
  if (read) heardOnce = true
  const heard = frozenAt === null ? read : null
  // le ruban défile (sauf figé), et ce qui sort à gauche est oublié
  if (playing && frozenAt === null) {
    scroll += settings.pace * dt
    ribbon.add(scroll, heard)
    ribbon.prune(scroll - headX() - 60)
  }
  man.step(dt, ribbon, settings.pace, screenX, yOf, H)
  buttons?.set(frozenAt !== null, ribbon.empty)

  g.fillStyle = '#000'
  g.fillRect(0, 0, W, H)
  scale(g, W, lo(), hi(), yOf, heard?.midi ?? null)
  ribbon.draw(g, scroll, headX(), yOf)
  man.draw(g, screenX)
  // la tête : un point blanc, et le nom de la note, de sa couleur
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

  // en bas à droite : la note entendue, en hertz, et le volume ; ou, si le micro n'a encore rien entendu, un indice
  const text = heard
    ? `${noteName(heard.midi)} · ${Math.round(toHz(heard.midi))} Hz · volume ${Math.round(heard.level * 100)} %`
    : frozenAt !== null
      ? 'figé · espace pour reprendre'
      : voice && !heardOnce && t - since > 6
        ? 'le micro n’entend rien ? le cadenas, à côté de l’adresse, permet d’en choisir un autre'
        : playing
          ? 'silence'
          : ''
  if (text !== shown) readout.textContent = shown = text
  requestAnimationFrame(frame)
}
requestAnimationFrame(frame)
