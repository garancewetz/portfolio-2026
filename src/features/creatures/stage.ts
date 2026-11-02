import type { Creature, Pose } from './art'

// La piste d'une créature : une longue bande, un petit mur à chaque bout. La créature la traverse en marchant ; au
// bout, elle grimpe un peu sur le mur, saute en arrière, s'accroupit en se recevant, fait demi-tour, et repart dans
// l'autre sens. Le geste en cours s'écrit sous la piste. Tournée vers la gauche, son dessin est retourné.

// en pixels par seconde : sa marche, sa grimpe ; la hauteur où elle grimpe ; la pesanteur de son saut
const WALK = 46
const CLIMB = 22
const HIGH = 30
const GRAVITY = 900
// (un pas, une prise : tous les combien de pixels l'image change)
const STRIDE = 11
const GRIP = 8

// retourner un dessin : chaque ligne à l'envers (toutes de la même largeur), et les signes qui ont un sens, échangés
const PAIRS: Record<string, string> = { '/': '\\', '\\': '/', '(': ')', ')': '(', '<': '>', '>': '<', '[': ']', ']': '[', '{': '}', '}': '{' }
const mirror = (p: Pose, w: number) =>
  p.map((l) => [...l.padEnd(w)].reverse().map((c) => PAIRS[c] ?? c).join(''))

type Phase = 'walk' | 'climb' | 'jump' | 'crouch'
const LABEL: Record<Phase, string> = { walk: 'marche', climb: 'grimpe', jump: 'saute', crouch: 's’accroupit' }

export function stage(lane: HTMLElement, art: HTMLElement, label: HTMLElement, c: Creature, w: number, h: number) {
  const pad = (p: Pose) => [...Array(h - p.length).fill(''), ...p].join('\n')
  let phase: Phase = 'walk'
  // dir : 1 vers la droite, -1 vers la gauche ; x, y : depuis le bas à gauche de la piste, en pixels
  let dir = Math.random() < 0.5 ? 1 : -1
  let x = -1
  let y = 0
  let vx = 0
  let vy = 0
  let moved = 0
  let wait = 0
  let shown = ''

  const pose = (): Pose => {
    if (phase === 'walk') return Math.floor(moved / STRIDE) % 2 ? c.walk : c.idle
    if (phase === 'climb') return Math.floor(moved / GRIP) % 2 ? c.climb2 : c.climb
    if (phase === 'jump') return c.jump
    return c.crouch
  }

  return (dt: number) => {
    // (la place : la largeur de la piste, moins celle de la créature et des deux murs)
    const wall = 14
    const max = Math.max(0, lane.clientWidth - art.offsetWidth - 2 * wall)
    if (x < 0) x = Math.random() * max
    if (phase === 'walk') {
      x += dir * WALK * dt
      moved += WALK * dt
      if (x <= 0 || x >= max) {
        x = Math.max(0, Math.min(max, x))
        phase = 'climb'
        moved = 0
      }
    } else if (phase === 'climb') {
      y += CLIMB * dt
      moved += CLIMB * dt
      if (y >= HIGH) {
        // (elle se retourne, et saute vers le milieu de la piste)
        phase = 'jump'
        dir = -dir
        vx = dir * 70
        vy = 260
      }
    } else if (phase === 'jump') {
      x = Math.max(0, Math.min(max, x + vx * dt))
      vy -= GRAVITY * dt
      y += vy * dt
      if (y <= 0) {
        y = 0
        phase = 'crouch'
        wait = 0.45
      }
    } else if ((wait -= dt) <= 0) {
      phase = 'walk'
      moved = 0
    }

    const text = pad(dir === 1 ? pose() : mirror(pose(), w))
    if (text !== shown) art.textContent = shown = text
    art.style.transform = `translate(${wall + x}px, ${-y}px)`
    if (label.textContent !== LABEL[phase]) label.textContent = LABEL[phase]
  }
}
