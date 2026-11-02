import './vocalise.css'
import { mount } from '@/features/carnet/carnet'
import { gear, slider } from '@/features/carnet/gear'
import { sheet } from '@/features/carnet/sheet'
import { far, ground, ledges, light, path, sky } from './draw'
import { intro } from './intro'
import { listen, MicError, type Heard, type Voice } from './voice'
import { fly, physics, world, type Ledge } from './world'

// Vocalise : une petite lueur court sur les collines, la nuit, et devant elle s'ouvrent des précipices (world.ts).
// On joue à la voix : un son, n'importe lequel, la fait sauter ; tant qu'il dure, elle plane ; quand il s'arrête,
// elle retombe. Au-dessus de chaque précipice, le son qu'il demande, en lettres (« a » : un saut ; « aaaaaaa » : un
// long souffle) ; ils s'élargissent peu à peu. Tombée, elle reprend un peu avant le bord, et l'on voit combien de
// temps on a tenu, et combien il fallait. À l'arrivée, le principe et la demande du micro, puis un court essai
// (intro.ts) ; sans micro, on joue au doigt, ou à la barre d'espace (appuyer : le son). La roue crantée règle la
// sensibilité du micro et la vitesse.

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
const k = () => physics(scale(), settings.pace)

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

const land = world()
// la lueur, dans le monde : x, sa hauteur sur la page (y) et sa vitesse verticale (vers le bas)
// (from : le bout de colline qu'elle a quitté en dernier, d'où elle repart si elle tombe)
const me = { x: 0, y: 0, vy: 0, on: null as Ledge | null, from: null as Ledge | null, air: 0, stuck: false }
// le son : est-ce qu'il dure, depuis quand (pour le saut), et depuis quand on l'a lancé (un son lancé juste avant
// d'atterrir fait sauter à l'atterrissage)
let was = false
let held = 0
let asked = 9
// (combien de temps le son a tenu pendant le dernier saut)
let airHeld = 0
let glow = 0
let fallen = 0
let record = 0
try {
  record = Number(localStorage.getItem('vocalise.record')) || 0
} catch {
  // (pas de mémoire ici : un record pour la visite)
}
const trail: { x: number; y: number }[] = []

function tell(html: string) {
  caption.innerHTML = html
  caption.classList.add('is-on')
  clearTimeout(tell.timer)
  tell.timer = setTimeout(() => caption.classList.remove('is-on'), 2800)
}
tell.timer = 0 as ReturnType<typeof setTimeout> | 0
const seconds = (s: number) => `${s.toFixed(1).replace('.', ',')} s`

// (repartir un peu avant le bord du bout de colline d'où l'on est tombé)
function respawn() {
  const from = me.from ?? land.before(me.x)
  me.x = Math.max(from.x0 + 10, from.x1 - k().run * 1.1)
  me.y = ground(from, H)
  me.vy = 0
  me.on = from
  me.from = from
  me.stuck = false
  trail.length = 0
  fallen = 0
}

// ——— l'arrivée, et l'essai du micro ———

let trying: { held: number } | null = null
const door = intro(main, {
  async mic() {
    door.asking(true)
    try {
      voice = await listen()
      trying = { held: 0 }
      door.tune(false, 0)
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
  // (on part du début d'un bout de colline, avec de l'élan devant soi)
  land.grow(me.x + W * 1.5, k())
  me.x = Math.max(me.x, (me.on ?? land.before(me.x)).x1 - k().run * 2)
  me.on = land.before(me.x)
  me.y = ground(me.on, H)
  me.vy = 0
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
function frame(now: number) {
  const dt = Math.max(0, Math.min(0.05, (now - last) / 1000))
  last = now
  const t = now / 1000
  const K = k()

  // ce qu'on entend : le doigt (ou l'espace), sinon la voix
  const heard: Heard = pressed ? { on: true, level: 0.6 } : voice ? voice.read(dt, settings.sensitivity) : { on: false, level: 0 }
  const on = heard.on
  const onset = on && !was
  was = on
  held = on ? held + dt : 0
  asked = onset ? 0 : asked + dt

  if (trying) {
    if (on) trying.held += dt
    door.tune(on, Math.min(1, trying.held / 0.8))
    if (trying.held >= 0.8) play()
  }

  // le monde, devant et derrière
  land.grow(me.x + W * 1.5, K)
  land.prune(me.x - W * 1.5)
  if (!me.y) respawn()

  // la lueur : elle court (avant de jouer, au pas)
  const step = K.run * dt * (playing ? 1 : 0.35)
  if (!me.stuck) me.x += step
  if (me.on) {
    me.air = 0
    me.from = me.on
    // (au bout de la colline, elle part dans le vide)
    if (me.x > me.on.x1) me.on = null
    else if (playing && asked < 0.15) {
      me.vy = -K.jump
      me.on = null
      asked = 9
      airHeld = 0
    } else if (!playing && me.x > me.on.x1 - K.run * 0.5) {
      // (avant de jouer, elle saute toute seule)
      me.vy = -K.jump * 0.8
      me.on = null
    }
  } else {
    // (un son lancé juste après le bord compte encore)
    me.air += dt
    if (playing && onset && me.air < 0.12 && me.vy >= 0) {
      me.vy = -K.jump
      asked = 9
      airHeld = 0
    }
    if (on) airHeld += dt
    const before = me.y
    me.vy = fly(me.vy, on || !playing, dt, K)
    me.y += me.vy * dt
    const below = land.under(me.x)
    if (below) {
      const top = ground(below, H)
      if (me.vy >= 0 && before <= top + 2 && me.y >= top) {
        me.y = top
        me.vy = 0
        me.on = below
        // le précipice d'avant est franchi
        const prev = land.ledges[land.ledges.indexOf(below) - 1]
        if (prev && !prev.crossed && playing) {
          prev.crossed = true
          const n = land.number(prev)
          if (n > record) {
            record = n
            try {
              localStorage.setItem('vocalise.record', String(n))
            } catch {
              // (pas de mémoire ici)
            }
          }
        }
      } else if (me.y > top + 4) me.stuck = true
    }
    // tombée : ce qu'on a tenu, et ce qu'il fallait ; puis on reprend
    if (me.y > H + 40) {
      fallen += dt
      if (fallen === dt && playing) {
        const from = me.from ?? land.before(me.x)
        // (passée par-dessus le bout de colline d'en face : trop long)
        const over = (land.ledges[land.ledges.indexOf(from) + 1]?.x0 ?? Infinity) < me.x
        tell(
          over
            ? `<em>trop long</em> <span>tenu ${seconds(airHeld)}, il fallait ≈ ${seconds(from.hold)}</span>`
            : from.hold < 0.25
              ? `un petit « a », <em>au bord</em>`
              : `tenu <em>${seconds(airHeld)}</em> <span>il fallait ≈ ${seconds(from.hold)}</span>`,
        )
      }
      if (fallen > 0.6) respawn()
    }
  }
  if (me.on) me.y = ground(me.on, H)
  glow += ((on && playing ? 0.35 + heard.level * 0.65 : 0) - glow) * (1 - Math.exp(-dt * 8))

  const travelled = me.x - lightX()
  const tip = trail[trail.length - 1]
  if (!tip || me.x - tip.x > 3) trail.push({ x: me.x, y: me.y - 10 })
  while (trail.length && trail[0].x - travelled < -10) trail.shift()

  // le dessin
  g.clearRect(0, 0, W, H)
  sky(g, W, H, travelled, t)
  far(g, W, H, travelled)
  ledges(g, W, H, land.ledges, travelled)
  path(
    g,
    trail.map((p) => ({ x: p.x - travelled, y: p.y })),
    lightX(),
  )
  light(g, lightX(), me.y - 10, glow, t)

  // en bas : le son qu'on tient (et depuis combien de temps), et les précipices franchis
  const ahead = me.on ?? land.before(me.x)
  const text = on && playing ? `${'a'.repeat(1 + Math.min(14, Math.floor(held * 4)))} · ${seconds(held)}` : '—'
  if (text !== shown) hud.textContent = shown = text
  const s = `précipice ${land.number(ahead)} · record ${record}`
  if (score.textContent !== s) score.textContent = s
  requestAnimationFrame(frame)
}
requestAnimationFrame(frame)
