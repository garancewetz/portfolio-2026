// Le monde de Vocalise : des bouts de colline, séparés par des précipices, et la lueur qui court dessus. Elle avance
// seule ; un son la fait sauter, et tant que le son dure, elle plane (elle monte moins vite, puis redescend tout
// doucement) ; quand il s'arrête, elle retombe. Plus le précipice est large, plus il faut tenir le son. Les
// précipices s'élargissent peu à peu (avec, de temps en temps, un petit pour souffler). Tombée, elle reprend un peu
// avant le bord. Tout est mesuré en pixels du monde (x croît vers la droite) ; s : l'échelle (la hauteur de page).

// un bout de colline : de x0 à x1, son sommet (dy : un peu plus haut ou plus bas que la ligne, en fraction de la
// page) ; et le précipice qui le suit : combien de secondes de son il demande (hold), et s'il a été franchi
export type Ledge = { x0: number; x1: number; dy: number; hold: number; crossed: boolean }

// les forces (en pixels par seconde, à l'échelle 1) : la vitesse de course, l'élan du saut, la pesanteur (en
// tenant le son, puis sans), et la chute lente quand on plane
const RUN = 250
const JUMP = 560
const RISE_HELD = 1000
const RISE = 2800
const FALL = 2400
const GLIDE = 70

export function physics(s: number, pace: number) {
  return { run: RUN * s * pace, jump: JUMP * s, riseHeld: RISE_HELD * s, rise: RISE * s, fall: FALL * s, glide: GLIDE * s }
}
type Physics = ReturnType<typeof physics>

// un pas de la lueur dans l'air (vy : vers le bas)
export function fly(vy: number, held: boolean, dt: number, k: Physics) {
  if (vy < 0) return vy + (held ? k.riseHeld : k.rise) * dt
  return held ? Math.min(k.glide, vy + k.fall * dt) : vy + k.fall * dt
}

// le temps passé en l'air, si l'on tient le son hold secondes (le saut commence au bord, et finit à la même hauteur)
export function airtime(hold: number, k: Physics) {
  const dt = 1 / 240
  let y = 0
  let vy = -k.jump
  let t = 0
  while (t < 12) {
    vy = fly(vy, t < hold, dt, k)
    y += vy * dt
    t += dt
    if (y >= 0 && vy > 0) return t
  }
  return t
}

// (un nombre entre 0 et 1, toujours le même pour un même n : le monde ne change pas d'une partie à l'autre)
const hash = (n: number) => {
  const s = Math.sin(n * 91.7 + 17.3) * 43758.5453
  return s - Math.floor(s)
}

// combien de secondes de son le n-ième précipice demande : un saut simple au début, puis de plus en plus long,
// jusqu'à quatre secondes ; un sur cinq, un petit, pour souffler
export function holdFor(n: number) {
  if (n < 2) return 0
  if (n % 5 === 4) return 0.2 * hash(n)
  return Math.min(4, 0.3 + n * 0.22 + hash(n) * 0.5)
}

export function world() {
  const ledges: Ledge[] = []
  let n = 0
  return {
    ledges,
    // le monde jusqu'à `until` (au-delà du bord droit de la page), à la vitesse et à l'échelle du moment
    grow(until: number, k: Physics) {
      if (!ledges.length) ledges.push({ x0: -2000, x1: k.run * 3, dy: 0, hold: 0, crossed: false })
      for (let last = ledges[ledges.length - 1]; last.x1 < until; last = ledges[ledges.length - 1]) {
        last.hold = holdFor(n)
        // (un peu moins large que le saut : on peut sauter un peu tôt, ou atterrir un peu court)
        const gap = Math.max(k.run * 0.28, k.run * airtime(last.hold, k) * 0.82)
        const x0 = last.x1 + gap
        const len = k.run * (1 + hash(n + 0.5) * 1.4)
        ledges.push({ x0, x1: x0 + len, dy: (hash(n + 0.25) - 0.5) * 0.06, hold: 0, crossed: false })
        n++
      }
    },
    // (on oublie ce qui est loin derrière)
    prune(before: number) {
      while (ledges.length > 2 && ledges[1].x1 < before) ledges.shift()
    },
    // le bout de colline sous x, s'il y en a un
    under(x: number) {
      return ledges.find((l) => x >= l.x0 && x <= l.x1) ?? null
    },
    // le dernier bout de colline commencé avant x (celui d'où l'on a sauté, quand on tombe)
    before(x: number) {
      let found = ledges[0]
      for (const l of ledges) if (l.x0 <= x) found = l
      return found
    },
    // le numéro du précipice qui suit ce bout de colline (le premier : 1)
    number(l: Ledge) {
      return n - (ledges.length - 1 - ledges.indexOf(l)) + 1
    },
  }
}
export type World = ReturnType<typeof world>
