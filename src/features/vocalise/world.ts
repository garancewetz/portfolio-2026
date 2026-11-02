// Le monde de Vocalise : des bouts de colline, séparés par des précipices, jusqu'à l'aube (le quarantième). La lueur
// court seule ; un son la fait sauter, et tant que le son dure, elle plane (elle monte moins vite, puis redescend
// tout doucement) ; quand il s'arrête, elle retombe. Plus le précipice est large, plus il faut tenir le son. Et pour
// que ça ne ronronne pas, des motifs : des pics qui pendent au-dessus du vide (un « a » bref, sinon on s'y cogne),
// une corniche plus haute (il faut tenir pour y monter), des marches courtes à enchaîner (« a · a · a »). Plus la
// nuit avance, plus elle court vite, et plus les bouts de colline sont courts. Tout est mesuré en pixels du monde
// (x croît vers la droite) ; s : l'échelle (la hauteur de page).

// le nombre de précipices jusqu'à l'aube
export const DAWN = 40

// un bout de colline : de x0 à x1, son sommet (dy : plus haut ou plus bas que la ligne, en fraction de la page), la
// vitesse à laquelle on y court ; et le précipice qui le suit : combien de secondes de son il demande (hold), s'il
// a des pics au-dessus (roof), et s'il a été franchi. Le dernier (final) va jusqu'au bout du monde
export type Ledge = {
  x0: number
  x1: number
  dy: number
  run: number
  hold: number
  roof: boolean
  crossed: boolean
  final?: boolean
}

// les forces (en pixels par seconde, à l'échelle 1) : la vitesse de course, l'élan du saut, la pesanteur (en
// tenant le son, puis sans), et la chute lente quand on plane
const RUN = 250
const JUMP = 560
const RISE_HELD = 1000
const RISE = 2800
const FALL = 2400
const GLIDE = 70
// (les pics : à cette hauteur au-dessus du sol ; un saut bref passe dessous, un saut tenu s'y cogne)
const ROOF = 110

export function physics(s: number, pace: number) {
  return { run: RUN * s * pace, jump: JUMP * s, riseHeld: RISE_HELD * s, rise: RISE * s, fall: FALL * s, glide: GLIDE * s }
}
export type Physics = ReturnType<typeof physics>

// un pas de la lueur dans l'air (vy : vers le bas)
export function fly(vy: number, held: boolean, dt: number, k: Physics) {
  if (vy < 0) return vy + (held ? k.riseHeld : k.rise) * dt
  return held ? Math.min(k.glide, vy + k.fall * dt) : vy + k.fall * dt
}

// le temps passé en l'air, si l'on tient le son hold secondes, pour retomber `rise` pixels plus haut qu'au départ
// (négatif : plus bas) ; null si l'on n'y monte jamais
export function airtime(hold: number, k: Physics, rise = 0) {
  const dt = 1 / 240
  let y = 0
  let vy = -k.jump
  let t = 0
  let reached = rise <= 0
  while (t < 12) {
    vy = fly(vy, t < hold, dt, k)
    y += vy * dt
    t += dt
    if (y <= -rise) reached = true
    if (reached && vy > 0 && y >= -rise) return t
    if (!reached && vy > 0) return null
  }
  return t
}

// le sommet d'un bout de colline, sur la page ; et le bas des pics au-dessus du précipice qui le suit
export const ground = (l: Ledge, H: number) => H * (0.72 + l.dy)
export const roofOf = (l: Ledge, next: Ledge, H: number, s: number) =>
  Math.min(ground(l, H), ground(next, H)) - ROOF * s

// (un nombre entre 0 et 1, toujours le même pour un même n et une même nuit)
const hash = (n: number) => {
  const s = Math.sin(n * 91.7 + 17.3) * 43758.5453
  return s - Math.floor(s)
}

// seed : le numéro de la nuit (chaque partie a ses propres précipices)
export function world(seed: number) {
  const r = (n: number) => hash(n + seed * 1013.7)
  const ledges: Ledge[] = []
  let n = 0
  // (les marches qui restent à poser, dans un escalier « a · a · a » ; et après un motif, un précipice simple)
  let steps = 0
  let calm = 0
  return {
    ledges,
    // le monde jusqu'à `until` (au-delà du bord droit de la page), pour une page de hauteur H, à l'échelle s, et à
    // la vitesse choisie dans les réglages (pace)
    grow(until: number, H: number, s: number, pace: number) {
      if (!ledges.length) {
        const k = physics(s, pace)
        ledges.push({ x0: -2000, x1: k.run * 3, dy: 0, run: k.run, hold: 0, roof: false, crossed: false })
      }
      for (let last = ledges[ledges.length - 1]; last.x1 < until && !last.final; last = ledges[ledges.length - 1]) {
        if (n === DAWN) {
          last.final = true
          last.x1 = last.x0 + 1e7
          break
        }
        // plus la nuit avance, plus on court vite (jusqu'à 60 % de plus), et plus les collines sont courtes
        const night = n / DAWN
        const k = physics(s, pace * (1 + 0.6 * night))
        last.run = k.run
        let dy = Math.max(-0.12, Math.min(0.06, last.dy * 0.4 + (r(n + 0.25) - 0.5) * 0.06))
        let len = k.run * (1 + r(n + 0.5) * 1.4) * (1 - 0.35 * night)
        const pick = calm > 0 ? 0.5 : r(n * 3.7 + 0.75)
        calm = Math.max(0, calm - 1)
        if (steps > 0 || (n >= 5 && pick > 0.82)) {
          // une marche : un saut bref, et un bout de colline très court
          steps = steps > 0 ? steps - 1 : 2
          if (!steps) calm = 1
          last.hold = 0
          len = k.run * (0.38 + r(n + 0.6) * 0.14)
          dy = last.dy
        } else if (n >= 6 && pick < 0.16) {
          // des pics au-dessus du vide : un « a » bref passe dessous
          last.roof = true
          last.hold = 0
          dy = last.dy
          calm = 1
        } else if (n >= 9 && pick < 0.32 && last.dy > -0.04) {
          // une corniche plus haute : il faut tenir pour y monter
          dy = last.dy - 0.1
          last.hold = 0.5 + r(n + 0.9) * 0.6
          calm = 1
        } else if (n % 5 === 4) last.hold = 0.2 * r(n)
        else last.hold = n < 2 ? 0 : Math.min(3.5, 0.3 + n * 0.07 + r(n) * 0.9)
        // (un peu moins large que le saut : on peut sauter un peu tôt, ou tenir un peu court ; mais pas trop, sinon
        // un long saut atterrit loin après le bord, et passe par-dessus un bout de colline court)
        const rise = (last.dy - dy) * H
        let air = airtime(last.hold, k, rise)
        while (air === null) air = airtime((last.hold += 0.1), k, rise)
        const x0 = last.x1 + Math.max(k.run * 0.28, k.run * (air - Math.min(0.3, air * 0.25)))
        ledges.push({ x0, x1: x0 + len, dy, run: k.run, hold: 0, roof: false, crossed: false })
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
    // le dernier bout de colline commencé avant x
    before(x: number) {
      let found = ledges[0]
      for (const l of ledges) if (l.x0 <= x) found = l
      return found
    },
    after(l: Ledge) {
      return ledges[ledges.indexOf(l) + 1] ?? null
    },
    // le numéro du précipice qui suit ce bout de colline (le premier : 1)
    number(l: Ledge) {
      return n - (ledges.length - 1 - ledges.indexOf(l)) + 1
    },
  }
}
export type World = ReturnType<typeof world>
