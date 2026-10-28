// Où est Yaya ? Les morceaux du collage qui s'écartent un peu sous la souris (voir scene.ts) : chacun fuit la souris
// de côté (vers la droite si elle est sur sa gauche, et inversement), d'autant plus qu'elle est près ; les
// feuillages s'abaissent aussi un peu. Ça ne découvre jamais tout : derrière un buisson, on n'aperçoit qu'un bout
// de Yaya, il faut fouiller.

import type { Layout, Rect } from './spots'

// de combien chaque morceau s'écarte, au plus : de côté (en part de sa largeur, ou en pixels pour les montagnes)
// et vers le bas (en part de la hauteur de l'écran, pour les feuillages ; en part de sa hauteur, pour les maisons)
export const PUSH = { mountains: 5, houses: { x: 0.3, y: 0.04 }, leaves: { x: 0.16, y: 0.05 } }
// jusqu'à quelle distance de la souris un morceau la sent encore (en pixels)
const NEAR = 70

type Offset = { x: number; y: number }
const zero = (n: number) => Array.from({ length: n }, () => ({ x: 0, y: 0 }))

export function push(houses: number, leaves: number) {
  const off = { mountains: zero(3), village: zero(houses), leaves: zero(leaves) }

  // à quel point la souris est près du morceau (1 dessus, 0 loin), et de quel côté il doit fuir (de -1 à 1)
  function feel(r: Rect, mx: number, my: number) {
    const dx = Math.max(r.x - mx, 0, mx - (r.x + r.w))
    const dy = Math.max(r.y - my, 0, my - (r.y + r.h))
    const near = Math.max(0, 1 - Math.hypot(dx, dy) / NEAR)
    const side = Math.tanh((3 * (r.x + r.w / 2 - mx)) / (r.w / 2))
    return { near, side }
  }
  function follow(o: Offset, x: number, y: number, ease: number) {
    o.x += (x - o.x) * ease
    o.y += (y - o.y) * ease
  }

  return {
    // suivre la souris, en douceur (L : les morceaux là où ils sont sans elle)
    update(L: Layout, H: number, mx: number, my: number, dt: number) {
      const ease = 1 - Math.exp(-dt * 4)
      ;[L.m1, L.m2, L.m3].forEach((r, k) => {
        const f = feel(r, mx, my)
        follow(off.mountains[k], PUSH.mountains * f.side * f.near, 0, ease)
      })
      L.village.forEach((r, k) => {
        const f = feel(r, mx, my)
        follow(off.village[k], PUSH.houses.x * r.w * f.side * f.near, PUSH.houses.y * r.h * f.near, ease)
      })
      L.leaves.forEach((r, k) => {
        const f = feel(r, mx, my)
        follow(off.leaves[k], PUSH.leaves.x * r.w * f.side * f.near, PUSH.leaves.y * H * f.near, ease)
      })
    },
    // les morceaux écartés
    apply(L: Layout): Layout {
      const move = (r: Rect, o: Offset) => ({ ...r, x: r.x + o.x, y: r.y + o.y })
      return {
        m1: move(L.m1, off.mountains[0]),
        m2: move(L.m2, off.mountains[1]),
        m3: move(L.m3, off.mountains[2]),
        village: L.village.map((r, k) => move(r, off.village[k])),
        leaves: L.leaves.map((r, k) => move(r, off.leaves[k])),
      }
    },
  }
}
