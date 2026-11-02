import './vocalise.css'
import { mount } from '@/features/carnet/carnet'
import { gear, slider } from '@/features/carnet/gear'
import { sheet } from '@/features/carnet/sheet'
import { colours, sun } from './dawn'
import { far, ledges, light, path, sky } from './draw'
import { hero } from './hero'
import { intro } from './intro'
import { listen, MicError, type Heard, type Voice } from './voice'
import { DAWN, physics, world } from './world'

// Vocalise : une petite lueur court sur les collines, la nuit, et devant elle s'ouvrent quarante précipices, jusqu'à
// l'aube (world.ts). On joue à la voix : un son, n'importe lequel, la fait sauter ; tant qu'il dure, elle plane ;
// quand il s'arrête, elle retombe (hero.ts). Au-dessus de chaque précipice, le son qu'il demande, en lettres
// (« a » : un saut ; « aaaaaaa » : un long souffle) ; en chemin, des pics, des corniches, des marches, et elle court
// de plus en plus vite. Tombée, elle reprend un peu avant le bord, et l'on voit combien de temps on a tenu, et
// combien il fallait. De précipice en précipice, la nuit s'éclaircit (dawn.ts) ; au quarantième, le soleil se lève,
// et un son repart pour une autre nuit. À l'arrivée sur la page, le principe et la demande du micro, puis un court
// essai (intro.ts) ; sans micro, on joue au doigt, ou à la barre d'espace (appuyer : le son). La roue crantée règle
// la sensibilité du micro et la vitesse.

const main = document.querySelector<HTMLElement>('.vo')!
const canvas = main.querySelector<HTMLCanvasElement>('.vo-sky')!
const g = canvas.getContext('2d')!
const hud = main.querySelector<HTMLElement>('.vo-note')!
const score = main.querySelector<HTMLElement>('.vo-score')!
const caption = main.querySelector<HTMLElement>('.vo-caption')!

let W = 0
let H = 0
// l'échelle (une page de 700 pixels de haut : 1), et la lueur : son abscisse sur la page (fixe : c'est le monde qui
// défile)
const scale = () => Math.max(0.55, Math.min(1.3, H / 700))
const lightX = () => Math.max(70, W * 0.24)
const settings = { sensitivity: 1, pace: 1 }

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
// le doigt, la souris ou la barre d'espace, appuyés : comme un son
let pressed = false
main.addEventListener('pointerdown', () => playing && (pressed = true))
for (const type of ['pointerup', 'pointercancel'] as const) main.addEventListener(type, () => (pressed = false))
addEventListener('keydown', (e) => {
  if (e.code !== 'Space' || !playing) return
  e.preventDefault()
  pressed = true
})
addEventListener('keyup', (e) => e.code === 'Space' && (pressed = false))

// la nuit en cours (chaque nuit a ses précipices), et la lueur
let night = 0
let land = world(night)
const lueur = hero()
const me = lueur.me
// le son : est-ce qu'il dure, depuis quand, et depuis quand on l'a lancé (un son lancé juste avant d'atterrir fait
// sauter à l'atterrissage)
let was = false
let held = 0
let asked = 9
let glow = 0
// la partie : les précipices franchis, les chutes, l'aube (quand), et où en est le ciel (de 0 à 1, qui suit les
// précipices franchis sans à-coups)
let crossed = 0
let falls = 0
let fallen = 0
let dawnAt = 0
let sky01 = 0
let best = Infinity
try {
  best = Number(localStorage.getItem('vocalise.aube')) || Infinity
} catch {
  // (pas de mémoire ici : un record pour la visite)
}
const trail: { x: number; y: number }[] = []

function tell(html: string, ms = 2800) {
  caption.innerHTML = html
  caption.classList.add('is-on')
  clearTimeout(tell.timer)
  if (ms < Infinity) tell.timer = setTimeout(() => caption.classList.remove('is-on'), ms)
}
tell.timer = 0 as ReturnType<typeof setTimeout> | 0
const seconds = (s: number) => `${s.toFixed(1).replace('.', ',')} s`
const plural = (n: number, word: string) => `${n} ${word}${n > 1 ? 's' : ''}`

// une nouvelle nuit : d'autres précipices, et la lueur au départ, avec de l'élan devant elle
function restart() {
  land = world(++night)
  land.grow(W * 2, H, scale(), settings.pace)
  const first = land.ledges[0]
  lueur.place(first, first.x1 - first.run * 2, H)
  crossed = falls = fallen = dawnAt = 0
  trail.length = 0
  caption.classList.remove('is-on')
}

// (repartir un peu avant le bord du bout de colline d'où l'on est tombé)
function respawn() {
  const from = me.from ?? land.before(me.x)
  lueur.place(from, Math.max(from.x0 + 10, from.x1 - from.run * 1.1), H)
  trail.length = 0
  fallen = 0
}

// tombée : pourquoi, en quelques mots (cognée aux pics, trop loin, trop court)
function why() {
  const from = me.from ?? land.before(me.x)
  const over = (land.after(from)?.x0 ?? Infinity) < me.x
  if (me.bumped) return `<em>trop long</em> <span>sous les pics, un « a » bref</span>`
  if (over) return `<em>trop long</em> <span>tenu ${seconds(me.held)}, il fallait ≈ ${seconds(from.hold)}</span>`
  if (from.hold < 0.25) return `un petit « a », <em>au bord</em>`
  return `tenu <em>${seconds(me.held)}</em> <span>il fallait ≈ ${seconds(from.hold)}</span>`
}

// l'aube : le compte, le record (le moins de chutes), et l'invitation à repartir
function dawn(t: number) {
  dawnAt = t
  const record = falls < best
  if (record) {
    best = falls
    try {
      localStorage.setItem('vocalise.aube', String(falls))
    } catch {
      // (pas de mémoire ici)
    }
  }
  const tally = falls ? plural(falls, 'chute') : 'sans tomber'
  const note = record && night > 1 ? ' · record' : best < Infinity && !record ? ` · record : ${best}` : ''
  tell(`<em>l’aube</em> <span>${tally}${note}</span><br><span>un son pour une autre nuit</span>`, Infinity)
}

// ——— l'arrivée, et l'essai du micro ———

let trying: { held: number; since: number } | null = null
const door = intro(main, {
  async mic() {
    door.asking(true)
    try {
      voice = await listen()
      trying = { held: 0, since: 0 }
      door.tune(false, 0, 0, false)
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
  skip: () => play(),
})
function play() {
  trying = null
  playing = true
  restart()
  door.close()
  main.classList.add('is-playing')
  gearUp()
}

// la roue crantée (dans la ligne du carnet) : la sensibilité du micro, et la vitesse de course
const slot = mount()
let geared = false
function gearUp() {
  if (!slot || geared) return
  geared = true
  gear(
    slot,
    'Réglages de Vocalise',
    [
      slider(
        'sensibilité',
        { min: 0.5, max: 2.5, step: 0.25, value: settings.sensitivity, show: (n) => `×${n}` },
        (n) => (settings.sensitivity = n),
      ),
      slider(
        'vitesse',
        { min: 0.6, max: 1.4, step: 0.1, value: settings.pace, show: (n) => `×${n}` },
        (n) => (settings.pace = n),
      ),
    ],
    { keep: true },
  )
}

// ——— l'image ———

let last = performance.now()
let shown = ''
let painted = ''
function frame(now: number) {
  const dt = Math.max(0, Math.min(0.05, (now - last) / 1000))
  last = now
  const t = now / 1000
  const s = scale()

  // ce qu'on entend : le doigt (ou l'espace), sinon la voix
  const heard: Heard = pressed
    ? { on: true, level: 0.6, meter: 1 }
    : voice
      ? voice.read(dt, settings.sensitivity)
      : { on: false, level: 0, meter: 0 }
  const on = heard.on
  const onset = on && !was
  was = on
  held = on ? held + dt : 0
  asked = onset ? 0 : asked + dt

  if (trying) {
    if (on) trying.held += dt
    // (presque rien depuis quatre secondes : sans doute le mauvais micro)
    trying.since += dt
    if (heard.meter > 0.15) trying.since = 0
    door.tune(on, Math.min(1, trying.held / 0.8), heard.meter, trying.since > 4)
    if (trying.held >= 0.8) play()
  }
  // (à l'aube, un son repart pour une autre nuit)
  if (dawnAt && t - dawnAt > 2.5 && onset) restart()

  // le monde devant et derrière, et un pas de la lueur (à la vitesse du bout de colline qu'elle a quitté)
  land.grow(me.x + W * 1.5, H, s, settings.pace)
  land.prune(me.x - W * 1.5)
  if (!me.y) lueur.place(land.ledges[0], 0, H)
  const k = { ...physics(s, settings.pace), run: (me.from ?? land.ledges[0]).run }
  const event = lueur.step(dt, { on, onset, asked }, land, k, H, s, playing)
  if (event && 'landed' in event) {
    const prev = land.ledges[land.ledges.indexOf(event.landed) - 1]
    if (prev && !prev.crossed && playing) {
      prev.crossed = true
      crossed++
    }
    if (event.landed.final && playing && !dawnAt) dawn(t)
  } else if (event) {
    fallen += dt
    if (fallen === dt && playing) {
      falls++
      tell(why())
    }
    if (fallen > 0.6) respawn()
  }
  glow += ((on && playing ? 0.35 + heard.level * 0.65 : 0) - glow) * (1 - Math.exp(-dt * 8))

  const travelled = me.x - lightX()
  const tip = trail[trail.length - 1]
  if (!tip || me.x - tip.x > 3) trail.push({ x: me.x, y: me.y - 10 })
  while (trail.length && trail[0].x - travelled < -10) trail.shift()

  // la nuit qui avance : le ciel (le fond de la page), les étoiles, les collines, et le soleil
  sky01 += ((playing ? crossed / DAWN : 0) - sky01) * (1 - Math.exp(-dt * 1.5))
  const c = colours(sky01)
  const bg = `linear-gradient(to bottom, ${c.top}, ${c.mid} 70%, ${c.low})`
  if (bg !== painted) main.style.background = painted = bg
  const rise = Math.max(0, (sky01 - 0.85) / 0.15) * 0.35 + (dawnAt ? Math.min(1, (t - dawnAt) / 5) * 0.65 : 0)

  // le dessin
  g.clearRect(0, 0, W, H)
  sky(g, W, H, travelled, t, 1 - sky01 ** 1.5)
  sun(g, W, H, rise)
  far(g, W, H, travelled, c.far)
  ledges(g, W, H, s, land.ledges, travelled, c.ledge)
  path(
    g,
    trail.map((p) => ({ x: p.x - travelled, y: p.y })),
    lightX(),
  )
  light(g, lightX(), me.y - 10, glow, t)

  // en bas : le son qu'on tient (et depuis combien de temps), et où l'on en est de la nuit
  const text = on && playing ? `${'a'.repeat(1 + Math.min(14, Math.floor(held * 4)))} · ${seconds(held)}` : '—'
  if (text !== shown) hud.textContent = shown = text
  const at = dawnAt ? 'l’aube' : `précipice ${Math.min(DAWN, crossed + 1)} / ${DAWN}`
  const line = playing ? `${at} · ${plural(falls, 'chute')}` : ''
  if (score.textContent !== line) score.textContent = line
  requestAnimationFrame(frame)
}
requestAnimationFrame(frame)
