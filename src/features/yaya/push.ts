// Où est Yaya ? The pieces of the collage that move aside a little under the mouse (see scene.ts): each one flees
// the mouse sideways (to the right if it is on its left, and vice versa), the more so the closer it is; the
// foliage also lowers a little. It never uncovers everything: behind a bush, you only glimpse a bit of Yaya, you
// have to search.

import type { Layout, Rect } from './spots'

// how far each piece moves aside, at most: sideways (as a share of its width, or in pixels for the mountains)
// and downwards (as a share of the screen height, for the foliage; as a share of its height, for the houses)
export const PUSH = { mountains: 5, houses: { x: 0.3, y: 0.04 }, leaves: { x: 0.16, y: 0.05 } }
// up to what distance from the mouse a piece still feels it (in pixels)
const NEAR = 70

type Offset = { x: number; y: number }
const zero = (n: number) => Array.from({ length: n }, () => ({ x: 0, y: 0 }))

export function push(houses: number, leaves: number) {
  const off = { mountains: zero(3), village: zero(houses), leaves: zero(leaves) }

  // how close the mouse is to the piece (1 on it, 0 far), and which way it must flee (from -1 to 1)
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
    // follow the mouse, smoothly (L: the pieces where they are without it)
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
    // the pieces moved aside
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
