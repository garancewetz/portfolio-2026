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

// Escalade : un petit bonhomme en caractères qui s'amuse avec la fenêtre du navigateur. À l'arrivée, ses caractères
// traînent en vrac ; au premier geste, il se rassemble et ramasse sa tête (intro.ts). Il marche le long du bas,
// grimpe aux côtés, avance suspendu au bord du haut, saute (body.ts) ; on l'attrape à la souris (input.ts). La
// fenêtre est sa boîte : la redimensionner le pousse, le fait tomber, l'écrase ; la déplacer vite le bouscule
// (shake.ts). Partout où il passe, il laisse une traînée (trail.ts). Quand on part sur un autre onglet, il s'endort
// (tab.ts). Et d'une fenêtre à l'autre, posées côte à côte, il passe (windows.ts).

const main = document.querySelector<HTMLElement>('.es')!
const man = main.querySelector<HTMLElement>('.es-man')!
const hint = main.querySelector<HTMLElement>('.es-hint')!

// la taille de la page, et celle du bonhomme (sa boîte : 3 caractères sur 4 lignes)
const size = () => {
  const { w: W, h: H } = sheet()
  return { W, H, w: man.offsetWidth, h: man.offsetHeight }
}
// (dessiné d'abord : sa boîte a sa taille avant qu'on le pose au milieu)
man.textContent = STAND.join('\n')
const trail = createTrail(main.querySelector<HTMLCanvasElement>('.es-trail')!)
const { body, step, start, fall, drag } = createBody(size, trail)
const shake = createShake()

// la porte, et son seuil (un trait qui reste) ; quand la fenêtre change de taille, elle change de place
const door = createDoor(main, size)
const placeDoor = () => {
  door.move()
  trail.clear()
}
placeDoor()
addEventListener('resize', placeDoor)
// arrivé devant la porte : coucou, la porte s'ouvre, il entre, elle se referme ; puis un nouveau niveau (la page se
// vide, il revient en bas, la porte est ailleurs)
let entering = false
function enter() {
  entering = true
  body.where = 'door'
  body.face = 1
  // (devant la porte, les pieds sur le bas de la porte)
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

// l'arrivée : ses caractères en vrac, qui se rassemblent au premier geste
const loose = intro(main, man, STAND, () => ({ x: body.x, y: body.y }))

const { steer } = input(main, {
  body,
  size,
  onGesture: () => {
    hint.classList.add('is-off')
    // (pas encore formé : le premier geste le rassemble)
    if (!loose.formed) loose.start()
  },
  drop: (vx, vy) => body.where === 'carried' && fall(vx, vy),
  drag,
})

// il s'endort quand on part sur un autre onglet ; il sursaute au retour
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

// d'une fenêtre à l'autre
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
// marcher (ou sauter) contre un bord qui touche une autre fenêtre : il y passe
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

// la posture : l'image qui va avec ce qu'il fait, et le chemin parcouru (une image tous les STRIDE px)
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
let was = body.where // (où il était, à l'image d'avant)
function frame(now: number) {
  const dt = Math.max(0, Math.min(0.05, (now - last) / 1000))
  last = now
  const { ax, ay } = shake(dt)
  if (loose.formed) {
    const k = steer()
    step(dt, k, ax, ay)
    // (le saut est un appui : consommé)
    k.jump = false
    // devant la porte (accroché à un trait, en sautant, en tombant ; pas promené à la souris) : il a gagné
    const free = body.where === 'line' || body.where === 'air' || body.where === 'wall' || body.where === 'ceiling'
    if (!entering && free && door.reached(body.x, body.y, man.offsetWidth, man.offsetHeight)) enter()
    crossing((k.right ? 1 : 0) - (k.left ? 1 : 0))
  }
  const text = sprite(now).join('\n')
  if (text !== drawn) man.textContent = drawn = text
  man.style.transform = `translate(${body.x}px, ${body.y}px)`
  // la traînée part de son pied arrière (derrière lui, du côté d'où il vient) ; ailleurs ou endormi, elle
  // s'interrompt
  // (attrapé à l'instant : il a sauté jusqu'au curseur, la traînée reprend de là)
  if (body.where === 'carried' && was !== 'carried') trail.lift()
  was = body.where
  if (loose.formed && body.where !== 'away' && body.where !== 'sleep' && body.where !== 'door')
    trail.to(body.face === 1 ? body.x + 5 : body.x + man.offsetWidth - 5, body.y + man.offsetHeight)
  else trail.lift()
  man.style.visibility = loose.formed && body.where !== 'away' ? '' : 'hidden'
  requestAnimationFrame(frame)
}
requestAnimationFrame(frame)

// la page dans le carnet (voir features/carnet), et sa roue crantée (la traînée)
const slot = mount()
if (slot) trail.settings(slot)
