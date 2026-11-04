import type { Creature, Pose } from './art'

// Les dessins d'une créature à l'écran : retournés quand elle va vers la gauche, calés en bas d'une même boîte (elle ne
// saute pas d'une pose à l'autre) ; endormie, accroupie avec un z au-dessus de la tête.

// retourner un dessin : chaque ligne à l'envers (toutes de la même largeur), et les signes qui ont un sens, échangés
const PAIRS: Record<string, string> = { '/': '\\', '\\': '/', '(': ')', ')': '(', '<': '>', '>': '<', '[': ']', ']': '[', '{': '}', '}': '{' }
export const mirror = (p: Pose, w: number) =>
  p.map((l) => [...l.padEnd(w)].reverse().map((c) => PAIRS[c] ?? c).join(''))

// (en bas de sa boîte, h lignes de haut)
export const pad = (p: Pose, h: number) => [...Array(Math.max(0, h - p.length)).fill(''), ...p].join('\n')

// endormie : accroupie, et un z qui grandit puis recommence, au-dessus de la tête (tous les combien de secondes)
const BREATH = 1.4
export const asleep = (crouch: Pose, w: number, t: number) => {
  const z = ['z', 'Z'][Math.floor(t / BREATH) % 2]
  return [z.padStart(w - 1), ...crouch]
}

export const rand = (a: number, b: number) => a + Math.random() * (b - a)

export type Phase = 'idle' | 'walk' | 'climb' | 'air' | 'fly' | 'crouch' | 'sleep'

// (un pas, une prise : tous les combien de pixels l'image change)
const STRIDE = 11
const GRIP = 8

// le dessin d'une créature selon ce qu'elle fait : son geste ; (la loutre) si elle glisse ; le chemin fait depuis le
// début du geste ; sa vitesse vers le haut ; son âge ; (en vol) ses battements par seconde
export function pick(c: Creature, w: number, s: { phase: Phase; slide: boolean; moved: number; vy: number; t: number; flaps: number }): Pose {
  const { phase, moved, t } = s
  if (phase === 'walk' && s.slide) return c.crouch
  if (phase === 'walk') return Math.floor(moved / STRIDE) % 2 ? c.walk : c.idle
  if (phase === 'climb') return Math.floor(moved / GRIP) % 2 ? c.climb2 : c.climb
  // (en vol, et en planant après un saut, celles qui volent battent des ailes ou des oreilles)
  if (c.fly && (phase === 'fly' || (phase === 'air' && s.vy < 0))) return c.fly[Math.floor(t * s.flaps) % c.fly.length]
  if (phase === 'air') return c.jump
  if (phase === 'crouch') return c.crouch
  if (phase === 'sleep') return asleep(c.crouch, w, t)
  return c.idle
}
